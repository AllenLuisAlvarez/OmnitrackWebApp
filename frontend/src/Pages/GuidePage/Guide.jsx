import React, { useState, useRef } from 'react';
import './guide.css';
import { useNavigate } from "react-router-dom";
import useMediaQuery from '../MonitoringPage/useMediaQuery'; 

import firstStep from "./images/1st.png"
import secondStep from "./images/2nd.png"
import thirdStep from "./images/3rd.png"
import fourthStep from "./images/4th.png"
import fifthStep from "./images/5th.png"
import sixthStep from "./images/6th.png"
import sixthPointFiveStep from "./images/6.5th.png"
import seventhStep from "./images/7th.png"
import eightStep from "./images/8th.png"
import ninethStep from "./images/9th.png"
import tenthStep from "./images/10th.png"
import eleventhStep from "./images/11th.png"
import twelenthStep from "./images/12th.png"
import thirteenthStep from "./images/13th.png"
import fourteenStep from "./images/14th.png"
import fifteenthStep from "./images/15th.png"
import sixteenthStep from "./images/16th.png"
import seventeenthStep from "./images/17th.png" 


// Slides data
const slides = [
  {
    title: "Welcome To TrackMoto",
    image: firstStep,
    description: `Welcome to <span className"guide-desc">TrackMoto Web Application</span>. The first thing you need to know is the navigation bar located on the lower part of the web app. This Navigation bar has 3 buttons which are the <span className"guide-desc">"Home"</span>, <span className"guide-desc">"Add Device"</span>, and <span className"guide-desc">"Settings"</span>.`
  },
  {
    title: "Navigation Bar",
    image: secondStep,
    description: `In the figure above you will see a red arrow pointing to the <span className"guide-desc">"Add Device"</span>. This button will let you add your TrackMoto Device.`
  },
  {
    title: "Add Device",
    image: thirdStep,
    description: `To Add your device you have to input your TrackMoto Device ID to start on tracking.`
  },
  {
    title: "Added Device",
    image: fourthStep,
    description: `After Successfully adding your TrackMoto Device, a notification will pop up indicating of succesfully added device and you may now check your device location in the map.`
  },
  {
    title: "Device Details",
    image: fifthStep,
    description: `In your Device card you will see your <span className"guide-desc">Device Name</span>, <span className"guide-desc">Device Model</span>, <span className"guide-desc">Device Location</span>, and <span className"guide-desc">Device Distance</span>.`
  },
  {
    title: "Tracking your device",
    image: sixthStep,
    description: `In the device card, the arrow shows a <span className"guide-desc">"Track" button</span> that will direct you to the device location. Next to it is the <span className"guide-desc">Geofencing Switch</span> that allows you to turn on the Geofence Feature and lastly the <span className"guide-desc">user location indicator</span>.`
  },
  {
    title: "Geofence Feature",
    image: sixthPointFiveStep,
    description: `In Geofence Feature, upon switching on the Geofence, a <span className"guide-desc">10 meters radius will appear on the map</span>. This radius is the area where your device can move. If the device goes outside of this area, it will alert the TrackMoto Application.`
  },
  {
    title: "Tracking History (1/3)",
    image: seventhStep,
    description: `In the home page upper left you will see a Hamburger Button that will be a function for monitoring or checking your device tracking history.
    <br><br>
    The first option is <span className"guide-desc">Today</span> which will show todays tracking history.`
  },
  {
    title: "Tracking History (2/3)",
    image: eightStep,
    description: `The second option is <span className"guide-desc">Custom</span>, a <span className"guide-desc">Date Input</span> will show under the options. You may select a date and the tracking history will show.`
  },
  {
    title: "Tracking History (3/3)",
    image: ninethStep,
    description: `The last option is <span className"guide-desc">Show All</span> which means show all the devices the are currently registered to the account.`
  },
  {
    title: "Settings",
    image: tenthStep,
    description: `In the Settings page there's several options; <span className"guide-desc">View Profile</span>, <span className"guide-desc">Manage Devices</span>, <span className"guide-desc">Change Password</span>, <span className"guide-desc">Guides<span>, and <span className"guide-desc">Logout</span>.`
  },
  {
    title: "Profile",
    image: eleventhStep,
    description: `In Profile Page, there's an option for <span className"guide-desc">Edit Image</span> and <span className"guide-desc">Remove Button</span>. You may also edit your <span className"guide-desc">Name</span>, <span className"guide-desc">Change Mobile Number</span>, and <span className"guide-desc">Email</span> by tapping the <span className"guide-desc">Edit icon</span>.`
  },
  {
    title: "Edit Image(1/2)",
    image: twelenthStep,
    description: `Upon clicking the <span className"guide-desc">Edit Iamge</span> choose a file for your Profile Image and <span className"guide-desc">Confirm</span> it.`
  },
  {
    title: "Edit Details(2/2)",
    image: thirteenthStep,
    description: `Upon clicking the <span className"guide-desc">Edit Icon</span> there will be an <span className"guide-desc">Input field</span> and tap the <span className"guide-desc">Save Icon</span> to save your changes.`
  },
  {
    title: "Manage Devices",
    image: fourteenStep,
    description: `In Manage Devices Page, this is where your devices can be modified. On the upper right of the device card is an <span className"guide-desc">Edit Button</span> while on the lower right is the <span className"guide-desc">Remove Button</span> and next to it is the <span className"guide-desc">Change Color button</span> for the device marker.`
  },
  {
    title: "Change Password (1/3)",
    image: fifteenthStep,
    description: `For the Change Password option, you have to access your registered <span className"guide-desc">email and verify</span> it using the <span className"guide-desc">Send OTP Button</span>.`
  },
  {
    title: "Change Password (2/3)",
    image: sixteenthStep,
    description: ` After that an OTP will be sent to your <span className"guide-desc">registered email</span>, after you input your OTP code tap the <span className"guide-desc">Confirm Button</span>.`
  },
  {
    title: "Change Password (3/3)",
    image: seventeenthStep,
    description: `Lastly, if your OTP code is correct you will proceed to Changing your password. tap the <span className"guide-desc">Save Button</span> to save your changes`
  },
];

