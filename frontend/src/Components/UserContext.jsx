import React, { createContext, useState, useEffect } from "react";

// Create context
export const UserContext = createContext();

// Provide context
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);

    const fetchSessionUser = async () => {
        try {
            const response = await fetch("https://omnitrackwebapp.onrender.com/get-session-user", {
                credentials: "include", // Include cookies for the session
            });

            // Check if the response status is OK (200)
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
                return;
            }
        } catch (error) {
            // Catch network or other errors
            console.error("Error fetching session user:", error);
            setUser(null); // Set user to null in case of an error
        }
        setLoading(false); // End the loading state
    };

    useEffect(() => {
        // Check localStorage for user data (if stored there during login)
        const storedUser = {
            userId: localStorage.getItem("userId"),
            username: localStorage.getItem("username"),
            email: localStorage.getItem("email"),
            mobile: localStorage.getItem("mobile"),
            profileImage: localStorage.getItem("profileImage"),
            isNewUser: localStorage.getItem("isNewUser") === 'true',
        }

        if (storedUser.userId) {
            setUser(storedUser);
        }
        
        setLoading(false);
    }, []);

    if (loading) {
        return <p>Loading</p>;
    }
    
    const loginUser = (userData) => {
        setUser(userData);

        // Optionally, persist user in localStorage
        localStorage.setItem("userId", userData.userId);
        localStorage.setItem("username", userData.username);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("mobile", userData.mobile);
        localStorage.setItem("profileImage", userData.profileImage);
        localStorage.setItem("isNewUser", userData.isNewUser);
    };

    const logoutUser = async () => {
        try {
            const response = await fetch("https://omnitrackwebapp.onrender.com/logout", {
              method: "POST",
              credentials: "include",
            });
            if (response.ok) {
              setUser(null); // Clear user from context
            }
          } catch (error) {
            console.error("Error during logout:", error);
        }
        localStorage.clear(); // Clear localStorage on logout
    };

    return (
        <UserContext.Provider value={{ user, setUser, loading, loginUser, logoutUser, fetchSessionUser, userLocation, setUserLocation }}>
            {children}
        </UserContext.Provider>
    );
};
