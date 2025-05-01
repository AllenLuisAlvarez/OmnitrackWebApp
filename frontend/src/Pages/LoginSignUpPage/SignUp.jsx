import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";
import './LoginSignup.css';
import bikeImage from '../images/bike.png';
import locationImage from '../images/location.png';
import motorbg from '../images/motorbg.png';
import trackiconlogin from '../images/motoricon.png';
import TMLogo from '../images/TMLogoB.png';
import axios from "axios"; 


const SignUp = () => {
    const navigate = useNavigate();
    const [username, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);

  
    const [isVerified, setIsVerified] = useState(false);

    const handleSendVerificationCode = async (e) => {
        e.preventDefault();
        
        if (!email) {
          toast.error("Please enter an email address.");
          return;
        }
        if (isSendingCode) return;
        setIsSendingCode(true);
        setCountdown(60); 
        try {
          const response = await axios.post("http://localhost:8800/send-otp", { email });
          toast.success(response.data.message);
        } catch (error) {
          console.error("Error sending OTP:", error.response?.data || error.message);
          toast.error("Failed to send verification code.");
          setIsSendingCode(false);
          setCountdown(0);
        }
    };
    
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!email || !verificationCode) {
          toast.error("Please enter your email and verification code.");
          return;
        }
      
        try {
          const response = await axios.post("http://localhost:8800/verify-otp", { 
            email, 
            otp: verificationCode 
          });
      
          toast.success(response.data.message);
          setIsVerified(true); // Mark as verified
          localStorage.setItem("signupId", response.data.signupId); // Store signupId for use in signup
        } catch (error) {
          console.error("Error verifying OTP:", error.response?.data || error.message);
          toast.error(error.response?.data?.error || "Invalid verification code.");
        }
    };
      
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isVerified) {
          toast.error("Please verify your email first.");
          return;
        }
      
        if (!username || !email || !password) {
            toast.error("Please fill out all fields.");
          return;
        }
      
        try {
          // Retrieve signupId from local storage
          const signupId = localStorage.getItem("signupId");
      
          if (!signupId) {
            toast.error("Verification data not found. Please verify your email again.");
            return;
          }
      
          const response = await axios.patch("http://localhost:8800/user-signup", {
            signupId,
            username,
            password,
          });
      
          alert(response.data.message);
          localStorage.removeItem("signupId"); // Cleanup after successful signup
          navigate("/login");
        } catch (error) {
          console.error("Error signing up:", error.response?.data || error.message);
          toast.error(error.response?.data?.error || "Sign-up failed.");
        }
    };

    const handleLoginClick = () => {
        navigate("/login"); 
    };

    
    const handleBackClick = () => { //Back on desktop reso
        navigate("/WelcomePage2"); 
    };

    const handleCloseClick = () => { //Back on mobile reso
        navigate("/WelcomePage2"); 
    };
   
   /** useEffect(() => {
        // Change body class on component mount
        document.body.className = "signup-body";

        // Cleanup by resetting the class on component unmount
        return () => {
            document.body.className = "default-body";
        };
    }, []);*/ 
    useEffect(() => {
        let timer;
        if (isSendingCode && countdown > 0) {
          timer = setTimeout(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
          }, 1000); // Every 1 second
        } else if (countdown === 0) {
          setIsSendingCode(false);
        }
      
        return () => clearTimeout(timer); // Cleanup timer
      }, [isSendingCode, countdown]);
      

    return(
        <div className="starting-container">
           

            <div className="main-container">
                <div class="signup-desktop-container">
                    <div class="image-container-login">
                        <img class="motorbg-login" src={motorbg} alt= "motorbg"></img>
                        <img class="bike-login" src={bikeImage} alt="Motorbike"></img>
                        <img class= "location-login" src={locationImage} alt="LocationIcon"></img>
                        <img class="trackiconloginleft" src={trackiconlogin} alt= "trackicon"></img>
                    </div>
                    
                    <div className="SignUp-desktop-main-container">
                        <img class="trackiconlogin" src={trackiconlogin} alt= "trackicon"></img>
                        <div className="button-back-signup-txt">
                            <span className="material-symbols-outlined" onClick={handleBackClick}>arrow_back</span>
                            <div className="SignUp-txt">
                                <h1>Sign Up</h1>
                                <p>Fill up the form to register</p>
                            </div>
                        </div>
                        <form class="SignUp-form-desktop">
                            <div class="input-group">
                                <input
                                    type="text"
                                    placeholder=" "
                                    className="input-field"
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                                <label htmlFor="name" className="floating-label">Name</label>
                            </div>
                            <div class ="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder=""
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label htmlFor="password" className="floating-label">Password</label>
                                <span
                                    className="material-symbols-outlined eye-pass"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    style={{ cursor: "pointer", marginLeft: "-50px", marginTop: "15px", color: "grey"}} // Adjust icon positioning
                                >
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </div>
                            <div class="input-group">
                                <input
                                    type="text"
                                    placeholder=" "
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <label htmlFor="email" className="floating-label">Email</label>
                                <button 
                                    className="verify-button" 
                                    onClick={handleSendVerificationCode}
                                    disabled={isSendingCode}
                                    style={{ opacity: isSendingCode ? 0.6 : 1, cursor: isSendingCode ? 'not-allowed' : 'pointer' }}
                                    >
                                    {isSendingCode ? `Send again in ${countdown}s` : "Send Verification Code"}
                                </button>
                            </div>
                            <div className="input-group">
                                <input
                                    type="tel"
                                    placeholder=" "
                                    className="input-field"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                />
                                <label htmlFor="code" className="floating-label">Verification Code</label>
                                <button className="verify-button" onClick={handleVerifyOTP}>Verify</button>
                            </div>
                            <button class="SignUp" onClick={handleSignUp}>Sign Up</button>
                        </form>
                    </div>
                    
                </div>
            </div>

            <div class ="signup-main-container">
                <header class ="signupheader">
                    <button class="close-button" onClick={handleCloseClick}>&times;</button>  
                    <h1 class="headersignup">Sign Up</h1>
                    <button onClick={handleLoginClick} className="login">Login</button>
                </header>
                
                <div class="SignUp-container">
                    <form class="signup-form">
                        <div class ="input-group">
                            <input
                                type="text"
                                placeholder=" "
                                className="input-field"
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                            <label htmlFor="name" className="floating-label-mobile">Name</label>
                        </div>
                        <div class ="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder=" "
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label htmlFor="pass" className="floating-label-mobile">Password</label>
                            <span
                                    className="material-symbols-outlined eye-pass"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    style={{ cursor: "pointer", marginLeft: "-50px", marginTop: "6px", color: "grey"}} // Adjust icon positioning
                                >
                                    {showPassword ? "visibility_off" : "visibility"}
                            </span>
                        </div>
                        <div class="input-group">
                            <input
                                type="text"
                                placeholder=" "
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label htmlFor="email" className="floating-label-mobile">Email</label>
                            <button 
                                    className="verify-button" 
                                    onClick={handleSendVerificationCode}
                                    disabled={isSendingCode}
                                    style={{ opacity: isSendingCode ? 0.6 : 1, cursor: isSendingCode ? 'not-allowed' : 'pointer' }}
                                    >
                                    {isSendingCode ? `Send again in ${countdown}s` : "Send Verification Code"}
                            </button>
                        </div>
                        <div class="input-group">
                            <input
                                type="tel"
                                placeholder=" "
                                className="input-field"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                            />
                            <label htmlFor="code" className="floating-label-mobile">Verfication Code</label>
                            <button className="verify-button" onClick={handleVerifyOTP}>Verify</button>
                        </div>
                        <button class="SignUp" onClick={handleLoginClick}>Sign Up</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SignUp