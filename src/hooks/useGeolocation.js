import { useState, useEffect } from 'react';


export const useGeolocation = (options = {}) => {
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLoadingLocation(false);
    };

    const handleError = (err) => {
      setError({
        code: err.code,
        message: err.message,
      });
      setLoadingLocation(false);
    };

    if (!navigator.geolocation) {
      setError({ message: "Geolocation is not supported by this browser." });
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
  }, [options]); // Re-run if options change

  return { location, loadingLocation, error };
};