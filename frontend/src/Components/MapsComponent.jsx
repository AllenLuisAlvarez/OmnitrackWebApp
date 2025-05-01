import React, { useRef, useEffect, useState, useContext, useMemo } from "react";
import Loader from "../Loader/Loader";
import { useDevices } from "./DeviceContext";
import { UserContext } from "./UserContext";
import { toast } from "react-toastify";
import motorIcon from "../Pages/images/motor2.png";

//import * as turf from "@turf/turf";

const MapsComponent = ({ activeDevice, selectedFilter = "today", selectedDate, geofenceStatus, isTracking, isLoaded}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const circlesRef = useRef({});
    const polylinesRef = useRef({});
    const geofencesRef = useRef({});
    
    const userMarkerRef = useRef(null);
    const userCircleRef = useRef(null);

    const [routes, setRoutes] = useState({});
    const routePolylinesRef = useRef({}); // Store only route polylines

    const { devices, locations, setLocations, coordinates, updateDeviceDistances } = useDevices();
    const { userLocation } = useContext(UserContext);
    const mapId = "9b8de3b2ac66ed81";
    
    const [coordinatesReady, setCoordinatesReady] = useState(false);

    useEffect(() => {
        if (coordinates.length > 0) {
            setCoordinatesReady(true);
        }
    }, [coordinates]);

    /*
    const calculateDistance = (userLocation, moduleLocation) => {
        if (!userLocation || !moduleLocation) return "N/A";
      
        const from = turf.point([userLocation.lon, userLocation.lat]);
        const to = turf.point([moduleLocation.lng, moduleLocation.lat]); // Ensure correct format
        const options = { units: "kilometers" };
                
        return turf.distance(from, to, options).toFixed(2);
    };

    const deviceDistances = useMemo(() => {
        if (!devices || !locations || !userLocation) return [];
    
        return devices.map((device) => {
            const latestLocation = locations[device.Module]?.coordinates;
            if (!latestLocation || !latestLocation.Timestamp) {
                return { ...device, distance: "Calculating..." };
            }

            return {
                ...device,
                distance: calculateDistance(
                    { lat: userLocation.lat, lon: userLocation.lon }, // Pass as object
                    { lat: latestLocation.Latitude, lng: latestLocation.Longitude } // Pass as object
                ),
            };
        });
    }, [devices, locations, userLocation]);
    
    useEffect(() => {
        updateDeviceDistances(deviceDistances);
    }, [deviceDistances, updateDeviceDistances]);
    */
    const reverseGeocode = async (lng, lat) => {
        const geocoder = new window.google.maps.Geocoder();
        return new Promise((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                    resolve(results[0].formatted_address); // Get readable address
                } else {
                    resolve("Unknown Location"); // Fallback if geocoding fails
                }
            });
        });
    };
    /*
    const fetchSnappedPath = async (path, module, color) => {
        if (path.length < 2) return;
    
        const directionsService = new window.google.maps.DirectionsService();
    
        const request = {
            origin: path[0],
            destination: path[path.length - 1],
            waypoints: path.slice(1, -1).map(coord => ({ location: coord, stopover: false })),
            travelMode: window.google.maps.TravelMode.DRIVING, // Adjust based on your use case
        };
    
        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                const snappedPath = result.routes[0].overview_path;
    
                const snappedPolyline = new window.google.maps.Polyline({
                    path: snappedPath,
                    geodesic: true,
                    strokeColor: color, // Green snapped line
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    map: mapRef.current,
                });
    
                polylinesRef.current[module].push(snappedPolyline);
            }
        });
    };*/
    
    const fetchSnappedPath = async (path, module, color) => {
        if (path.length < 2) return;
    
        const apiKey = process.env.REACT_APP_MAPS_API_KEY; // Replace with your API key
        const baseUrl = "https://roads.googleapis.com/v1/snapToRoads";
        const batchSize = 100; // Max points per request
    
        // Split path into chunks of max 100 points
        const pathChunks = [];
        for (let i = 0; i < path.length; i += batchSize) {
            pathChunks.push(path.slice(i, i + batchSize));
        }
    
        let snappedFullPath = [];
    
        for (const chunk of pathChunks) {
            const pathString = chunk.map(coord => `${coord.lat},${coord.lng}`).join("|");
            const url = `${baseUrl}?path=${pathString}&interpolate=true&key=${apiKey}`;
    
            try {
                const response = await fetch(url);
                const data = await response.json();
    
                if (data.snappedPoints) {
                    snappedFullPath.push(...data.snappedPoints.map(point => ({
                        lat: point.location.latitude,
                        lng: point.location.longitude
                    })));
                }
            } catch (error) {
                console.error("Error fetching snapped path:", error);
            }
    
            // Introduce a short delay to prevent rapid-fire requests
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between requests
        }
    
        // Draw the final snapped polyline on the map
        if (snappedFullPath.length > 0) {
            const snappedPolyline = new window.google.maps.Polyline({
                path: snappedFullPath,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 0.4,
                strokeWeight: 4,
                map: mapRef.current,
            });
    
            polylinesRef.current[module].push(snappedPolyline);
        }
    };
    
    const fetchGoogleRoute = async (userLocation, moduleLocation) => {
        if (!userLocation || !moduleLocation) return null;
    
        const origin = `${userLocation.lat},${userLocation.lon}`;
        const destination = `${moduleLocation.lat},${moduleLocation.lng}`;
        const url = `http://localhost:8800/api/routes?origin=${origin}&destination=${destination}`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.polyline) {
                return data.polyline; // Encoded polyline for Google Maps
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    
        return null;
    };

    /*
    // MARKER DISTANCE
    const fetchGoogleDistance = async (userLocation, moduleLocation) => {
        if (!userLocation || !moduleLocation) return "Unknown";
        
        const origin = `${userLocation.lat},${userLocation.lon}`;
        const destination = `${moduleLocation.lat},${moduleLocation.lng}`;
        
        const url = `http://localhost:8800/api/distance?origin=${origin}&destination=${destination}`;
      
        try {
          const response = await fetch(url);
          const data = await response.json();
      
          if (data.rows.length > 0) {
            return data.rows[0].elements[0].distance.text; // Example: "5.3 km"
          }
        } catch (error) {
          console.error("Error fetching distance:", error);
        }
        return;
      };      

    const deviceDistances = useMemo(() => {
        if (!devices || !locations || !userLocation) return [];
    
        return devices.map((device) => {
            const latestLocation = locations[device.Module]?.coordinates;
            if (!latestLocation || !latestLocation.Timestamp) {
                return { ...device, distance: "Calculating..." };
            }
    
            return {
                ...device,
                distance: "Fetching...", // Placeholder while fetching actual distance
            };
        });
    }, [devices, locations, userLocation]);
    
    // Fetch Google Distance API and update device distances
    useEffect(() => {
        if (!isTracking) return;

        const updateDistances = async () => {
            const updatedDistances = await Promise.all(
                deviceDistances.map(async (device) => {
                    if (device.distance === "Fetching...") {
                        const googleDistance = await fetchGoogleDistance(
                            { lat: userLocation.lat, lon: userLocation.lon },
                            { lat: locations[device.Module].coordinates.Latitude, lng: locations[device.Module].coordinates.Longitude }
                        );
                        return { ...device, distance: googleDistance };
                    }
                    return device;
                })
            );
    
            updateDeviceDistances(updatedDistances);
        };
    
        if (deviceDistances.length > 0) {
            updateDistances();
        }
    }, [isTracking, deviceDistances, userLocation, locations, updateDeviceDistances]);
    // END OF MARKER DISTANCE
    */

    // MARKER ROUTE
    useEffect(() => {
        if (!isTracking || !userLocation) return;
    
        const updateRoutes = async () => {
            const newRoutes = {};
        
            await Promise.all(
                devices.map(async (device) => {
                    const latestLocation = locations[device.Module]?.coordinates;
                    if (!latestLocation) return;
        
                    // Apply filter logic
                    const deviceDate = new Date(latestLocation.Timestamp).toDateString();
                    const selectedDateFormatted = new Date(selectedDate).toDateString(); // Fix here

                    if (selectedFilter === "custom" && deviceDate !== selectedDateFormatted) return;
                                        
                    const route = await fetchGoogleRoute(
                        { lat: userLocation.lat, lon: userLocation.lon },
                        { lat: latestLocation.Latitude, lng: latestLocation.Longitude }
                    );
        
                    if (route) {
                        newRoutes[device.Module] = route;
                    }
                })
            );
        
            setRoutes(newRoutes);
        };
    
        updateRoutes();
    }, [isTracking, selectedFilter, userLocation, devices, locations]);
    // END OF MARKER ROUTE

    // MAP INITIALIZE
    useEffect(() => {
        if (!mapContainerRef.current || !isLoaded) return;
        
        const initMap = async () => {
            try {
                if (!window.google.maps.importLibrary) {
                    console.error("importLibrary is not available");
                    initMap();
                    return;
                }
        
                const mapsLibrary = await window.google.maps.importLibrary("maps");
                const { Map } = mapsLibrary;
        
                mapRef.current = new Map(mapContainerRef.current, {
                    center: { lat: 14.587075, lng: 120.984372 },
                    zoom: 16,
                    mapId: mapId,
                    mapTypeId: "roadmap",
                });
            } catch (error) {
                console.error("Error initializing Google Maps:", error);
            }
        };

        initMap();
    }, [mapId, isLoaded]); // Initialize map once
    // END OF MAP INITIALIZATION

    //USER LOCATION
    // Effect to handle user location marker
    useEffect(() => {
        if (!mapRef.current || !isLoaded || !userLocation) return;
    
        if (!window.google || !window.google.maps) {
            console.error("Google Maps API is not available.");
            return;
        }
    
        if (!mapRef.current) {
            console.error("Map reference is not initialized.");
            return;
        }
    
        // If userLocation is null, remove marker and circle
        if (!isTracking) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null); // Remove marker
                userMarkerRef.current = null;
            }
            if (userCircleRef.current) {
                userCircleRef.current.setMap(null); // Remove circle
                userCircleRef.current = null;
            }
            return;
        }
    
        const createUserCircle = (map, userLocation) => {
            if (!isLoaded) return;
    
            const { Circle } = window.google.maps;
    
            const pulseCircle = new Circle({
                strokeColor: "#4285F4",
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: "#4285F4",
                fillOpacity: 0.5,
                map: map,
                center: userLocation,
                radius: 0,
            });
    
            const stopAnimation = animatePulsingCircle(pulseCircle);
    
            return { pulseCircle, stopAnimation };
        };
    
        const { Marker } = window.google.maps;
    
        const lat = parseFloat(userLocation.lat);
        const lon = parseFloat(userLocation.lon);
    
        if (isNaN(lat) || isNaN(lon)) return;
    
        // Create or update marker
        if (!userMarkerRef.current) {
            userMarkerRef.current = new Marker({
                position: { lat, lng: lon },
                map: mapRef.current,
                title: "You",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                }
            });
        } else {
            userMarkerRef.current.setPosition({ lat, lng: lon });
        }
    
        // Create or update circle
        if (!userCircleRef.current) {
            const { pulseCircle, stopAnimation } = createUserCircle(mapRef.current, { lat, lng: lon });
            userCircleRef.current = pulseCircle;
    
            return () => stopAnimation(); // Stop animation when unmounting
        } else {
            userCircleRef.current.setCenter({ lat, lng: lon });
        }
    }, [userLocation, isLoaded, isTracking]);    
    
    const animatePulsingCircle = (circle) => {
        let radius = 0;
        const maxRadius = 35;
        let isAnimating = true; // Add a flag to stop animation if needed
    
        const pulse = () => {
            if (!circle.getMap() || !isAnimating) return; // Stop if removed
    
            radius += 0.4;
            if (radius >= maxRadius) radius = 0;
    
            const opacity = 1 - radius / maxRadius;
            const stroke = 1 - radius / maxRadius;
    
            circle.setRadius(radius);
            circle.setOptions({ fillOpacity: opacity, strokeOpacity: stroke });
    
            requestAnimationFrame(pulse);
        };
    
        pulse();
    
        return () => { isAnimating = false; }; // Stop animation if unmounted
    };
    // END OF USER LOCATION

    // MAP MARKERS
    useEffect(() => { 
        if (!mapRef.current || !coordinates || !coordinates.length) return;
    
        const today = new Date().toISOString().split("T")[0];
    
        // Step 1: Group coordinates by module → date
        const groupedCoordinates = coordinates.reduce((acc, curr) => {
            const coordDate = curr.Timestamp.split(" ")[0]; // Extract YYYY-MM-DD
            if (!acc[curr.Module]) acc[curr.Module] = {};
            if (!acc[curr.Module][coordDate]) acc[curr.Module][coordDate] = [];
    
            acc[curr.Module][coordDate].push(curr);
            return acc;
        }, {});
    
        // Step 2: Remove all existing markers and circles
        Object.values(markersRef.current).forEach(markerArray => markerArray.forEach(marker => marker.setMap(null)));
        Object.values(polylinesRef.current).forEach(polylineArray => polylineArray.forEach(polyline => polyline.setMap(null)));
        Object.values(circlesRef.current).forEach(circleArray => circleArray.forEach(circle => circle.setMap(null)));
    
        markersRef.current = {}; // Reset markers
        polylinesRef.current = {};
        circlesRef.current = {}; // Reset circles
    
        let hasValidData = false; // Track if we have any valid data for the selected filter
    
        // Step 3: Process each module and date
        for (const [module, dates] of Object.entries(groupedCoordinates)) {
            markersRef.current[module] = [];
            polylinesRef.current[module] = [];
    
            const latestCoordsAcrossDates = [];
            
            for (const [date, coords] of Object.entries(dates)) {
                // Skip markers that don’t match the filter
                if (
                    (selectedFilter === "today" && date !== today) ||
                    (selectedFilter === "custom" && date !== selectedDate)
                ) {
                    continue;
                }
    
                hasValidData = true; // We found at least one valid coordinate
    
                // Step 4: Sort coordinates to get the latest per module-date
                const sortedCoords = coords.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
                const latestCoord = sortedCoords[sortedCoords.length - 1];
                latestCoordsAcrossDates.push(latestCoord);
    
                // Step 5: Draw a polyline connecting all coordinates
                const path = sortedCoords.map(coord => ({
                    lat: parseFloat(coord.Latitude),
                    lng: parseFloat(coord.Longitude),
                }));
                /*
                const polyline = new window.google.maps.Polyline({
                    path,
                    geodesic: true,
                    strokeColor: latestCoord.Color,
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    map: mapRef.current,
                });
    
                polylinesRef.current[module].push(polyline);*/
                fetchSnappedPath(path, module, latestCoord.Color);

                // Step 6: Add marker for the latest coordinate
                /*
                const marker = new window.google.maps.Marker({
                    position: { lat: parseFloat(latestCoord.Latitude), lng: parseFloat(latestCoord.Longitude) },
                    map: mapRef.current,
                    title: latestCoord.Name,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: latestCoord.Color || "#FF0000",
                        fillOpacity: 1,
                        strokeWeight: 4,
                        strokeColor: "white"
                    }
                }); */
                const iconColor = latestCoord.Color || "#FF0000"; // Default color
                const circleSize = 40; // Outer circle diameter
                const motorSize = 24; // Motorcycle icon size
                
                // Create an SVG with a centered circle + motorcycle icon
                const markerSVG = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${circleSize}" height="${circleSize}" viewBox="0 0 ${circleSize} ${circleSize}">
                        <!-- Background Circle -->
                        <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${(circleSize / 2) - 2}" fill="${iconColor}" stroke="white" stroke-width="3"/>
                        <!-- Motorcycle Image (centered) -->
                        <image href="${motorIcon}" x="${(circleSize - motorSize) / 2}" y="${(circleSize - motorSize) / 2}" width="${motorSize}" height="${motorSize}" preserveAspectRatio="xMidYMid meet"/>
                    </svg>
                `;
                
                const marker = new window.google.maps.Marker({
                    position: { lat: parseFloat(latestCoord.Latitude), lng: parseFloat(latestCoord.Longitude) },
                    map: mapRef.current,
                    title: latestCoord.Name,
                    icon: {
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSVG)}`,
                        scaledSize: new window.google.maps.Size(circleSize, circleSize), // Keep size consistent
                        anchor: new window.google.maps.Point(circleSize / 2, circleSize / 2) // Center the marker
                    }
                });
                

                markersRef.current[module].push(marker);
            }
    
            // Find the latest coordinate among all valid dates
            let latestCoordForSelectedFilter = null;
            if (latestCoordsAcrossDates.length > 0) {
                latestCoordForSelectedFilter = latestCoordsAcrossDates.reduce((latest, coord) => {
                    return new Date(coord.Timestamp).getTime() > new Date(latest.Timestamp).getTime() ? coord : latest;
                }, latestCoordsAcrossDates[0]);
            }
    
            if (latestCoordForSelectedFilter) {
                const { Longitude, Latitude, Timestamp } = latestCoordForSelectedFilter;
    
                setLocations((prev) => ({
                    ...prev,
                    [module]: {
                        Longitude,
                        Latitude,
                        Timestamp,
                    }
                }));
    
                reverseGeocode(Longitude, Latitude).then((location) => {
                    setLocations((prev) => {
                        if (prev[module]?.name === location) return prev; // Prevent unnecessary re-renders
    
                        return {
                            ...prev,
                            [module]: {
                                name: location,
                                Longitude,
                                Latitude,
                                coordinates: { Longitude, Latitude, Timestamp },
                            }
                        };
                    });
                });
            }
        }
    
        // Step 7: If "today" is selected but no data exists, reset location to "No Location"
        if (selectedFilter === "today" && !hasValidData) {
            setLocations((prev) => {
                const updatedLocations = { ...prev };
                Object.keys(prev).forEach(module => {
                    updatedLocations[module] = { name: "No Location", Longitude: null, Latitude: null, coordinates: null };
                });
                return updatedLocations;
            });
        }
    }, [coordinatesReady,selectedFilter, selectedDate, setLocations, coordinates]);
    // END OF MAP MARKERS   
    
    // MARKER GEOFENCES
    useEffect(() => {
        if (!mapRef.current || !locations) return;

        // Ensure geofences are tracked
        if (!geofencesRef.current) {
            geofencesRef.current = {};
        }

        Object.entries(geofenceStatus || {}).forEach(([module, isEnabled]) => {
            if (isEnabled) {
                // If geofence exists, don't create a new one
                if (geofencesRef.current[module]) return;

                // Get the latest location when geofence is enabled
                const { Longitude, Latitude } = locations[module]?.coordinates || {};
                if (!Longitude || !Latitude) return;

                // Create geofence circle (only when enabled)
                const geofenceCircle = new window.google.maps.Circle({
                    center: { lat: parseFloat(Latitude), lng: parseFloat(Longitude) },
                    radius: 20, // 50 meters
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35,
                    map: mapRef.current,
                });

                // Store only the circle (fixes getCenter() issues)
                geofencesRef.current[module] = geofenceCircle;
            } else {
                // Remove geofence if toggled off
                if (geofencesRef.current[module]) {
                    geofencesRef.current[module].setMap(null);
                    delete geofencesRef.current[module];
                }
            }
        });
    }, [geofenceStatus, locations]); 
    // END OF MARKER GEOFENCE

    useEffect(() => {
        if (!mapRef.current || !locations) return;
    
        const checkGeofence = () => {
            Object.entries(geofenceStatus || {}).forEach(([module, isEnabled]) => {
                if (!isEnabled || !locations[module]) return;
    
                const { Longitude, Latitude } = locations[module].coordinates || {};
                const geofence = geofencesRef.current[module];
    
                // Ensure geofence exists and location data is valid
                if (!geofence || !Longitude || !Latitude) return;
    
                const newLocation = new window.google.maps.LatLng(parseFloat(Latitude), parseFloat(Longitude));
                const geofenceCenter = geofence.getCenter();
    
                if (!geofenceCenter) return;
    
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(geofenceCenter, newLocation);
    
                if (distance > 50) { // 50m geofence breach
                    // Check if a warning has already been sent recently
                    const lastAlert = geofencesRef.current[module]?.lastAlert || 0;
                    const now = Date.now();
    
                    if (now - lastAlert >= 5000) { // 10 seconds interval
                        geofencesRef.current[module].lastAlert = now;
    
                        // Play alert sound
                        const audio = new Audio("/alert.mp3");
                        audio.play().catch((err) => console.log("Audio playback failed:", err));
    
                        toast.warning(`${module} has moved outside the geofence!`, {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        });
                    }
                }
            });
        };
    
        // Run the function immediately when geofence toggles on
        checkGeofence();
    
        // Set interval for repeated checks
        const interval = setInterval(checkGeofence, 10000); // Every 10 seconds
    
        return () => clearInterval(interval); // Cleanup on unmount or toggle change
    }, [locations, geofenceStatus]);    
    
    //Route Marker Tracker
    const drawDirectionsRoute = (encodedPolyline, color, module) => {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
      
        if (routePolylinesRef.current[module]) {
          routePolylinesRef.current[module].setMap(null);
        }
      
        const routePolyline = new window.google.maps.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 1,
          strokeWeight: 4,
          map: mapRef.current
        });
      
        routePolylinesRef.current[module] = routePolyline;
      };
      
    useEffect(() => {
        if (!mapRef.current) return;

        // If tracking is OFF, remove the route line
        if (!activeDevice) {
            Object.values(routePolylinesRef.current).forEach(polyline => polyline.setMap(null));
            routePolylinesRef.current = {};
            return;
        }

        // If tracking is ON, find latest coordinate
        const latestCoord = coordinates
            .filter(coord => coord.Module === activeDevice)
            .reduce((latest, current) =>
            !latest || new Date(current.Timestamp) > new Date(latest.Timestamp) ? current : latest,
            null);

        if (!latestCoord || !userLocation) return;

        const lat = parseFloat(latestCoord.Latitude);
        const lng = parseFloat(latestCoord.Longitude);

        // Center and zoom to device
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(18);

        // Draw route from userLocation to device
        const fetchRoute = async () => {
            const route = await fetchGoogleRoute(
            { lat: userLocation.lat, lon: userLocation.lon },
            { lat: latestCoord.Latitude, lng: latestCoord.Longitude }
            );

            const device = devices.find(d => d.Module === activeDevice);
            const color = device?.Color || "#000";

            if (route) {
            drawDirectionsRoute(route, color, activeDevice);
            }
        };

        fetchRoute();
    }, [activeDevice, coordinates, userLocation, devices]);

    useEffect(() => {
        if (!mapRef.current || !activeDevice) return;
      
        const latestCoord = coordinates
          .filter(coord => coord.Module === activeDevice)
          .reduce((latest, current) =>
            !latest || new Date(current.Timestamp) > new Date(latest.Timestamp) ? current : latest,
          null);
      
        if (!latestCoord) return;
      
        const lat = parseFloat(latestCoord.Latitude);
        const lng = parseFloat(latestCoord.Longitude);
      
        mapRef.current.panTo({ lat, lng });
    }, [coordinates, activeDevice]);
      

    return <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />;
};

export default MapsComponent;


