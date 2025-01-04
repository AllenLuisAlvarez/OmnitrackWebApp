import React, { useRef, useEffect, useCallback} from "react";
import { useDevices } from "./DeviceContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Import the required CSS

mapboxgl.accessToken = "pk.eyJ1IjoiamVkZHJhc2NvIiwiYSI6ImNtMDgzOWpqNzBseTQybG9reDgwdG5ma2MifQ.IDJqlXbXAYJKidQGIEakFA";

const MapboxComponent = ({ activeDevice }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const lineLayersRef = useRef({});
    const { coordinates, setLocations } = useDevices();

    const reverseGeocode = async (longitude, latitude) => {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                return data.features[0].place_name; // Return the first result
            }
            return "Unknown Location"; // Default if no result found
        } catch (error) {
            console.error("Error fetching location:", error);
            return "Error fetching location";
        }
    };

    // Function to fetch a road-following route using Mapbox Directions API
    const fetchRoute = useCallback(async (start, end) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        try {
        const response = await fetch(url);
        const data = await response.json();
        return data.routes[0]?.geometry; // Return the route geometry if available
        } catch (error) {
        console.error("Error fetching route:", error);
        return null;
        }
    }, []);
    
    // Function to add markers and road-following routes
    const addMarkersAndRoutes = useCallback(
        async (map, groupedCoordinates) => {
            // Clear previous markers and routes
            Object.keys(markersRef.current).forEach((module) => {
                markersRef.current[module]?.forEach((marker) => marker.remove());
            });
            markersRef.current = {};

            Object.keys(lineLayersRef.current).forEach((layerId) => {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(layerId)) map.removeSource(layerId);
            });
            lineLayersRef.current = {};

            // Process each module and date
            for (const [module, dates] of Object.entries(groupedCoordinates)) {
                markersRef.current[module] = [];

                for (const [date, coords] of Object.entries(dates)) {
                    const sortedCoords = coords.sort(
                        (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
                    );

                    // Add road-following routes between consecutive coordinates
                    for (let i = 0; i < sortedCoords.length; i++) {
                        const coord = sortedCoords[i];
                        const { Longitude, Latitude, Color, Timestamp } = coord;

                        if (i > 0) {
                            const previousCoord = sortedCoords[i - 1];
                            const route = await fetchRoute(
                                [parseFloat(previousCoord.Longitude), parseFloat(previousCoord.Latitude)],
                                [parseFloat(Longitude), parseFloat(Latitude)]
                            );

                            if (route) {
                                const layerId = `${module}-${date}-${i}`;

                                // Skip if the source or layer already exists
                                if (map.getSource(layerId) || map.getLayer(layerId)) {
                                    continue;
                                }

                                map.addSource(layerId, {
                                    type: "geojson",
                                    data: {
                                        type: "Feature",
                                        geometry: route,
                                    },
                                });

                                map.addLayer({
                                    id: layerId,
                                    type: "line",
                                    source: layerId,
                                    layout: {
                                        "line-join": "round",
                                        "line-cap": "round",
                                    },
                                    paint: {
                                        "line-color": Color || "#FF0000",
                                        "line-width": 4,
                                    },
                                });

                                lineLayersRef.current[layerId] = layerId;
                            }
                        }

                        // Add a marker for the latest coordinate only
                        if (i === sortedCoords.length - 1) {
                            const markerElement = document.createElement("div");
                            markerElement.style.backgroundColor = Color || "#FF0000";
                            markerElement.style.width = "15px";
                            markerElement.style.height = "15px";
                            markerElement.style.borderRadius = "50%";
                            markerElement.style.border = "2px solid white";

                            const marker = new mapboxgl.Marker({ element: markerElement })
                                .setLngLat([parseFloat(Longitude), parseFloat(Latitude)])
                                .setPopup(new mapboxgl.Popup().setText(`Module: ${module}`))
                                .addTo(map);

                            if (!markersRef.current[module]) {
                                markersRef.current[module] = []; // Initialize as an array
                            }

                            markersRef.current[module].push(marker);

                            // Reverse geocode the latest coordinates and update location
                            reverseGeocode(Longitude, Latitude).then((location) => {
                                setLocations((prev) => ({
                                    ...prev,
                                    [module]: { name: location, Longitude, Latitude, Timestamp }
                                }));
                            });
                        }
                    }
                }
            }
        },
        [fetchRoute]
    );
    
    useEffect(() => {
        const initializeMap = () => {
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [120.984353, 14.586988],
            zoom: 16,
        });
    
        const map = mapRef.current;
    
        map.on("styledata", () => {
            if (map.isStyleLoaded()) {
            const groupedCoordinates = coordinates.reduce((acc, coord) => {
                const { Module, Timestamp } = coord;
                const date = new Date(Timestamp).toISOString().split("T")[0];
                if (!acc[Module]) acc[Module] = {};
                if (!acc[Module][date]) acc[Module][date] = [];
                acc[Module][date].push(coord);
                return acc;
            }, {});
    
            addMarkersAndRoutes(map, groupedCoordinates);
            }
        });
    
        map.on("load", () => {
            if (map.isStyleLoaded()) {
            const groupedCoordinates = coordinates.reduce((acc, coord) => {
                const { Module, Timestamp } = coord;
                const date = new Date(Timestamp).toISOString().split("T")[0];
                if (!acc[Module]) acc[Module] = {};
                if (!acc[Module][date]) acc[Module][date] = [];
                acc[Module][date].push(coord);
                return acc;
            }, {});
    
            addMarkersAndRoutes(map, groupedCoordinates);
            }
        });
        };
    
        if (!mapRef.current) {
            initializeMap();
        } else if (mapRef.current.isStyleLoaded()) {
        const groupedCoordinates = coordinates.reduce((acc, coord) => {
            const { Module, Timestamp } = coord;
            const date = new Date(Timestamp).toISOString().split("T")[0];
            if (!acc[Module]) acc[Module] = {};
            if (!acc[Module][date]) acc[Module][date] = [];
            acc[Module][date].push(coord);
            return acc;
        }, {});
    
        addMarkersAndRoutes(mapRef.current, groupedCoordinates);
        }
    }, [coordinates, addMarkersAndRoutes]);
    
    // Fly to the latest coordinate for the active device
    useEffect(() => {
        if (activeDevice && mapRef.current && coordinates) {
        const latestCoordinate = coordinates
            .filter((coord) => coord.Module === activeDevice)
            .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))[0];
    
        if (latestCoordinate) {
            const { Longitude, Latitude } = latestCoordinate;
            mapRef.current.flyTo({
            center: [parseFloat(Longitude), parseFloat(Latitude)],
            zoom: 16,
            });
        }
        }
    }, [activeDevice, coordinates]);
    
    return <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />;
};
    
export default MapboxComponent;