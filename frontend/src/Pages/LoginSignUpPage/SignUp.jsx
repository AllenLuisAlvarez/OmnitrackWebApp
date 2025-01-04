import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './LoginSignup.css';
import bikeImage from '../images/bike.png';
import locationImage from '../images/location.png';
import motorbg from '../images/motorbg.png';
import trackiconlogin from '../images/motoricon.png'


const SignUp = () => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate("/login"); 
    };
   
   /** useEffect(() => {
        // Change body class on component mount
        document.body.className = "signup-body";

        // Cleanup by resetting the class on component unmount
        return () => {
            document.body.className = "default-body";
        };
    }, []);*/ 

    return(
         <div className="starting-container">
            <div className="super-main-container">
               <div className="signup-welcome-page">
                    <h1>Welcome to TrackMoto</h1>
                    <p>Track Your Treasures with Ease</p>
                    <p>Locate What Matters Most.</p>
                </div>
             </div>
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
                <span className="material-symbols-outlined">arrow_back</span>
                <div className="SignUp-txt">
                  <h1>Sign Up</h1>
                </div>
                </div>
            <form class="SignUp-form-desktop">
                <input type="text" placeholder="Name" class="input-field"></input>
            <div class="input-group">
                <input type="tel" placeholder="Mobile Number" class="input-field"></input>
                <button class="verify-button">Verify</button>
            </div>
            <input type="tel"placeholder="Verification Code" class="input-field"></input>
            <div class ="input-group">
                <input type="password" placeholder="Password" class="input-field"></input>
              
            </div>

            <button class="SignUp" onClick={handleLoginClick}>Sign Up</button>
            </form>
               
             
              </div>
              </div>
              </div>
       <div class ="signup-main-container">
        <header class ="signupheader">
            <button class="close-button">&times;</button>  
            <h1 class="headersignup">Sign Up</h1>
            <button onClick={handleLoginClick} className="login">Login</button>
        </header>
        
        <div class="SignUp-container">
            <form class="signup-form">
                <input type="text" placeholder="Name" class="input-field"></input>
            <div class="input-group">
                <input type="tel" placeholder="Mobile Number" class="input-field"></input>
                <button class="verify-button">Verify</button>
            </div>
            <input type="tel"placeholder="Verification Code" class="input-field"></input>
            <div class ="input-group">
                <input type="password" placeholder="Password" class="input-field"></input>
              
            </div>

            <button class="SignUp" onClick={handleLoginClick}>Sign Up</button>
            </form>
        </div>
        </div>
        </div>
       
    )
}

export default SignUp