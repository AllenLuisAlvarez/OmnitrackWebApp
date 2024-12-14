import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Components/UserContext"; 
import './LoginSignup.css'; // Make sure this points to your CSS file

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
  );
};

export default Login;
