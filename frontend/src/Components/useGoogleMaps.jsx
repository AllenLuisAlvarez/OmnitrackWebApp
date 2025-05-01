import { useState, useEffect } from "react";

const useGoogleMaps = () => {
    const apiKey = "AIzaSyB-kzmEIhlET9ooh3hDFdVVtpmzdkUxLiM";
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkGoogleMapsLoaded = () => {
            if (window.google?.maps) {
                setIsLoaded(true);
            } else {
                setTimeout(checkGoogleMapsLoaded, 100); // Check again in 100ms
            }
        };

        const existingScript = document.querySelector("script[src*='maps.googleapis.com']");

        if (existingScript) {
            checkGoogleMapsLoaded(); // Ensure window.google.maps is available
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = checkGoogleMapsLoaded;

        document.head.appendChild(script);
    }, [apiKey]);

    return isLoaded;
};

export default useGoogleMaps;

