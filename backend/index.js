import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

import admin from "firebase-admin";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); 
const allowedOrigins = ["http://localhost:3000", "http://ip:3000", "https://trackmoto.horsemendevs.com" , "https://omnitrackwebapp.onrender.com"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS")); // Proper error handling
      }
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);



// Initialize Firebase Admin SDK
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle line breaks for private_key
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  goole_api_key: process.env.REACT_APP_MAPS_API_KEY,
  goole_map_id: process.env.REACT_APP_GOOGLE_MAP_ID, 
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
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

app.post("/maps-api-key", (req, res) => {
  res.json({ apiKey: process.env.REACT_APP_MAPS_API_KEY });
});

app.post("/maps-google-id", (req, res) => {
  res.json({ mapsId: process.env.REACT_APP_GOOGLE_MAP_ID });
});

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

app.get("/api/distance", async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const apiKey = process.env.MAPS_API_KEY; // Store API Key in .env file

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch distance" });
  }
});

app.get("/api/routes", async (req, res) => {
  try {
      const { origin, destination } = req.query;
      const apiKey = process.env.MAPS_API_KEY; // Store API Key in .env file

      if (!origin || !destination) {
          return res.status(400).json({ error: "Origin and destination are required" });
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
          return res.status(400).json({ error: "Failed to fetch route", details: data });
      }

      res.json({ polyline: data.routes[0].overview_polyline.points });
  } catch (error) {
      console.error("Error fetching Google route:", error);
      res.status(500).json({ error: "Failed to fetch route" });
  }
});

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
      return res.status(400).json({ 
        id: "LoginError",
        message: "Username and password are required" });
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

    const deviceInfoMap = ownedDevices.reduce((map, device) => {
      map[device.Module] = {
        Color: device.Color || "#000000", // Default color if none is set
        Name: device.Name || "Unnamed Device", // Default name if none is set
      };
      return map;
    }, {});

    // Fetch coordinates from Firebase
    const coordinatesRef = db.ref('/coordinates2'); // Reference to the 'coordinates' node
    const coordinatesSnapshot = await coordinatesRef.once('value'); // Get all data from 'coordinates'
    const coordinatesData = coordinatesSnapshot.val();

    if (!coordinatesData) {
      return res.status(404).json({ error: 'No coordinates found' });
    }

    // Filter coordinates by owned modules
    const parsedCoordinates = Object.keys(coordinatesData)
    .map(id => {
      const coordinate = coordinatesData[id];
      const deviceInfo = deviceInfoMap[coordinate.Module] || {};
      return {
        Longitude: coordinate.Longitude,
        Latitude: coordinate.Latitude,
        Module: coordinate.Module,
        Timestamp: coordinate.Timestamp,
        Color: deviceInfo.Color || "#000000", // Map the color
        Name: deviceInfo.Name || "Unnamed Device", // Map the name
      };
    })
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
    const coordinatesRef = db.ref("/coordinates2");
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


// --------------- POST REQUEST FROM ESP32 HANDLER --------------- //

// Create an HTTP server with the Express app
const server = http.createServer(app);

// Initialize Socket.IO and bind it to the HTTP server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, 
    methods: ["GET", "POST"],
  },
});

