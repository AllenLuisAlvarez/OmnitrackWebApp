import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { useDevices } from '../../Components/DeviceContext';
import Loader from '../../Loader/Loader';

const SwipeableDeviceCards = ({ dataloading, activeDevice, setActiveDevice, geofenceStatus, toggleGeofence, isTracking}) => {
  const { devices, deviceDistances, locations } = useDevices();

  const handlers = useSwipeable({
    onSwipedLeft: () => scrollCards('right'),
    onSwipedRight: () => scrollCards('left'),
  });

  const scrollCards = (direction) => {
    const container = document.querySelector('.device-cards');
    const scrollAmount = 150;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (direction === 'right') {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  if (dataloading) return <Loader />;


  return (
    <div className="device-cards" {...handlers}>
      {devices && devices.length > 0 ? (
        devices.map((device) => {
          // Find matching device distance
          const deviceWithDistance = deviceDistances.find(d => d.Module === device.Module);
          
          return (
            <DeviceCard
              key={device.id}
              name={device.Name}
              module={device.Module}
              color={device.Color}
              status="Active" // Placeholder for now
              location={locations[device.Module] ? locations[device.Module].name : "No Location"} // Display the latest location name
              distance={ deviceWithDistance ? deviceWithDistance.distance : "Calculating..." } 
              onTrack={() => {
                if (activeDevice === device.Module) {
                  setActiveDevice(null); // toggle OFF
                } else {
                  setActiveDevice(device.Module); // toggle ON
                }
              }}
              onTracking={activeDevice === device.Module} // Check if this device is currently being tracked
              isTracking={isTracking}
              geofenceEnabled={geofenceStatus[device.Module] || false}
              onToggleGeofence={() => toggleGeofence(device.Module)}
            />
          );
        })
      ) : (
        <p>Add a device and start Tracking!</p> // Optional: Handle the case where `devices` is empty
      )}
    </div>
  );
};

const DeviceCard = ({module, name, color, location, distance, onTrack, onTracking, isTracking, geofenceEnabled, onToggleGeofence }) => {
  return (
    <div className="device-card">
      <div className="left_side">
        <div className='card-header'>
          <h4>{name}</h4>
          <div
              className="status-bar"
              style={{ backgroundColor: color }} // Dynamic color
          >
          </div>
        </div>
        <p>Module: {module}</p>
        <p className="status">{location}</p>
        <p className="distance">
          Distance: {isTracking ? `${distance}` : "Turn on Location"}
        </p>
        <div className="device-card-func">
        <button
          onClick={onTrack}
          style={{
            backgroundColor: onTracking ? "#FF5E5E" : "#EEB700", 
            cursor: "pointer"
          }}
        >
          {onTracking ? "Untrack" : "Track"}
        </button>
        <div className='geofence'>
          <p>Geofence</p>
          <label className="switch">
          <input 
                type="checkbox" 
                checked={geofenceEnabled} 
                onChange={onToggleGeofence} 
          />
          <span className="slider round"></span>
        </label>
        </div>
        </div>
      </div>
      <div className="right_side">
        <span className="material-symbols-outlined">share_location</span>
      </div>
    </div>
  );
};

export default SwipeableDeviceCards;
