import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useLang } from "../../context/LangContext";

const HotspotMap = () => {
  // 🌐 Use the `useLang` hook to access translation utilities
  const { t, language } = useLang();
  
  const [apiKey, setApiKey] = useState("");
  const [hotspots, setHotspots] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("Chickenpox");

  const center = { lat: 16.5208, lng: 80.5233 }; // Default: Vijayawada

  // Fetch API key once
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const keyRes = await fetch("https://newmediback.onrender.com/api/v1/config/maps");
        const keyData = await keyRes.json();
        setApiKey(keyData.apiKey);
      } catch (err) {
        console.error("Error fetching API key:", err);
      }
    };
    fetchKey();
  }, []);

  // Fetch cases whenever disease changes
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(
          `https://newmediback.onrender.com/api/v1/hotspots?illnessName=${selectedDisease}`
        );
        const cases = await res.json();
        setHotspots(cases);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    };

    if (selectedDisease) fetchCases();
  }, [selectedDisease]);

  if (!apiKey) return <p className="pt-20 p-6">{t("loadingMap")}</p>;

  // Define the list of diseases here so we can translate them
  const diseases = [
    { value: "Chickenpox", label: t("chickenpox") },
    { value: "Malaria", label: t("malaria") },
    { value: "Dengue", label: t("dengue") },
    { value: "COVID-19", label: t("covid19") },
    { value: "Typhoid", label: t("typhoid") },
  ];

  return (
    <div className="w-full pt-16 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Dropdown for disease selection */}
        <div className="mb-4">
          <label className="mr-2 font-semibold text-gray-800 dark:text-gray-200">
            {t("selectDisease")}:
          </label>
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="border rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            {diseases.map(disease => (
                <option key={disease.value} value={disease.value}>
                    {disease.label}
                </option>
            ))}
          </select>
        </div>

        {/* Map */}
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "500px" }}
            center={center}
            zoom={12}
          >
            {hotspots.map((hotspot, idx) => (
              <Marker
                key={idx}
                position={{
                  lat: hotspot.location.coordinates[1],
                  lng: hotspot.location.coordinates[0],
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default HotspotMap;