app.post("/insert_gps", async (req, res) => {
  const { module, latitude, longitude } = req.body;

  // Validate required fields
  if (!module || latitude == null || longitude == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Format timestamp as YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Fetch all devices from the /devices path
    const devicesRef = db.ref("devices");
    const devicesSnapshot = await devicesRef.once("value");
    const devicesData = devicesSnapshot.val();

    // Find the device matching the given module and extract its color
    let color = "#000000"; // Default to black if no match is found
    if (devicesData) {
      Object.values(devicesData).forEach((device) => {
        if (device.Module === module) {
          color = device.Color || "#000000"; // Use default black if color is missing
        }
      });
    }

    // Create a base GPS entry (without color)
    const baseEntry = {
      Module: module,
      Latitude: latitude,
      Longitude: longitude,
      Timestamp: formattedTimestamp,
    };

    // Save baseEntry to Firebase under the /coordinates path
    const ref = db.ref("coordinates2");
    await ref.push(baseEntry); // Push base entry to Firebase

    // Add color for emitting via Socket.IO
    const newCoordinates = { ...baseEntry, Color: color };

    // Emit the new GPS data to all connected Socket.IO clients
    io.emit("new_coordinates", newCoordinates);

    res.status(200).json({
      message: "GPS data inserted successfully",
    });
  } catch (error) {
    console.error("Failed to insert GPS data:", error);
    res.status(500).json({ message: "Failed to insert GPS data", error });
  }
});


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 3 * 60 * 1000; // 3 minutes

  const signupRef = db.ref("/signup").push();

  await signupRef.set({
    email,
    otp,
    otpExpiry,
  });

  const msg = {
    to: email,
    from: {
      email: process.env.EMAIL_HOST,
      name: "TrackMoto",
    },
    subject: "TrackMoto Verification Code",
    text: `Your TrackMoto verification code is: ${otp}. It is valid for 3 minutes.`,
    html: `<h4>Your TrackMoto verification code is: <h1><strong>${otp}</strong></h1> It is valid for 3 minutes.</h4>`,
  };

  sgMail
    .send(msg)
    .then(() => res.json({ message: "Verification code sent successfully." }))
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Failed to send OTP." });
    });
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required." });

  const signupRef = db.ref("/signup");
  const snapshot = await signupRef.orderByChild("email").equalTo(email).once("value");

  if (!snapshot.exists()) return res.status(404).json({ error: "OTP not found." });

  const userData = Object.values(snapshot.val())[0];
  const userKey = Object.keys(snapshot.val())[0];

  if (userData.otp !== otp) return res.status(400).json({ error: "Invalid OTP." });

  if (Date.now() > userData.otpExpiry) return res.status(400).json({ error: "OTP has expired." });

  // OTP is valid
  res.json({ message: "OTP verified successfully.", signupId: userKey });
});

app.patch("/user-signup", async (req, res) => {
  const { signupId, username, password } = req.body;

  if (!signupId || !username || !password)
    return res.status(400).json({ error: "All fields are required." });

  const signupRef = db.ref(`/signup/${signupId}`);
  const snapshot = await signupRef.once("value");

  if (!snapshot.exists()) return res.status(404).json({ error: "Signup data not found." });

  const { email } = snapshot.val();

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const usersRef = db.ref("/users").push();

  await usersRef.set({
    email,
    username,
    password: hashedPassword, // Save the hashed password
    mobile: "",
    profileImage: "",
  });

  // Cleanup the /signup path
  await signupRef.remove();

  res.json({ message: "User signed up successfully." });
});


// --------------- CHANGE PASSWORD API --------------- //

app.post("/send-otp-cp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const usersRef = admin.database().ref("users");
    const snapshot = await usersRef.orderByChild("email").equalTo(email).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found with this email." });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = Date.now() + 3 * 60 * 1000; // Expires in 3 minutes

    // Get user key from Firebase
    const userKey = Object.keys(snapshot.val())[0];

    // Update OTP in Firebase
    await usersRef.child(userKey).update({
      otp,
      otpExpiry,
    });

    // Email message
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_HOST,
        name: "TrackMoto",
      },
      subject: "TrackMoto Password Reset OTP",
      text: `Your TrackMoto password reset code is: ${otp}. It is valid for 3 minutes.`,
      html: `<h4>Your TrackMoto password reset code is: <h1><strong>${otp}</strong></h1> It is valid for 3 minutes.</h4>`,
    };

    // Send OTP via email
    await sgMail.send(msg);

    return res.json({ message: "OTP sent successfully to your email." });

  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ error: "Failed to send OTP." });
  }
});

app.post("/verify-otp-cp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const usersRef = admin.database().ref("users");
    const snapshot = await usersRef.orderByChild("email").equalTo(email).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found." });
    }

    const userKey = Object.keys(snapshot.val())[0];
    const userData = snapshot.val()[userKey];

    // Check if OTP matches and is not expired
    if (userData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }
    if (Date.now() > userData.otpExpiry) {
      return res.status(400).json({ error: "OTP has expired." });
    }

    // Clear OTP after successful verification
    await usersRef.child(userKey).update({ otp: null, otpExpiry: null });

    return res.json({ message: "OTP verified successfully." });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Failed to verify OTP." });
  }
});

app.post("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required." });
  }

  try {
    const usersRef = admin.database().ref("users");
    const snapshot = await usersRef.orderByChild("email").equalTo(email).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "User not found." });
    }

    // Get user key from Firebase
    const userKey = Object.keys(snapshot.val())[0];

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 = salt rounds

    // Update password in Firebase
    await usersRef.child(userKey).update({ password: hashedPassword });

    return res.json({ message: "Password updated successfully!" });

  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ error: "Failed to update password." });
  }
});




// Start server
server.listen(port, "0.0.0.0", () => {
  console.log(`Connected to backend on port ${port}`);
});