const Guide = ({ onBack }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const totalSlides = slides.length;

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleBackClick = () => {
    if (isLargeScreen) {
      if (onBack) onBack();
    } else {
      navigate('/Settings');
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNextSlide();
    } else if (distance < -minSwipeDistance) {
      goToPreviousSlide();
    }
  };
  return (
    <div className="slider-component">
      {/* Back Button */}
      <div className="guide-back-btn" onClick={handleBackClick}>
        <span className="material-symbols-outlined">arrow_back</span>
      </div>

      {/* Carousel Slides */}
      <form 
        className="carousel-form"
        style={{ transform: `translateX(-${currentSlide * 100}vw)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div className="slide" key={index}>
            <div className="intro-guide">
              <p>{slide.title}</p>
            </div>
            <div className="guide-content">
              <div className="image-div-guide">
                <img className="guide" src={slide.image} alt={`Slide ${index}`} />
              </div>
              <div className="guide-desc">
                <p dangerouslySetInnerHTML={{ __html: slide.description }} />
              </div>
            </div>
          </div>
        ))}
      </form>

      {/* Navigation Buttons (OUTSIDE of form) */}
      <button 
        type="button" 
        className="nav-button prev" 
        onClick={goToPreviousSlide}
      >
        <span className="material-symbols-outlined">arrow_back_ios</span>
      </button>

      <button 
        type="button" 
        className="nav-button next" 
        onClick={goToNextSlide}
      >
        <span className="material-symbols-outlined">arrow_forward_ios</span>
      </button>

      {/* Keys text */}
      <div className="keys">Swipe or use arrows to navigate</div>
    </div>
  );
};

export default Guide;
