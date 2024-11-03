import React from "react";
import { useNavigate } from "react-router-dom";
import './Welcomepage.css';
import bikeImage from './images/bike.png';
import locationImage from './images/location.png';
import motorbg from './images/motorbg.png';

const WelcomePage2= ()=>{
    const navigate = useNavigate();

    const handleSignUp = () => {
       navigate('/SignUp');
    }
    const handleLogin = () => {
        navigate('/Login');
     }
   return(

    <div class="container">
        <header class= "welcomepageheader">
            <h1>Welcome to OmniTrack</h1>
            <p>Track Your Treasures with Ease</p>
            <p>Locate What Matters Most.</p>
        </header>
        
        <div class="image-container">
            <img class="motorbg" src={motorbg} alt= "motorbg"></img>
            <img class="bike" src={bikeImage} alt="Motorbike"></img>
            <img class= "location" src={locationImage} alt="LocationIcon"></img>
        </div>
        

        <button class="SignUp-button" onClick={handleSignUp}>Sign Up</button>
        <button class="Login-button" onClick={handleLogin}>Log In</button>
    </div>
  


   )
}

export default WelcomePage2