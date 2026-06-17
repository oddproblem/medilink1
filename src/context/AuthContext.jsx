import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. CREATE THE CONTEXT ONCE (Globally accessible)
const AuthContext = createContext({
    // Provide non-null defaults to avoid destructuring errors
    doctorToken: null, 
    patientToken: null,
    isDoctorLoggedIn: false,
    isPatientLoggedIn: false,
    login: () => {},
    logout: () => {},
    // Including setters for completeness, though not strictly needed by consumers
    setDoctorToken: () => {},
    setPatientToken: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }) => {
    // State to hold the authentication tokens
    const [doctorToken, setDoctorToken] = useState(null);
    const [patientToken, setPatientToken] = useState(null);

    // ❌ REMOVED: The second, erroneous definition of AuthContext was here.

    // Initial setup: Load tokens from localStorage on mount
    useEffect(() => {
        const loadTokens = () => {
            setDoctorToken(localStorage.getItem("doctorAuthToken"));
            setPatientToken(localStorage.getItem("authToken"));
        };

        loadTokens();

        // Optional: Listen for storage events across tabs
        window.addEventListener('storage', loadTokens);
        return () => {
            window.removeEventListener('storage', loadTokens);
        };
    }, []);

    // Function to handle login (used by login pages)
    const login = (type, token, id = null) => {
        if (type === 'patient') {
            localStorage.setItem("authToken", token);
            if (id) localStorage.setItem("patientId", id);
            setPatientToken(token);
            setDoctorToken(null);
        } else if (type === 'doctor') {
            localStorage.setItem("doctorAuthToken", token);
            setDoctorToken(token);
            setPatientToken(null);
        }
    };

    // Function to handle logout (used by Navbar)
    const logout = (type) => {
        if (type === 'doctor') {
            localStorage.removeItem("doctorAuthToken");
            setDoctorToken(null);
        } else if (type === 'patient') {
            localStorage.removeItem("authToken");
            localStorage.removeItem("patientId");
            setPatientToken(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                doctorToken,
                patientToken,
                isDoctorLoggedIn: !!doctorToken,
                isPatientLoggedIn: !!patientToken,
                login,
                logout,
                setDoctorToken,
                setPatientToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};