import React, { useContext, useState } from 'react';
import './Settings.css';
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Components/UserContext";
import axios from "axios"; 


// Calling other component
import useMediaQuery from '../MonitoringPage/useMediaQuery'; // Import the custom hook
import ManageDeviceComponent from '../ManageDevices/ManageDevices'
import ProfileComponent from '../ProfilePage/Profile'
import GuideComponent from '../GuidePage/Guide'

export const Settings = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangeDeviceModalOpen, setIsChangeDeviceModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // New password modal state
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [email, setEmail] = useState("");
  

  const { user, logoutUser } = useContext(UserContext);

  const isLargeScreen = useMediaQuery("(min-width: 768px)"); // Check if screen is >= 768px
  
  const handleBackClick = () => {
    navigate("/Monitor"); 
  };

  const handleLogOutClick = () => {
    // navigate("/frontend/src/Pages/LoginSignUpPage/Login.jsx")
    logoutUser();
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleManageDevicesClick = () => {
    if (isLargeScreen) {
      // Open settings modal for larger screens
      setIsChangeDeviceModalOpen(true);
    } else {
      // Navigate to the settings page for smaller screens
      navigate("/ManageDevices");
    }
  };

  const handProfileClick = () => {
    if (isLargeScreen) {
      // Open settings modal for larger screens
      setIsProfileModalOpen(true);
    } else {
      // Navigate to the settings page for smaller screens
      navigate("/Profile");
    }
  };

  const handleGuideClick = () => {
    if (isLargeScreen) {
      // Open settings modal for larger screens
      setIsGuideOpen(true);
    } else {
      // Navigate to the settings page for smaller screens
      navigate("/Guide");
    }
  };

  const closeManageDeviceModal = () => {
    setIsChangeDeviceModalOpen(false);
  };
  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };
  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  const maskEmail = (email) => {
    if (!email) return "";
  
    const [name, domain] = email.split("@");
    if (!domain) return email;
  
    const maskedName =
      name.length > 2 ? name.slice(0, 2) + "*".repeat(name.length - 2) : "*".repeat(name.length);
  
    return `${maskedName}@${domain}`;
  };
  
  const verifyOTP = async () => {
    if (!user || !user.email) {
      console.error("User email not found!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8800/send-otp-cp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }), // Use email from context
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }

      setShowVerificationInput(true);
      return data.message; // "OTP sent successfully to your email."
    } catch (error) {
      console.error(error.message);
    }
  };

  const verifyUserOTP = async (otpInput) => {
    if (!user || !user.email) {
      console.error("User email not found!");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8800/verify-otp-cp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, otp: otpInput }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.");
      }
  
      alert("OTP verified successfully! Proceed to change password.");
      setIsPasswordModalOpen(true); // Show password input after OTP verification
    } catch (error) {
      console.error(error.message);
      setVerificationCode("");
      alert(error.message);
    }
  };
  
  
  const handleChangePassword = async () => {
    if (!newPassword || !retypePassword) {
      alert("Please enter and confirm your new password.");
      return;
    }
  
    if (newPassword !== retypePassword) {
      alert("Passwords do not match.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8800/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, newPassword }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to update password.");
      }
  
      alert("Password updated successfully!");
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  };
  

  return (
    <div className="settings-body">
      <div className='Settings-container'>
        <div className="settings-header">
          <div className="back-button" onClick={handleBackClick}>
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <div className="settings-title">
            <p>Settings</p>
          </div>
        </div>
          <div className="profile-card">
            <div className="profile-pic">
              <img src={`http://localhost:8800/public/images/${user.profileImage}`} alt="Profile-Picture" />
            </div>
            <div className="profile-details">
              <p>{user ? user.username : "Loading..."}</p>
              <button onClick={handProfileClick}>View Profile</button>
            </div>
          </div>
          <div className="options-container">
            <div className="options-content">
              <div className="option-div" onClick={handleManageDevicesClick}>
              <span class="material-symbols-outlined icon-span">two_wheeler</span>
                <p>Manage Devices</p>
                <span className="material-symbols-outlined arrow-right">chevron_right</span>
              </div>
              <div className="option-div" onClick={toggleModal} >
                <span className="material-symbols-outlined icon-span">phone_iphone</span>
                <p>Change Password</p>
                <span className="material-symbols-outlined arrow-right">chevron_right</span>
              </div>
              <div className="option-div" onClick={handleGuideClick}>
                <span className="material-symbols-outlined icon-span">developer_guide</span>
                <p>Guides</p>
                <span className="material-symbols-outlined arrow-right">chevron_right</span>
              </div>
              <div className="option-div">
                <span className="material-symbols-outlined icon-span" onClick={handleLogOutClick}>logout</span>
                  <p onClick={handleLogOutClick}>Logout</p>
              </div>
            </div>

              {/* Modal Component */}
              {isModalOpen && (
              <div className="modal-overlay-mobile-num" onClick={toggleModal}>
                <div className="modal-content-mobile-num" onClick={(e) => e.stopPropagation()}>
                  <h2>Change Password</h2>
                  <p>Hello {user.username}! To change your password you must input the OTP code that will be send to your registered email </p>
                  <div className="modal-verify-mobile-num">
                    <input
                      className='email-input'
                      type="text"
                      placeholder={maskEmail(user.email)}
                      readOnly
                      disabled
                    />
                    <button onClick={verifyOTP} className='pass-verify-btn'>Send OTP</button>
                  </div>
                  {showVerificationInput && (
                  <div className="modal-verify-mobile-num">
                    <input
                      type="text"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button onClick={() => verifyUserOTP(verificationCode)} className='pass-confirm-btn'>Confirm</button>
                  </div>
                  )}
                </div>
              </div>
            )}
               {/* Modal for setting a new password */}
          {isPasswordModalOpen && (
            <div className="modal-overlay-new-password" onClick={() => setIsPasswordModalOpen(false)}>
              <div className="modal-content-new-password" onClick={(e) => e.stopPropagation()}>
                <h2>Set New Password</h2>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Re-type new password"
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                />
                <button onClick={handleChangePassword}>Save</button>
              </div>
            </div>
          )}
        </div>

            {/* Render Settings modal if isSettingsModalOpen is true */}
             {isChangeDeviceModalOpen && isLargeScreen && (
               <div className="modal-Mdev-larger" onClick={closeManageDeviceModal}>
                <div className="modal-content-Mdev" onClick={(e) => e.stopPropagation()}>
                <ManageDeviceComponent onBack={closeManageDeviceModal}/>
                </div>
                </div>
                )}
              {/* Render Settings modal if isSettingsModalOpen is true */}
              {isProfileModalOpen && isLargeScreen && (
                  <div className="modal-Profile-larger" onClick={closeProfileModal}>
                  <div className="modal-content-Profile" onClick={(e) => e.stopPropagation()}>
                <ProfileComponent onBack={closeProfileModal}/>
              </div>
            </div>
            )}
            {/* Render Settings modal if isSettingsModalOpen is true */}
            {isGuideOpen && isLargeScreen && (
                <GuideComponent onBack={closeGuide}/>
            )}
          </div>
      </div>

  )

}

export default Settings;