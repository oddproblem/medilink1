import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import {
  User,
  Pill,
  HeartPulse,
  MessageSquare,
  Send,
  History,
  Edit,
  PlusCircle,
  MapPin,
  Trash2,
} from "lucide-react";
import { useLang } from "../../context/LangContext";
import EmailSummary from "./EmailSummary";
const BACKEND_URL = `${process.env.REACT_APP_BACKEND_WITHOUT_V1}`;

// --- Helper Hook for Debouncing Search Input ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const modalVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
  exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } },
};

// --- Add History Modal Component ---
const AddHistoryModal = ({ patientId, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    illnessName: "",
    diagnosisDate: new Date().toISOString().split("T")[0],
    initialSymptoms: "",
    remarks: "",
    medicinesPrescribed: "",
    status: "ongoing",
    hospital: "",
    address: "",
    location: { type: "Point", coordinates: [0, 0] },
  });

  const [addressSearch, setAddressSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const debouncedSearchTerm = useDebounce(addressSearch, 500);

  useEffect(() => {
    const searchAddresses = async () => {
      if (debouncedSearchTerm.length < 3) {
        setSearchResults([]);
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${debouncedSearchTerm}`
      );
      const data = await res.json();
      setSearchResults(data);
    };
    searchAddresses();
  }, [debouncedSearchTerm]);

  const handleSelectAddress = (result) => {
    const newAddress = result.display_name;
    const newLocation = {
      type: "Point",
      coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
    };
    setFormData({ ...formData, address: newAddress, location: newLocation });
    setAddressSearch(newAddress);
    setSearchResults([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert(t("geolocationNotSupported"));
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        handleSelectAddress({
          display_name: data.display_name,
          lon: longitude,
          lat: latitude,
        });
        setIsLocating(false);
      },
      () => {
        alert(t("unableToRetrieveLocation"));
        setIsLocating(false);
      }
    );
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    const processedData = {
      ...formData,
      patientId,
      initialSymptoms: formData.initialSymptoms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      medicinesPrescribed: formData.medicinesPrescribed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {t("addHistory")}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="illnessName"
            value={formData.illnessName}
            onChange={handleChange}
            placeholder={t("illnessName")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="date"
            name="diagnosisDate"
            value={formData.diagnosisDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea
            name="initialSymptoms"
            value={formData.initialSymptoms}
            onChange={handleChange}
            placeholder={t("initialSymptoms")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <textarea
            name="medicinesPrescribed"
            value={formData.medicinesPrescribed}
            onChange={handleChange}
            placeholder={t("medicinesPrescribed")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <input
            type="text"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            placeholder={t("hospital")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder={t("remarks")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="ongoing">{t("ongoing")}</option>
            <option value="resolved">{t("resolved")}</option>
          </select>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("locationAddress")}
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder={t("searchAddress")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="bg-blue-500 text-white p-2.5 mt-1 rounded-r-md disabled:bg-blue-300 dark:disabled:bg-blue-600"
              >
                <MapPin size={20} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="absolute w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                {searchResults.map((result) => (
                  <li
                    key={result.place_id}
                    onClick={() => handleSelectAddress(result)}
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100"
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            {t("save")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Edit History Modal Component ---
const EditHistoryModal = ({ historyItem, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    illnessName: historyItem.illnessName || "",
    diagnosisDate: historyItem.diagnosisDate
      ? new Date(historyItem.diagnosisDate).toISOString().split("T")[0]
      : "",
    initialSymptoms: (historyItem.initialSymptoms || []).join(", "),
    remarks: historyItem.remarks || "",
    medicinesPrescribed: (historyItem.medicinesPrescribed || []).join(", "),
    status: historyItem.status || "ongoing",
    hospital: historyItem.hospital || "",
    address: historyItem.address || "",
    location: historyItem.location || { type: "Point", coordinates: [0, 0] },
  });

  const [addressSearch, setAddressSearch] = useState(historyItem.address || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const debouncedSearchTerm = useDebounce(addressSearch, 500);

  useEffect(() => {
    const searchAddresses = async () => {
      if (debouncedSearchTerm.length < 3) {
        setSearchResults([]);
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${debouncedSearchTerm}`
      );
      const data = await res.json();
      setSearchResults(data);
    };
    searchAddresses();
  }, [debouncedSearchTerm]);

  const handleSelectAddress = (result) => {
    const newAddress = result.display_name;
    const newLocation = {
      type: "Point",
      coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
    };
    setFormData({ ...formData, address: newAddress, location: newLocation });
    setAddressSearch(newAddress);
    setSearchResults([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert(t("geolocationNotSupported"));
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        handleSelectAddress({
          display_name: data.display_name,
          lon: longitude,
          lat: latitude,
        });
        setIsLocating(false);
      },
      () => {
        alert(t("unableToRetrieveLocation"));
        setIsLocating(false);
      }
    );
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    const processedData = {
      ...formData,
      initialSymptoms: formData.initialSymptoms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      medicinesPrescribed: formData.medicinesPrescribed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave(historyItem._id, processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {t("editHistory")}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="illnessName"
            value={formData.illnessName}
            onChange={handleChange}
            placeholder={t("illnessName")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="date"
            name="diagnosisDate"
            value={formData.diagnosisDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea
            name="initialSymptoms"
            value={formData.initialSymptoms}
            onChange={handleChange}
            placeholder={t("initialSymptoms")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <textarea
            name="medicinesPrescribed"
            value={formData.medicinesPrescribed}
            onChange={handleChange}
            placeholder={t("medicinesPrescribed")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <input
            type="text"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            placeholder={t("hospital")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          />
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder={t("remarks")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          ></textarea>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="ongoing">{t("ongoing")}</option>
            <option value="resolved">{t("resolved")}</option>
          </select>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("locationAddress")}
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder={t("searchAddress")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="bg-blue-500 text-white p-2.5 mt-1 rounded-r-md disabled:bg-blue-300 dark:disabled:bg-blue-600"
              >
                <MapPin size={20} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="absolute w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                {searchResults.map((result) => (
                  <li
                    key={result.place_id}
                    onClick={() => handleSelectAddress(result)}
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100"
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            {t("saveChanges")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Add Medicine Modal Component ---
const AddMedicineModal = ({ prescriptionId, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!formData.name.trim()) return alert(t("medicineNameRequired"));
    onSave(prescriptionId, formData);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t("addNewMedicine")}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder={t("medicineNamePlaceholder")}
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="dosage"
            placeholder={t("dosage")}
            value={formData.dosage}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="frequency"
            placeholder={t("frequency")}
            value={formData.frequency}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="duration"
            placeholder={t("duration")}
            value={formData.duration}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            {t("addMedicine")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Edit Medicine Modal Component ---
const EditMedicineModal = ({
  medicine,
  prescriptionId,
  onClose,
  onSave,
  t,
}) => {
  const [formData, setFormData] = useState({
    name: medicine.name,
    dosage: medicine.dosage || "",
    frequency: medicine.frequency || "",
    duration: medicine.duration || "",
  });
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSave = () => {
    if (!formData.name.trim()) return alert(t("medicineNameRequired"));
    onSave(prescriptionId, medicine._id, formData);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t("editMedicine")}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder={t("medicineNamePlaceholder")}
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="dosage"
            placeholder={t("dosage")}
            value={formData.dosage}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="frequency"
            placeholder={t("frequency")}
            value={formData.frequency}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <input
            type="text"
            name="duration"
            placeholder={t("duration")}
            value={formData.duration}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            {t("saveChanges")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Add Prescription Modal Component ---
const AddPrescriptionModal = ({ patientId, history, onClose, onSave, t }) => {
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");

  const handleSave = () => {
    const prescriptionData = {};
    if (selectedDiseaseId) {
      prescriptionData.diseaseHistoryId = selectedDiseaseId;
    }
    onSave(prescriptionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {t("createNewPrescription")}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="diseaseLink"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("linkToDiseaseOptional")}
            </label>
            <select
              id="diseaseLink"
              value={selectedDiseaseId}
              onChange={(e) => setSelectedDiseaseId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t("none")}</option>
              {history.length > 0 ? (
                history.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.illnessName} (
                    {new Date(h.diagnosisDate).toLocaleDateString()})
                  </option>
                ))
              ) : (
                <option disabled>{t("noHistoryFound")}</option>
              )}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            {t("createAndContinue")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Chatbot Component ---
const Chatbot = ({ patientId, t, language, translateText }) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { from: "ai", text: t("askQuestion") },
  ]);
  const [translatedMessages, setTranslatedMessages] = useState([
    { from: "ai", text: t("askQuestion") },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateMessages = async () => {
      const textsToTranslate = messages.map((msg) => msg.text);
      try {
        const translatedTexts = await translateText(textsToTranslate, language);
        const newTranslatedMessages = messages.map((msg, index) => ({
          ...msg,
          text: translatedTexts[index],
        }));
        setTranslatedMessages(newTranslatedMessages);
      } catch (err) {
        console.error("Translation of chatbot messages failed:", err);
      }
    };
    translateMessages();
  }, [messages, language, translateText]);

  const handleSend = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage = { from: "user", text: prompt };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    const userQuery = prompt;
    setPrompt("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/v1/summary/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({ patientId, userQuery }),
      });
      if (!res.ok) throw new Error(t("failedToGetAssistantResponse"));
      const data = await res.json();

      const aiMessage = { from: "ai", text: data.answer || t("aiNoAnswer") };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      const errorMessage = {
        from: "ai",
        text: `${t("error")}: ${error.message}`,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
        <MessageSquare className="mr-2" /> {t("aiHealthAssistant")}
      </h3>
      <div className="flex-grow bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
        {translatedMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.from === "ai" ? "justify-start" : "justify-end"
            }`}
          >
            <p
              className={`max-w-xs md:max-w-md p-3 rounded-2xl whitespace-pre-wrap ${
                msg.from === "ai"
                  ? "bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-100"
                  : "bg-green-100 dark:bg-green-900 dark:text-green-100"
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <p className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-600">
              {t("analyzing")}
            </p>
          </div>
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("chatbotPlaceholder")}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="w-full p-2 border rounded-l-lg outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 rounded-r-lg disabled:bg-indigo-400"
        >
          <Send />
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Patient Profile Page ---
export default function PatientProfile() {
  const { id } = useParams();
  const { t, language, translateText } = useLang();

  const [patient, setPatient] = useState(null);
  const [translatedPatient, setTranslatedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [translatedPrescriptions, setTranslatedPrescriptions] = useState([]);
  const [readings, setReadings] = useState([]);
  const [history, setHistory] = useState([]);
  const [translatedHistory, setTranslatedHistory] = useState([]);
  const [error, setError] = useState("");

  const [editingHistory, setEditingHistory] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingMedicine, setIsAddingMedicine] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] =
    useState(false);

  // ... (All useEffect hooks for translation remain the same) ...
  useEffect(() => {
    if (patient) {
      if (language === "en") {
        setTranslatedPatient({ ...patient, translatedGender: patient.gender });
      } else {
        setTranslatedPatient({
          ...patient,
          translatedGender: t(patient.gender) || patient.gender,
        });
      }
    }
  }, [patient, language, t]);

  useEffect(() => {
    const translatePrescriptions = async () => {
      if (prescriptions.length === 0 || language === "en") {
        setTranslatedPrescriptions(
          prescriptions.map((p) => ({
            ...p,
            translatedMedicines: (p.medicines ?? []).map((m) => ({
              ...m,
              translatedName: m.name,
              translatedDosage: m.dosage,
              translatedFrequency: m.frequency,
              translatedDuration: m.duration,
            })),
          }))
        );
        return;
      }
      try {
        const textsToTranslate = [];
        prescriptions.forEach((p) => {
          (p.medicines ?? []).forEach((m) => {
            textsToTranslate.push(m.name || "");
            textsToTranslate.push(m.dosage || "");
            textsToTranslate.push(m.frequency || "");
            textsToTranslate.push(m.duration || "");
          });
        });

        const translatedTexts = await translateText(textsToTranslate, language);

        let tIndex = 0;
        const newTranslatedPrescriptions = prescriptions.map((p) => ({
          ...p,
          translatedMedicines: (p.medicines ?? []).map((m) => {
            const translatedName = translatedTexts[tIndex++] || m.name;
            const translatedDosage = translatedTexts[tIndex++] || m.dosage;
            const translatedFrequency = translatedTexts[tIndex++] || m.frequency;
            const translatedDuration = translatedTexts[tIndex++] || m.duration;
            return {
              ...m,
              translatedName,
              translatedDosage,
              translatedFrequency,
              translatedDuration,
            };
          }),
        }));
        setTranslatedPrescriptions(newTranslatedPrescriptions);
      } catch (error) {
        console.error("Translation of dynamic prescribed medicines failed:", error);
        setTranslatedPrescriptions(
          prescriptions.map((p) => ({
            ...p,
            translatedMedicines: (p.medicines ?? []).map((m) => ({
              ...m,
              translatedName: m.name,
              translatedDosage: m.dosage,
              translatedFrequency: m.frequency,
              translatedDuration: m.duration,
            })),
          }))
        );
      }
    };
    translatePrescriptions();
  }, [prescriptions, language, translateText]);

  useEffect(() => {
    const translateDynamicData = async () => {
      if (history.length === 0 || language === "en") {
        setTranslatedHistory(
          history.map((item) => ({
            ...item,
            translatedIllnessName: item.illnessName,
            translatedSymptoms: item.initialSymptoms,
            translatedHospital: item.hospital,
            translatedDoctorName: item.prescribedBy?.name || "N/A",
          }))
        );
        return;
      }

      const textToTranslate = history.flatMap((item) => {
        const texts = [item.illnessName, ...(item.initialSymptoms || [])];
        if (item.hospital) texts.push(item.hospital);
        if (item.prescribedBy?.name) texts.push(item.prescribedBy.name);
        return texts;
      });

      try {
        const translatedTexts = await translateText(textToTranslate, language);

        let translatedIndex = 0;
        const newTranslatedHistory = history.map((item) => {
          const translatedIllness = translatedTexts[translatedIndex++];
          const translatedSymptoms = item.initialSymptoms.map(
            () => translatedTexts[translatedIndex++]
          );
          const translatedHospital = item.hospital
            ? translatedTexts[translatedIndex++]
            : item.hospital;
          const translatedDoctorName = item.prescribedBy?.name
            ? translatedTexts[translatedIndex++]
            : item.prescribedBy?.name;

          return {
            ...item,
            translatedIllnessName: translatedIllness,
            translatedSymptoms: translatedSymptoms,
            translatedHospital: translatedHospital,
            translatedDoctorName: translatedDoctorName,
          };
        });
        setTranslatedHistory(newTranslatedHistory);
      } catch (error) {
        console.error("Translation error for dynamic data:", error);
        setTranslatedHistory(
          history.map((item) => ({
            ...item,
            translatedIllnessName: item.illnessName,
            translatedSymptoms: item.initialSymptoms,
            translatedHospital: item.hospital,
            translatedDoctorName: item.prescribedBy?.name || "N/A",
          }))
        );
      }
    };

    translateDynamicData();
  }, [history, language, translateText]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [patientRes, presRes, readRes, histRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/patients/${id}`, { headers }),
          fetch(`${BACKEND_URL}/api/v1/prescriptions/patient/${id}`, { headers }),
          fetch(`${BACKEND_URL}/api/v1/readings/patient/${id}`, { headers }),
          fetch(`${BACKEND_URL}/api/v1/history/patient/${id}`, { headers }),
        ]);
        if (!patientRes.ok) throw new Error(t("failedToFetchPatientDetails"));
        const patientData = await patientRes.json();
        setPatient(patientData);
        setPrescriptions(presRes.ok ? await presRes.json() : []);
        setReadings(readRes.ok ? await readRes.json() : []);
        setHistory(histRes.ok ? await histRes.json() : []);
      } catch (err) {
        setError(err.message);
      }
    };
    if (id) fetchAllData();
  }, [id, t]);

  const handleSaveHistory = async (historyId, updatedDataFromModal) => {
    try {
      const token = localStorage.getItem("doctorAuthToken");
      if (!token) return alert(t("authErrorDoctor"));
      const decodedToken = jwtDecode(token);
      const doctorId = decodedToken.id;

      const completeData = { ...updatedDataFromModal, prescribedBy: doctorId };

      const res = await fetch(`${BACKEND_URL}/api/v1/history/${historyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(completeData),
      });
      if (!res.ok) throw new Error(t("failedToUpdateHistory"));
      const savedHistory = await res.json();
      setHistory(
        history.map((item) => (item._id === historyId ? savedHistory : item))
      );
      setEditingHistory(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNewHistory = async (newHistoryDataFromModal) => {
    try {
      const token = localStorage.getItem("doctorAuthToken");
      if (!token) return alert(t("authErrorDoctor"));
      const decodedToken = jwtDecode(token);
      const doctorId = decodedToken.id;

      const completeData = {
        ...newHistoryDataFromModal,
        prescribedBy: doctorId,
      };

      const res = await fetch(`${BACKEND_URL}/api/v1/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(completeData),
      });
      if (!res.ok) throw new Error(t("failedToAddNewHistory"));
      const savedEntry = await res.json();
      setHistory([savedEntry, ...history]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (!window.confirm(t("confirmDeleteHistory"))) return;
    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/api/v1/history/${historyId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(t("failedToDeleteHistory"));
      setHistory(history.filter((item) => item._id !== historyId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNewPrescription = async (prescriptionDataFromModal) => {
    try {
      const token = localStorage.getItem("doctorAuthToken");
      if (!token) return alert(t("authErrorDoctor"));
      const decodedToken = jwtDecode(token);
      const doctorId = decodedToken.id;

      const completeData = {
        ...prescriptionDataFromModal,
        patientId: id,
        doctorId: doctorId,
      };

      const res = await fetch(`${BACKEND_URL}/api/v1/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(completeData),
      });
      if (!res.ok) throw new Error(t("failedToCreatePrescription"));

      const newPrescription = await res.json();
      setPrescriptions([newPrescription, ...prescriptions]);
      setIsAddPrescriptionModalOpen(false);
      setIsAddingMedicine(newPrescription._id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm(t("areYouSureYouWantToDeletePrescription"))) {
      return;
    }

    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(
        `${BACKEND_URL}/api/v1/prescriptions/${prescriptionId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!res.ok) {
        throw new Error(t("failedToDeletePrescription"));
      }

      setPrescriptions(prescriptions.filter((p) => p._id !== prescriptionId));
    } catch (err) {
      alert(err.message);
    }
  };

  const updatePrescriptionInState = (updatedPrescription) => {
    setPrescriptions(
      prescriptions.map((p) =>
        p._id === updatedPrescription._id ? updatedPrescription : p
      )
    );
  };

  const handleDeleteMedicine = async (prescriptionId, medicineId) => {
    if (!window.confirm(t("confirmDeleteMedicine  "))) return;

    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(
        `${BACKEND_URL}/api/v1/prescriptions/${prescriptionId}/medicines/${medicineId}`,
        {
          method: "DELETE",
          headers,
        }
      );
      if (!res.ok) throw new Error(t("failedToDeleteMedicine"));

      const updatedPrescription = await res.json();
      updatePrescriptionInState(updatedPrescription);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMedicine = async (prescriptionId, medicineData) => {
    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const res = await fetch(
        `${BACKEND_URL}/api/v1/prescriptions/${prescriptionId}/medicines`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(medicineData),
        }
      );
      if (!res.ok) throw new Error(t("failedToAddMedicine"));
      const updatedPrescription = await res.json();
      updatePrescriptionInState(updatedPrescription);
      setIsAddingMedicine(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateMedicine = async (
    prescriptionId,
    medicineId,
    medicineData
  ) => {
    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      const res = await fetch(
        `${BACKEND_URL}/api/v1/prescriptions/${prescriptionId}/medicines/${medicineId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(medicineData),
        }
      );
      if (!res.ok) throw new Error(t("failedToUpdateMedicine"));
      const updatedPrescription = await res.json();
      updatePrescriptionInState(updatedPrescription);
      setEditingMedicine(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMedicineStatusChange = async (
    prescriptionId,
    medicineId,
    newStatus
  ) => {
    try {
      const token = localStorage.getItem("doctorAuthToken") || localStorage.getItem("authToken");
      // --- FIXED: Changed method to PUT and corrected the URL to match the backend route ---
      const res = await fetch(
        `${BACKEND_URL}/api/v1/prescriptions/medicines/${prescriptionId}/${medicineId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error(t("failedToUpdateStatus"));
      const updatedPrescription = await res.json();
      updatePrescriptionInState(updatedPrescription);
    } catch (err) {
      alert(err.message);
    }
  };

  if (error)
    return (
      <div className="pt-20 p-6 text-red-500 text-center dark:text-red-400">
        {error}
      </div>
    );
  if (!translatedPatient)
    return (
      <div className="pt-20 p-6 text-center dark:text-gray-300">
        {t("loadingPatientProfile")}
      </div>
    );

  return (
    <div className="pt-20 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AnimatePresence mode="wait">
        {isAddModalOpen && (
          <AddHistoryModal
            t={t}
            patientId={id}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddNewHistory}
          />
        )}
        {editingHistory && (
          <EditHistoryModal
            t={t}
            historyItem={editingHistory}
            onClose={() => setEditingHistory(null)}
            onSave={handleSaveHistory}
          />
        )}

        {isAddPrescriptionModalOpen && (
          <AddPrescriptionModal
            t={t}
            patientId={id}
            history={history}
            onClose={() => setIsAddPrescriptionModalOpen(false)}
            onSave={handleAddNewPrescription}
          />
        )}

        {isAddingMedicine && (
          <AddMedicineModal
            t={t}
            prescriptionId={isAddingMedicine}
            onClose={() => setIsAddingMedicine(null)}
            onSave={handleAddMedicine}
          />
        )}
        {editingMedicine && (
          <EditMedicineModal
            t={t}
            prescriptionId={editingMedicine.prescriptionId}
            medicine={editingMedicine.medicine}
            onClose={() => setEditingMedicine(null)}
            onSave={handleUpdateMedicine}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6"
      >
        <div className="flex items-center">
          <User size={48} className="text-indigo-500 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {translatedPatient.fullName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {translatedPatient.age} {t("yearsOld")} -{" "}
              {translatedPatient.translatedGender}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center">
                <History className="mr-2" /> {t("diseaseHistory")}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200"
              >
                <PlusCircle size={16} className="mr-1" /> {t("addNew")}
              </button>
            </div>
            <div className="space-y-2">
              {translatedHistory.length > 0 ? (
                translatedHistory.map((h) => (
                  <div
                    key={h._id}
                    className="p-2 border-b dark:border-gray-700 flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {h.translatedIllnessName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("diagnosed")}:{" "}
                        {new Date(h.diagnosisDate).toLocaleDateString()} |{" "}
                        {t("status")}:{" "}
                        <span className="font-medium">{t(h.status)}</span>
                      </p>
                      {h.translatedDoctorName ? (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {t("byDr")}. {h.translatedDoctorName}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingHistory(h)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-gray-700 rounded-full"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(h._id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full dark:hover:bg-red-900/50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {t("noHistoryFound")}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center">
                <Pill className="mr-2" /> {t("prescriptions")}
              </h3>
              <button
                onClick={() => setIsAddPrescriptionModalOpen(true)}
                className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-200"
              >
                <PlusCircle size={16} className="mr-1" /> {t("newPrescription")}
              </button>
            </div>

            {translatedPrescriptions.length > 0 ? (
              translatedPrescriptions.map((p) => (
                <div
                  key={p._id}
                  className="mb-4 p-4 border rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-center border-b pb-2 mb-3 dark:border-gray-600">
                    <div>
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {t("prescribedOn")}{" "}
                          {new Date(p.date).toLocaleDateString()}
                        </p>
                        {p.diseaseHistoryId && (
                          <span className="text-xs font-semibold text-indigo-800 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 px-3 py-1 rounded-full">
                            {p.diseaseHistoryId.illnessName}
                          </span>
                        )}
                      </div>
                      {p.doctorId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {t("byDr")}. {p.doctorId.name || "N/A"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsAddingMedicine(p._id)}
                        className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200"
                      >
                        <PlusCircle size={16} className="mr-1" />{" "}
                        {t("addMedicine")}
                      </button>
                      <button
                        onClick={() => handleDeletePrescription(p._id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full dark:hover:bg-red-900/50"
                        title={t("deletePrescription")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {(p.translatedMedicines || p.medicines || []).map((med) => (
                      <li
                        key={med._id}
                        className="flex items-center justify-between text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-md"
                      >
                        <div>
                          <p className="font-medium">
                            {med.translatedName ||
                              med.name ||
                              "Unnamed Medicine"}{" "}
                            <span className="text-gray-500 dark:text-gray-400 font-normal">
                              - {med.translatedDosage || med.dosage}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {med.translatedFrequency || med.frequency} {t("for")} {med.translatedDuration || med.duration}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={med.status}
                            onChange={(e) =>
                              handleMedicineStatusChange(
                                p._id,
                                med._id,
                                e.target.value
                              )
                            }
                            className={`text-sm rounded-full px-2 py-0.5 outline-none cursor-pointer ${
                              med.status === "current"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            <option value="current">{t("current")}</option>
                            <option value="past">{t("past")}</option>
                          </select>
                          <button
                            onClick={() =>
                              setEditingMedicine({
                                prescriptionId: p._id,
                                medicine: med,
                              })
                            }
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(p._id, med._id)} // 3. Connect the handler here
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                            title={t("deleteMedicine")} // Add a title for better UX
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                    {p.medicines.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                        {t("noMedicinesInPrescription")}.
                      </p>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {t("noPrescriptionsFound")}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
              <HeartPulse className="mr-2" /> {t("dailyVitals")}
            </h3>
            <div className="max-h-60 overflow-y-auto">
              {readings.length > 0 ? (
                readings.map((r) => (
                  <p
                    key={r._id}
                    className="border-b py-1 text-gray-700 dark:text-gray-200"
                  >
                    <span className="font-semibold">
                      {new Date(r.date).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                      :
                    </span>{" "}
                    BP {r.bloodPressure.systolic}/{r.bloodPressure.diastolic},{" "}
                    {t("pulse")} {r.pulseRate}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {t("noDailyReadings")}
                </p>
              )}
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Chatbot
            patientId={id}
            t={t}
            language={language}
            translateText={translateText}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <EmailSummary patientId={id} />
        </motion.div>
      </div>
    </div>
  );
}
