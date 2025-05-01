import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Components/UserContext"; 
import './LoginSignup.css'; // Make sure this points to your CSS file
import bikeImage from '../images/bike.png';
import locationImage from '../images/location.png';
import motorbg from '../images/motorbg.png';
import trackiconlogin from '../images/motoricon.png'

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, loginUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for "Forgot Password" modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false); // State for verification modal
  const [email, setEmail] = useState(""); // Email Address input
  const [verificationCode, setVerificationCode] = useState(""); // Verification code input
  const [isNewPasswordModalOpen, setIsNewPasswordModalOpen] = useState(false); // State for new password modal
  const [newPassword, setNewPassword] = useState(""); // New password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password input

  const [errorFields, setErrorFields] = useState({
    username: false,
    password: false,
  });
  

  const handleSignUpClick = () => {
    navigate("/signup"); // Redirect to Sign Up page
  };

  const handleBackClick = () => {
    navigate("/WelcomePage2"); // Redirect to Welcome Page (Desktop Reso)
  };

  const handleCloseClick = () => {
    navigate("/WelcomePage2"); // Redirect to Sign Up page
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrorFields = { username: false, password: false };
  
    if (!username) {
      newErrorFields.username = true;
      hasError = true;
    }
  
    if (!password) {
      newErrorFields.password = true;
      hasError = true;
    }
  
    setErrorFields(newErrorFields);

    if (hasError) {
      setErrorMessage("Username and password are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8800/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Include credentials (cookies)
      });

      const data = await response.json();

      if (response.ok && data.userExists) {
        // Update user context
        await loginUser(data.user);

        // Redirect to the protected page (e.g., Monitor page)
        navigate("/Monitor");
      } else {
        setErrorMessage(data.message || "Login failed");
        setErrorFields({ username: true, password: true });
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  const handleForgotPasswordClick = () => {
    setErrorMessage(""); // Clear previous error messages
    setIsModalOpen(true);
  };

  const [resetEmail, setResetEmail] = useState(""); // ✅ Store email locally

  const handleSendResetCode = async (e) => {
    e.preventDefault(); // ✅ Prevent page reload
  
    if (!email) {
      setErrorMessage("Please enter your email.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8800/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code.");
      }
  
      console.log("Stored email for OTP verification:", email);
      setResetEmail(email); // ✅ Store email in local state (not UserContext)
  
      alert("OTP sent successfully!");
      setIsModalOpen(false);
      setIsVerificationModalOpen(true);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
  
    if (!verificationCode) {
      setErrorMessage("Please enter the verification code.");
      return;
    }
  
    if (!resetEmail) {  // ✅ Check if email is stored
      setErrorMessage("Something went wrong. Please request OTP again.");
      return;
    }
  
    try {
      console.log("Verifying OTP for email:", resetEmail); // ✅ Debugging
  
      const response = await fetch("http://localhost:8800/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail, otp: verificationCode }), // ✅ Use resetEmail
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("Code verified successfully! Please reset your password.");
        setIsVerificationModalOpen(false);
        setIsNewPasswordModalOpen(true);
        setVerificationCode("");
      } else {
        setErrorMessage(data.error || "Invalid verification code.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
  
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Both password fields are required.");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
  
    if (!resetEmail) { // ✅ Check if email is stored
      setErrorMessage("Something went wrong. Please request OTP again.");
      return;
    }
  
    try {
      console.log("Updating password for email:", resetEmail); // ✅ Debugging
  
      const response = await fetch("http://localhost:8800/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail, newPassword }), // ✅ Use resetEmail
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("Password reset successfully!");
        setIsNewPasswordModalOpen(false);
        setNewPassword("");
        setConfirmPassword("");
        navigate("/login");
      } else {
        setErrorMessage(data.error || "Failed to reset password.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };
  
  
  

  return (
    <div className="starting-container">
          {isVerificationModalOpen && (
        <div className="modal-forgot-pass">
          <div className="modal-content-forgot-pass">
            <span
              className="close-button"
              onClick={() => setIsVerificationModalOpen(false)}
            >
              &times;
            </span>
            <h2>Verify Reset Code</h2>
            <p>Enter the code sent to your Email Address.</p>
            <form onSubmit={handleVerifyCode}>
              <input
                type="text"
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="Login-btn">
                Verify Code
              </button>
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>
      )}

        {isNewPasswordModalOpen && (
  <div className="modal-forgot-pass">
    <div className="modal-content-forgot-pass">
      <span
        className="close-button"
        onClick={() => setIsNewPasswordModalOpen(false)}
      >
        &times;
      </span>
      <h2>Set New Password</h2>
      <p>Enter your new password below:</p>
      <form onSubmit={handleSaveNewPassword}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
        />
        <button type="submit" className="Login-btn">
          Save Password
        </button>
      </form>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  </div>
)}

{isModalOpen && (
        <div className="modal-forgot-pass">
          <div className="modal-content-forgot-pass">
            <span
              className="close-button"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h2>Forgot Password</h2>
            <p>Enter your registered Email Address to receive a password reset code.</p>
            <form onSubmit={handleSendResetCode}>
              <input
                type="text" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="Login-btn">
                Send Reset Code
              </button>
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>
      )}
   
    <div className="super-main-container">
     </div>
    <div className="main-container">
    <div class="login-desktop-container">
      <div class="image-container-login">
            <img class="motorbg-login" src={motorbg} alt= "motorbg"></img>
            <img class="bike-login" src={bikeImage} alt="Motorbike"></img>
            <img class= "location-login" src={locationImage} alt="LocationIcon"></img>
            <img class="trackiconloginleft" src={trackiconlogin} alt= "trackicon"></img>
        </div>
    
        <div className="Login-desktop-main-container">
          <img class="trackiconlogin" src={trackiconlogin} alt= "trackicon"></img>
          <div className="button-back-txt" onClick={handleBackClick}>
        <span className="material-symbols-outlined">arrow_back</span>
        <div className="Login-txt">
          <h1>Login</h1>
          <p>Input your credentials to login</p>

        </div>
        </div>
        <form className="Login-form-desktop">
          <input
            type="text"
            placeholder=" "
            className={`input-field ${errorFields.username ? "error-outline" : ""}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="user" className="floating-label-log">Username</label>
          <input
            type="password"
            placeholder=" "
            className={`input-field ${errorFields.password ? "error-outline" : ""}`}
            value={password.trim()}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="pass" className="floating-label-log-pass">Password</label>
          <button className="Login-btn" onClick={handleLoginClick}>
            Login
          </button>
          <p
                onClick={handleForgotPasswordClick}
                className="forgot-password-link-login"
              >
                Forgot your password?
              </p>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}



      </div>
      </div>
      </div>

      
    <div className="login-main-container">
      <header className="loginheader">
        <button className="close-button" onClick={handleCloseClick}>&times;</button>
        <h1 className="headerlogin">Login</h1>
        <button onClick={handleSignUpClick} className="SignUP">
          Sign Up
        </button>
      </header>

      <div className="Login-container">
        <form className="Login-form">
          <input
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password.trim()}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="Login-btn" onClick={handleLoginClick}>
            Login
          </button>
          <p
                onClick={handleForgotPasswordClick}
                className="forgot-password-link-login"
              >
                Forgot your password?
          </p>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
                {/* Verification Modal */}
 
      </div>
    </div>
    </div>

    
  );

  
};

export default Login;
