import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

import { fileURLToPath } from 'url';
import { readFile } from "fs/promises";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(
    cors({
      origin: "https://tm.horsemendevs.com", // for Hosting 'https://trackmoto.horsemendevs.com',
      methods: ["GET", "POST", "PATCH"],
      credentials: true, // Allow cookies to be sent
    })
  );

// Initialize Firebase Admin SDK
import { config } from "dotenv";

config(); // Load environment variables from .env file

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://capstone-c92e9-default-rtdb.firebaseio.com/",
});

const db = admin.database();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/images'));
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}_profileimage${ext}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, JPG, and PNG files are allowed."));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Serve the 'public' folder statically
app.use('/public', express.static(path.join(__dirname, 'public')));

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "This is the backend" });
});

// Session middleware
app.use(
    session({
      secret: "secret-key", 
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Prevents client-side JavaScript from accessing cookies
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      },
    })
);

// Get session user endpoint
app.get("/get-session-user", (req, res) => {
  if (req.session.user) {
    // Send the user details stored in the session
    res.json(req.session.user);
  } else {
    // Session does not exist or expired
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    try {
      // Fetch user from Firebase using the username
      const usersRef = db.ref("/users");
      const snapshot = await usersRef.orderByChild("username").equalTo(username).once("value");
      
      if (!snapshot.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const userData = snapshot.val();
      const userKey = Object.keys(userData)[0]; // Get the unique Firebase key for the user
      const user = userData[userKey]; // Get the user data using the unique key
      
      // Compare passwords
     
      const hashedPassword = user.password.trim();
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Check if the user has owned any devices
      const devicesRef = db.ref("/devices");
      const devicesSnapshot = await devicesRef.orderByChild("Owner").equalTo(userKey).once("value");
      const isNewUser = !devicesSnapshot.exists(); // User is new if no devices are found

      // Store user info in session
      req.session.user = {
        userId: userKey, // Use the Firebase unique ID as the userId
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        isNewUser, // Add the isNewUser flag
      };

      // Send response
      return res.json({
        userExists: true,
        message: "Login successful",
        user: {
          userId: userKey, // Include the Firebase unique ID in the response
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          profileImage: user.profileImage,
          isNewUser, // Include the isNewUser flag in the response
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.json({ message: "Logged out successfully" });
  });
});

app.post('/get-coordinates', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Fetch devices from Firebase
    const devicesRef = db.ref('/devices'); // Reference to the 'devices' node
    const devicesSnapshot = await devicesRef.once('value'); // Get all data from 'devices'
    const devicesData = devicesSnapshot.val();

    if (!devicesData) {
      return res.status(404).json({ error: 'No devices found' });
    }

    // Filter devices for the logged-in user and create a lookup for their Color
    const ownedDevices = Object.values(devicesData).filter(
      (device) => device.Owner === userId && device.Claimed
    );

    const deviceColorMap = ownedDevices.reduce((map, device) => {
      map[device.Module] = device.Color || "#000000"; // Use a default color if none is set
      return map;
    }, {});

    // Fetch coordinates from Firebase
    const coordinatesRef = db.ref('/coordinates'); // Reference to the 'coordinates' node
    const coordinatesSnapshot = await coordinatesRef.once('value'); // Get all data from 'coordinates'
    const coordinatesData = coordinatesSnapshot.val();

    if (!coordinatesData) {
      return res.status(404).json({ error: 'No coordinates found' });
    }

    // Filter coordinates by owned modules
    const parsedCoordinates = Object.keys(coordinatesData)
      .map(id => ({
        Longitude: coordinatesData[id].Longitude,
        Latitude: coordinatesData[id].Latitude,
        Module: coordinatesData[id].Module,
        Timestamp: coordinatesData[id].Timestamp,
        Color: deviceColorMap[coordinatesData[id].Module] || "#000000", // Map the color
      }))
      .filter((coordinate) => ownedDevices.some((device) => device.Module === coordinate.Module));

    res.json(parsedCoordinates); // Send filtered coordinates back to frontend
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/get-devices", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  try {
    const db = admin.database();
    const devicesRef = db.ref("/devices");
    const snapshot = await devicesRef.orderByChild("Owner").equalTo(userId).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: true, devices: [], message: "No devices found for this user." });
    }

    const devices = [];
    snapshot.forEach((childSnapshot) => {
      devices.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return res.json({ success: true, devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.patch("/claim-device", async (req, res) => {
  const { userId, deviceId } = req.body;

  if (!userId || !deviceId) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  try {
    // Reference the devices node
    const devicesRef = db.ref("/devices");
    const snapshot = await devicesRef.orderByKey().equalTo(deviceId).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Device ID not found." });
    }

    const deviceData = snapshot.val()[deviceId];

    if (deviceData.Claimed) {
      return res.status(400).json({ success: false, message: "Device is already claimed." });
    }

    // Update the ownership and claim status of the device
    await devicesRef.child(deviceId).update({
      Owner: userId,
      Claimed: true,
    });

    // Fetch coordinates for the claimed device and include the device's color
    const coordinatesRef = db.ref("/coordinates");
    const coordSnapshot = await coordinatesRef.orderByChild("Module").equalTo(deviceData.Module).once("value");

    const coordinates = [];
    if (coordSnapshot.exists()) {
      coordSnapshot.forEach((child) => {
        const coordinate = child.val();
        // Include the color from the device data
        coordinates.push({
          ...coordinate,
          Color: deviceData.Color || "#000000", // Fallback to black if no color is set
        });
      });
    }

    // Fetch all devices owned by the user after claiming the new device
    const userDevicesRef = db.ref("/devices").orderByChild("Owner").equalTo(userId);
    const userDevicesSnapshot = await userDevicesRef.once("value");

    const devices = [];
    if (userDevicesSnapshot.exists()) {
      userDevicesSnapshot.forEach((childSnapshot) => {
        devices.push({
          id: childSnapshot.key, // Include the deviceId as `id`
          ...childSnapshot.val(), // Spread all other device properties
        });
      });
    }

    // Send back the updated data
    return res.json({
      success: true,
      message: "Device successfully claimed.",
      coordinates, // Include updated coordinates with Color
      devices, // Include the user's updated devices with device_id
    });
  } catch (error) {
    console.error("Error claiming device:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.patch('/update-device', async (req, res) => {
  const { userId, deviceId, newName, newColor } = req.body;

  if (!userId || !deviceId || !newName) {
      return res.status(400).json({ success: false, message: "Invalid input." });
  }

  try {
      const deviceRef = db.ref(`/devices/${deviceId}`);
      const snapshot = await deviceRef.once("value");

      if (!snapshot.exists()) {
          return res.status(404).json({ success: false, message: "Device not found." });
      }

      const deviceData = snapshot.val();

      // Validate ownership
      if (deviceData.Owner !== userId) {
          return res.status(403).json({ success: false, message: "Unauthorized action." });
      }

      // Update device name
      await deviceRef.update({ 
        Name: newName,
        Color: newColor,
      });

      return res.status(200).json({ success: true, message: "Device updated successfully." });
  } catch (error) {
      console.error("Error updating device:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.patch('/update-user-profile', async (req, res) => {
    const { userId, username, mobile, email } = req.body;

    // Validate required inputs
    if (!userId || (!username && !mobile && !email)) {
        return res.status(400).json({ success: false, message: "Invalid input." });
    }

    try {
        const userRef = db.ref(`/users/${userId}`);
        const snapshot = await userRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userData = snapshot.val();

        // Prepare update object
        const updatedData = {};
        if (username) updatedData.username = username;
        if (mobile) updatedData.mobile = mobile;
        if (email) updatedData.email = email;

        // Update user profile
        await userRef.update(updatedData);

        // Update session with the new values
        if (req.session.user) {
            if (username) req.session.user.username = username;
            if (mobile) req.session.user.mobile = mobile;
            if (email) req.session.user.email = email;

            // Save the session changes
            req.session.save((err) => {
                if (err) {
                    console.error("Error saving session:", err);
                    return res.status(500).json({ success: false, message: "Error saving session." });
                }

                return res.status(200).json({
                    success: true,
                    message: "User profile updated successfully.",
                    updatedUser: req.session.user, // Return updated session user info
                });
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "User profile updated successfully. No session to update.",
            });
        }
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
});

app.post("/update-profile-image", upload.single("image"), async (req, res) => {
    const { userId } = req.body;

    // Validate required fields
    if (!userId || !req.file) {
        return res.status(400).json({ success: false, message: "Invalid input or missing image file." });
    }

    try {
        // Get the user from Firebase by userId
        const userRef = db.ref(`/users/${userId}`);
        const snapshot = await userRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const newImagePath = req.file.filename;
        // Update user profile with the new image path
        await userRef.update({ profileImage: newImagePath });

        // Update session with the new values
        if (req.session.user) {
            if (newImagePath) req.session.user.profileImage = newImagePath;

            // Save the session changes
            req.session.save((err) => {
                if (err) {
                    console.error("Error saving session:", err);
                    return res.status(500).json({ success: false, message: "Error saving session." });
                }

                return res.status(200).json({
                    success: true,
                    message: "Profile image updated successfully.",
                    updatedUser: req.session.user, // Return updated session user info
                });
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "Profile image updated successfully. No session to update.",
                profileImage: newImagePath,
            });
        }
    } catch (error) {
        console.error("Error updating profile image:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
});
    
app.patch('/remove-device', async (req, res) => {
  const { userId, deviceId } = req.body;
  
  try {
    // Retrieve the device data from the database
    const deviceRef = db.ref(`/devices/${deviceId}`);
    const deviceSnapshot = await deviceRef.once('value');
    const deviceData = deviceSnapshot.val();

    if (!deviceData) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    // Validate ownership
    if (deviceData.Owner !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    // Update the device properties
    await deviceRef.update({
      Claimed: false,
      Owner: null,
    });
    
    // Check if the user still owns any devices
    const userDevicesRef = db.ref(`/devices`).orderByChild("Owner").equalTo(userId);
    const userDevicesSnapshot = await userDevicesRef.once('value');
    const userDevices = userDevicesSnapshot.val();

    // If no devices are owned, mark the user as a new user
    const isNewUser = !userDevices || Object.keys(userDevices).length === 0;

    return res.status(200).json({
      success: true,
      message: "Device successfully removed",
      isNewUser, // Return the isNewUser flag
    });

  } catch (error) {
    console.error("Error removing device:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.patch('/remove-image', async (req, res) => {
  const { userId } = req.body;

  try {
    // Retrieve the user data from Firebase
    const userRef = db.ref(`/users/${userId}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate that the user has a profile image to remove
    const profileImage = userData.profileImage;
    if (!profileImage) {
      return res.status(400).json({ success: false, message: "No profile image to remove." });
    }

    // Construct the path to the image file
    const imagePath = path.join(__dirname, 'public/images', path.basename(profileImage));

    // Remove the profile image field from the database
    await userRef.update({
      profileImage: null, // Set the profileImage field to null
    });

    // Check if the file exists before deleting
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return res.status(500).json({ success: false, message: "Failed to delete image from server." });
      }

      console.log("File successfully deleted:", imagePath);

      // Update session with the new values
      if (req.session.user) {
        req.session.user.profileImage = null;

        // Save the session changes
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ success: false, message: "Error saving session." });
          }

          return res.status(200).json({
            success: true,
            message: "Profile image updated successfully.",
            updatedUser: req.session.user, // Return updated session user info
          });
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Profile image updated successfully. No session to update.",
        });
      }
    });
  } catch (error) {
    console.error("Error removing profile image:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Connected to backend on port ${PORT}`);
});
