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
  const { loginUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for "Forgot Password" modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false); // State for verification modal
  const [mobileNumber, setMobileNumber] = useState(""); // Mobile number input
  const [verificationCode, setVerificationCode] = useState(""); // Verification code input
  const [isNewPasswordModalOpen, setIsNewPasswordModalOpen] = useState(false); // State for new password modal
  const [newPassword, setNewPassword] = useState(""); // New password input
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password input

  const handleSignUpClick = () => {
    navigate("/signup"); // Redirect to Sign Up page
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    try {
      const response = await fetch("https://omnitrackwebapp.onrender.com/login", {
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
        console.log(data.user);
        // Redirect to the protected page (e.g., Monitor page)
        navigate("/Monitor");
      } else {
        setErrorMessage(data.message || "Login failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  const handleForgotPasswordClick = () => {
    setIsModalOpen(true);
    console.log("clicked");
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();

    if (!mobileNumber) {
      setErrorMessage("Please enter your mobile number.");
      return;
    }

     // Mock sending reset code
  setTimeout(() => {
    alert("Mock: Reset code sent to your mobile number.");
    setIsModalOpen(false); // Close the modal for mobile number
    setIsVerificationModalOpen(true); // Open verification modal
    setMobileNumber(""); // Clear mobile number input
  }, 1000); // Simulate a 1-second delay

    try {
      const response = await fetch("http://localhost:8800/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Reset code sent to your mobile number.");
        setIsModalOpen(false);
        setIsVerificationModalOpen(true); // Open verification modal
        setMobileNumber("");
      } else {
        setErrorMessage(data.message || "Failed to send reset code.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      setErrorMessage("Please enter the verification code.");
      return;
    }
     // Mock verification
  setTimeout(() => {
    if (verificationCode === "123456") { // Mocked correct code
      alert("Mock: Code verified successfully!");
      setIsVerificationModalOpen(false); // Close verification modal
      setIsNewPasswordModalOpen(true); // Open the new password modal
      setVerificationCode(""); // Clear verification code input
    } else {
      setErrorMessage("Invalid verification code. Please try again.");
    }
  }, 1000); // Simulate a 1-second API delay
    try {
      const response = await fetch("http://localhost:8800/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Code verified successfully! Please reset your password.");
        setIsVerificationModalOpen(false);
        setVerificationCode("");
        navigate("/reset-password"); // Redirect to the password reset page
      } else {
        setErrorMessage(data.message || "Invalid verification code.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
  
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Both password fields are required.");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
  
    // Mock password reset success
   // Mock saving the new password
  setTimeout(() => {
    alert("Mock: Password reset successfully!");
    setIsNewPasswordModalOpen(false); // Close the new password modal
    setNewPassword(""); // Clear inputs
    setConfirmPassword("");
    navigate("/login"); // Redirect back to the login page
  }, 1000); // Simulate a 1-second API delay
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
            <p>Enter the code sent to your mobile number.</p>
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
            <p>Enter your mobile number to receive a password reset code.</p>
            <form onSubmit={handleSendResetCode}>
              <input
                type="text"
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
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
       <div className="login-welcome-page">
            <h1>Welcome to TrackMoto</h1>
            <p>Track Your Treasures with Ease</p>
            <p>Locate What Matters Most.</p>
        </div>
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
          <div className="button-back-txt">
        <span className="material-symbols-outlined">arrow_back</span>
        <div className="Login-txt">
          <h1>Login</h1>
        </div>
        </div>
        <form className="Login-form-desktop">
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



      </div>
      </div>
      </div>

      
    <div className="login-main-container">
      <header className="loginheader">
        <button className="close-button">&times;</button>
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
