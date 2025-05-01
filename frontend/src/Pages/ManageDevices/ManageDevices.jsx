import React, { useContext, useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';

import axios from 'axios';

import { useNavigate } from "react-router-dom";

import { UserContext } from "../../Components/UserContext";
import { useDevices } from '../../Components/DeviceContext';
import useMediaQuery from '../MonitoringPage/useMediaQuery'; // Assuming you already have this custom hook
import './ManageDevices.css';


const ManageDevices = ({ onBack }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [dataloading, setDataLoading] = useState(true);
    const [colorPickerVisible, setColorPickerVisible] = useState(false);  

    const { devices, setDevices, setCoordinates} = useDevices();
    const { user, loginUser } = useContext(UserContext);

    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [selectedDeviceModule, setSelectedDeviceModule] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);  
    const [updatedName, setUpdatedName] = useState(""); 
    const navigate = useNavigate();

    const isLargeScreen = useMediaQuery("(min-width: 768px)"); // Check if screen is >= 768px

    // Handle save or back logic
    const handleBackClick = () => {
        // If editing, confirm before leaving
        if (isEditing) {
            const userConfirmed = window.confirm(
                "You have unsaved changes. Do you want to save them before leaving?"
            );
    
            if (userConfirmed) {
                handleSaveClick(); // Save and then decide navigation
            } else {
                setIsEditing(false); // Cancel editing
            }
        }
    
        if (isLargeScreen) {
            // For larger screens, use the provided `onBack` function
            if (onBack) {
                onBack();
            }
        } else {
            // For smaller screens, navigate back to the Settings page
            navigate('/Settings');
        }
    };
    

    const handleSaveClick = async () => {
        try {
            if (selectedDeviceId) {
                // Send updated name to the backend
                const response = await axios.patch("http://localhost:8800/update-device", {
                    userId: user.userId,
                    deviceId: selectedDeviceId,
                    newName: updatedName,
                    newColor: selectedColor, 
                });

                if (response.data.success) {
                    // Update local device state
                    setDevices((prevDevices) =>
                        prevDevices.map((device) =>
                            device.id === selectedDeviceId
                                ? { ...device, Name: updatedName }
                                : device
                        )
                    );

                     // Update local coordinates state
                    setCoordinates((prevCoordinates) =>
                        prevCoordinates.map((coordinate) =>
                        coordinate.Module === selectedDeviceModule // Match by DeviceId
                            ? { ...coordinate, Color: selectedColor } // Update the color
                            : coordinate
                        )
                    );
                    setSelectedDeviceModule(null);
                    setSelectedDeviceId(null);
                } else {
                    console.warn("Failed to update device:", response.data.message);
                }
            }
        } catch (error) {
            console.error("Error updating device:", error);
        } finally { 
            setUpdatedName("");
            setIsEditing(false);
        }
    };
        
    const toggleModal = (deviceId = null, deviceModule) => {
        setSelectedDeviceId(deviceId);
        setSelectedDeviceModule(deviceModule);
        setIsModalOpen(!isModalOpen);
    };

    const handleEditClick = (deviceId, currentName, currentColor) => {
        setSelectedDeviceId(deviceId);
        setUpdatedName(currentName); // Initialize with the current name
        setIsEditing(true); // Enter editing mode
        setSelectedColor(currentColor);
    };

    const toggleColorPicker = () => {
        setColorPickerVisible(!colorPickerVisible);
    };

    const handleColorChange = (color) => {
        setSelectedColor(color.hex); // Update the selected color
        
        setDevices((prevDevices) =>
            prevDevices.map((dev) =>
                dev.id === selectedDeviceId ? { ...dev, Color: color.hex } : dev
            )
        );  // Update the color with the selected color's hex code
    };

    // Handle name change
    const handleNameChange = (e) => {
        setUpdatedName(e.target.value);
    };

    const handleConfirmDelete = async (selectedDeviceId, selectedDeviceModule) => {
        try {
            const response = await axios.patch('http://localhost:8800/remove-device', {
              userId: user.userId,
              deviceId: selectedDeviceId,
            });

            if (response.data.success) {
                setDevices((prevDevices) => prevDevices.filter((device) => device.id !== selectedDeviceId));

                setCoordinates((prevCoordinates) =>
                    prevCoordinates.filter((coordinate) => coordinate.Module !== selectedDeviceModule)
                );
                
                // If no devices left, set isNewUser to true
                if (response.data.isNewUser) {
                    loginUser({ ...user, isNewUser: true }); // Update the user context with isNewUser = true
                }
            } else {
              console.warn("Error: ", response.data.message);
            }
          } catch (error) {
            console.error("Error fetching devices:", error);
        }
    }

    useEffect(() => {
        const fetchUserDevices = async () => {
            
            if (!user || user.isNewUser) {
                setDataLoading(false);
                return; // Skip if user is new
            }

            try {
                const response = await axios.post('http://localhost:8800/get-devices', { userId: user.userId });
        
                if (response.data.success) {
                setDevices(response.data.devices);
                } else {
                console.warn("No devices found or error:", response.data.message);
                }
            } catch (error) {
                console.error("Error fetching devices:", error);
            } finally {
                setDataLoading(false); // Set loading to false after both requests complete
            }
        };
    
        fetchUserDevices();
    }, [user, setDevices]);
    
  return (
    <div className='Manage-body'>
        <div className="managedevices-container">
            <div className="managedevices-header">
                <div className="back-button-manage" onClick={handleBackClick}>
                    <span className="material-symbols-outlined manage-back-icon">arrow_back</span>
                </div>
                <div className="managedevices-title">
                    <p>Manage Devices</p>
                </div>
                <div className="Mdevices-container">
                    <div className="mdev-div">
                    {dataloading ? ( 
                        <p>Loading...</p>
                    ) : devices && devices.length > 0 ? (   
                        devices.map((device) => (
                            <div className="Mdevices-cards"  key={device.id}>
                                <div className="top-mdev">
                                    <div className="mdev-text-div">
                                        {selectedDeviceId === device.id && isEditing ? (
                                            <form className='editable-device-form'>
                                                <label>Device Name</label>
                                                <input
                                                    type="text"
                                                    value={updatedName}
                                                    placeholder="Input Device"
                                                    onChange={handleNameChange}
                                                    className="editable-input"
                                                />

                                            </form>
                                        ) : (
                                            <p>Device Name: {device.Name}</p>
                                        )}
                                        <p>Module: {device.Module}</p>
                                    </div>
                                    <div className="mdev-edit-icon">
                                        <span
                                            className="material-symbols-outlined edit-manage-dev-icon"
                                            onClick={() => {
                                                if (isEditing && selectedDeviceId === device.id) {
                                                    handleSaveClick();
                                                } else {
                                                    setSelectedDeviceId(device.id); // Ensure the right device is selected
                                                    setSelectedDeviceModule(device.Module);
                                                    handleEditClick(device.id, device.Name, device.Color);
                                                }
                                            }}>
                                            {isEditing && selectedDeviceId === device.id ? "save" : "edit"}
                                        </span>
                                </div>
                            </div>

                            <div className="bottom-mdev">
                            <button className="mdev-change-color-button color-manage-dev-icon" 
                                style={{
                                    color: device.Color || '#000000',
                                    cursor: isEditing && selectedDeviceId === device.id? 'pointer' : 'not-allowed', // Change cursor based on `isEditing`
                                    opacity: isEditing && selectedDeviceId === device.id? 1 : 0.5, // Dim the button when disabled
                                }} 
                                onClick={() => {
                                    if (isEditing && selectedDeviceId === device.id) {
                                        toggleColorPicker();
                                    }
                                }}
                                disabled={!isEditing || selectedDeviceId !== device.id}> 
                                    <span className="material-symbols-outlined">palette</span>
                            </button>

                            {colorPickerVisible && isEditing && selectedDeviceId === device.id &&(
                                <ChromePicker
                                    color={selectedColor || device.Color}
                                    onChange={handleColorChange}  // Update color when user selects a new one
                                    onClick={toggleColorPicker} // Show color picker when clicked
                                />
                            )}
                                <button className='mdev-remove-button' onClick={() => {
                                    toggleModal(device.id, device.Module)
                                    setIsEditing(false)
                                    }}>Remove Device</button>
                            </div>
                        </div>
                    ))
                    ) : (
                        <p>No Devices</p> 
                    )}
                    </div>
                </div>
            </div>
                {/* Modal Component */}
                {isModalOpen && (
                    <div className="modal-overlay-remove-device" >
                        <div className="modal-content-remove-device" onClick={(e) => e.stopPropagation()}>
                        <div className='remove-title'>
                            <h4>Are you sure you want to remove this device?</h4>
                            <h6>This cannot be undone</h6>
                        </div>
                            <div className="mdev-button-remove">
                                <button onClick={toggleModal} className='cancel-remove-btn'>Cancel</button>
                                <button onClick={() => {
                                handleConfirmDelete(selectedDeviceId,selectedDeviceModule)
                                toggleModal()}} className='confirm-remove-btn'>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    </div>
  )
}

export default ManageDevices