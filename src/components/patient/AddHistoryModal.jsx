import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { useLang } from '../../context/LangContext';

// A custom hook for debouncing search input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};


export default function AddHistoryModal({ patientId, onClose, onSave }) {
    const { t } = useLang();
    const [formData, setFormData] = useState({
        illnessName: '',
        status: 'ongoing',
        diagnosisDate: new Date().toISOString().split('T')[0], // Defaults to today
        address: '',
        location: { type: 'Point', coordinates: [0, 0] },
    });
    const [addressSearch, setAddressSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLocating, setIsLocating] = useState(false);
    
    const debouncedSearchTerm = useDebounce(addressSearch, 500);

    // Effect for searching addresses as the user types
    useEffect(() => {
        const searchAddresses = async () => {
            if (debouncedSearchTerm.length < 3) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${debouncedSearchTerm}`);
                const data = await res.json();
                setSearchResults(data);
            } catch (error) {
                console.error("Address search failed:", error);
            }
        };
        searchAddresses();
    }, [debouncedSearchTerm]);

    const handleSelectAddress = (result) => {
        setFormData({
            ...formData,
            address: result.display_name,
            location: { type: 'Point', coordinates: [parseFloat(result.lon), parseFloat(result.lat)] }
        });
        setAddressSearch(result.display_name);
        setSearchResults([]);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Reverse geocode to get address from coordinates
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                handleSelectAddress({ display_name: data.display_name, lon: longitude, lat: latitude });
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
            } finally {
                setIsLocating(false);
            }
        }, () => {
            alert("Unable to retrieve your location.");
            setIsLocating(false);
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave({ ...formData, patientId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{t("addNewDiseaseHistory", "Add New Disease History")}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">{t("illnessCondition", "Illness / Condition")}</label>
                        <input type="text" name="illnessName" value={formData.illnessName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    {/* Location Search */}
                    <div className="relative">
                        <label className="block text-sm font-medium">{t("locationAddress", "Location / Address")}</label>
                        <div className="flex items-center">
                            <input type="text" value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} placeholder={t("searchAddressPlaceholder", "Search for an address")} className="mt-1 block w-full px-3 py-2 border rounded-l-md" />
                            <button onClick={handleGetCurrentLocation} disabled={isLocating} className="bg-blue-500 text-white p-2 mt-1 rounded-r-md disabled:bg-blue-300">
                                <MapPin size={20}/>
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <ul className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                                {searchResults.map(result => (
                                    <li key={result.place_id} onClick={() => handleSelectAddress(result)} className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">{result.display_name}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Other Fields */}
                    <div>
                        <label className="block text-sm font-medium">{t("diagnosisDate", "Diagnosis Date")}</label>
                        <input type="date" name="diagnosisDate" value={formData.diagnosisDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">{t("status", "Status")}</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md">
                            <option value="ongoing">{t("ongoing", "Ongoing")}</option>
                            <option value="resolved">{t("resolved", "Resolved")}</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">{t("cancel", "Cancel")}</button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md">{t("save", "Save")}</button>
                </div>
            </motion.div>
        </div>
    );
}