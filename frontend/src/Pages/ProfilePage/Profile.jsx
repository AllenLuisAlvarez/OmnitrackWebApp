import { React, useContext, useState } from 'react'
import axios from 'axios';
import './profile.css';
import { useNavigate } from "react-router-dom";

import { UserContext } from '../../Components/UserContext';
import useMediaQuery from '../MonitoringPage/useMediaQuery'; // Assuming you already have this custom hook
import { toast, ToastContainer } from 'react-toastify'



const Profile = ({ onBack }) => {
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editingField, setEditingField] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
        
    const [updatedName, setUpdatedName] = useState(user.username); 
    const [updatedMobile, setUpdatedMobile] = useState(user.mobile);
    const [updatedEmail, setUpdatedEmail] = useState(user.email);

    const isLargeScreen = useMediaQuery("(min-width: 768px)"); // Check if screen is >= 768px

    // Handle save or back logic
    const handleBackClick = () => {
        // If editing, confirm before leaving
        if (editingField) {
            const userConfirmed = window.confirm(
                "You have unsaved changes. Do you want to save them before leaving?"
            );
    
            if (userConfirmed) {
                handleSaveClick(); // Save and then decide navigation
            } else {
                setEditingField(null); // Cancel editing
            }
        }

        if (isLargeScreen) {
            // For larger screens, use the provided `onBack` function
            if (onBack) {
                setEditingField(null);
                onBack();
            }
        } else {
            // For smaller screens, navigate back to the Settings page
            setEditingField(null);
            navigate('/Settings');
        }
    };

    const handleSaveClick = async () => {
        try {
            const response = await axios.patch("http://localhost:8800/update-user-profile", {
                userId: user.userId,
                username: updatedName || user.username,
                mobile: updatedMobile || user.mobile,
                email: updatedEmail || user.email,
            });
    
            if (response.data.success) {
                // Update the UserContext
                setUser((prevUser) => ({
                    ...prevUser,
                    username: updatedName || prevUser.username,
                    mobile: updatedMobile || prevUser.mobile,
                    email: updatedEmail || prevUser.email,
                }));
                
                // Optionally, update localStorage to persist changes
                if (updatedName) localStorage.setItem("username", updatedName);
                if (updatedMobile) localStorage.setItem("mobile", updatedMobile);
                if (updatedEmail) localStorage.setItem("email", updatedEmail);
                
                // Reset editing state
                setEditingField(null);
            } else {
                console.warn("Failed to update user profile:", response.data.message);
            }
        } catch (error) {
            console.error("Error updating user profile:", error);
        }
    };

    const handleEditClick = (field) => {
        setEditingField(field)
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleAddImageClick = async () => {
        if (!selectedFile) {
            toast.error("Please select an image first!");
            return;
        }

        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("userId", user.userId);

        try {
            const response = await axios.post("http://localhost:8800/update-profile-image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setUser((prevImage) => ({
                    ...prevImage,
                    profileImage: response.data.profileImage || prevImage.profileImage,
                }));

                if (response.data.profileImage) localStorage.setItem("profileImage", response.data.profileImage);
                setIsModalOpen(false);
            } else {
                toast.error(response.data.message || "Failed to update profile image.");
            }
        } catch (error) {
            console.error("Error updating profile image:", error);
            toast.error("An error occurred. Please try again.");
        }
    };

    const handleRemoveImageClick = async () => {
        try {
          const response = await axios.patch("http://localhost:8800/remove-image", {
            userId: user.userId, // Pass the userId for validation
          });
      
          if (response.data.success) {
            // Clear profile image on success
            setUser((prevUser) => ({
              ...prevUser,
              profileImage: null, // Remove profile image
            }));
      
            localStorage.removeItem("profileImage"); // Remove from localStorage
            setIsModalOpen(false);
          } else {
            toast.error(response.data.message || "Failed to remove profile image.");
          }
        } catch (error) {
          console.error("Error removing profile image:", error);
          toast.error("An error occurred. Please try again.");
        }
    };
      
    const OpenEditProfileModal = () => {
        setIsModalOpen(true);
    };

    const CloseModal = () => {
        setIsModalOpen(false);
        setSelectedFile(null); // Reset file selection
    };
    
    return (
        <div className="profile-body">
            <div className="profile-header">
                <div className="profile-back" onClick={handleBackClick}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </div>
                <div className="profile-title">
                    <p>Profile</p>
                </div>
            </div>

            <div className="profile-profile-card">
                <div className="profile2-picture">
                    <img src={`http://localhost:8800/public/images/${user.profileImage}`} alt="Profile-Picture" />
                </div>
                <div className="profile-buttons">
                    <div className="add-image">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        <button onClick={OpenEditProfileModal}>Edit Image</button>
                    </div>
                    <div className="remove-image-profile">
                        <button onClick={handleRemoveImageClick}>Remove</button> 
                    </div>
                </div>

                {isModalOpen && (
                    <div className="Chp-modal">
                        <div className="Chp-modal-content">
                            <h2>Edit Profile Image</h2>
                            <input type="file" onChange={handleFileChange} accept="image/*" />
                            <div className="Chp-modal-buttons">
                                <button onClick={handleAddImageClick}>Confirm</button>
                                <button onClick={CloseModal}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="profile2-details">
                <div className="prof-details">
                    <div className="name-div">
                        <h6>Name</h6>
                        {editingField === "name" ? (
                        <input
                            type="text"
                            value={updatedName}
                            onChange={(e) => setUpdatedName(e.target.value)}
                            className="editable-input"
                        />
                        ) : (
                        <p>{user.username}</p>
                        )}
                    </div>
                    <div className="edit-profile-div">
                        <span
                        className="material-symbols-outlined"
                        onClick={() =>
                            editingField === "name" ? handleSaveClick() : handleEditClick("name")
                        }
                        >
                        {editingField === "name" ? "save" : "edit"}
                        </span>
                    </div>
                </div>

                <div className="prof-details">
                    <div className="name-div">
                        <h6>Number</h6>
                        {editingField === "mobile" ? (
                            <div className="editable-input-wrapper">
                                <span className="country-code">+63</span>
                                <input
                                    type="text"
                                    value={updatedMobile} // Exclude "+63" here
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow only numbers and ensure it doesn't exceed 10 digits
                                        if (/^\d*$/.test(value) && value.length <= 10) {
                                            setUpdatedMobile(value);
                                        }
                                    }}
                                    className="editable-input"
                                    maxLength="10" // Enforces a 10-digit limit in addition to validation
                                    placeholder="Enter 10-digit number"
                                />
                            </div>
                        ) : (
                            <p>{`+63${user.mobile}`}</p>
                        )}
                    </div>
                    <div className="edit-profile-div">
                        <span
                        className="material-symbols-outlined"
                        onClick={() =>
                            editingField === "mobile" ? handleSaveClick() : handleEditClick("mobile")
                        }
                        >
                        {editingField === "mobile" ? "save" : "edit"}
                        </span>
                    </div>
                </div>

                <div className="prof-details">
                    <div className="name-div">
                        <h6>Email</h6>
                        {editingField === "email" ? (
                        <input
                            type="text"
                            value={updatedEmail}
                            onChange={(e) => setUpdatedEmail(e.target.value)}
                            className="editable-input"
                        />
                        ) : (
                        <p>{user.email}</p>
                        )}
                    </div>
                    <div className="edit-profile-div">
                        <span
                        className="material-symbols-outlined"
                        onClick={() =>
                            editingField === "email" ? handleSaveClick() : handleEditClick("email")
                        }
                        >
                        {editingField === "email" ? "save" : "edit"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile