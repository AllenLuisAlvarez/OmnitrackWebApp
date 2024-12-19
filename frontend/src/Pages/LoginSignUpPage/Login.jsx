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

  return (
    <div className="starting-container">
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
          <a href="/forgot-password" className="forgot-password-link-login">
            Forgot your password?
          </a>
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
          <a href="/forgot-password" className="forgot-password-link">
            Forgot your password?
          </a>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
    </div>
  );
};

export default Login;
