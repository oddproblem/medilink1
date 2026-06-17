import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Weight, Droplets, Calendar, PlusCircle, Save, XCircle, Edit, Trash2 } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;

export default function DailyReadingsPage() {
  const { t, language } = useLang();
  const [patientId, setPatientId] = useState(null);
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for the new reading form
  const [newReading, setNewReading] = useState({
    systolic: '',
    diastolic: '',
    pulseRate: '',
    weightKg: '',
    date: new Date().toISOString().slice(0, 16),
  });

  // State for editing a reading
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  const fetchReadings = async (pId) => {
    const token = localStorage.getItem('authToken');
    if (!pId || !token) {
      setError(t('authenticationError'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/readings/patient/${pId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t('failedToFetchReadings'));
      const data = await res.json();
      setReadings(data.sort((a, b) => new Date(b.date) - new Date(a.date))); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const pId = decoded.id;
        setPatientId(pId);
        fetchReadings(pId);
      } catch (err) {
        setError(t('invalidToken'));
        setIsLoading(false);
      }
    }
  }, [language]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReading(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({...prev, [name]: value}));
  }

  const handleAddReading = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!newReading.systolic || !newReading.diastolic || !newReading.pulseRate) {
        alert(t('bpPulseRequired'));
        return;
    }

    const payload = {
      patientId,
      bloodPressure: {
          systolic: Number(newReading.systolic),
          diastolic: Number(newReading.diastolic),
      },
      pulseRate: Number(newReading.pulseRate),
      weightKg: newReading.weightKg ? Number(newReading.weightKg) : undefined,
      date: newReading.date,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/readings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('failedToAddReading'));
      
      setNewReading({ systolic: '', diastolic: '', pulseRate: '', weightKg: '', date: new Date().toISOString().slice(0, 16) });
      fetchReadings(patientId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateReading = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const { _id, ...updateData } = editingData;
    
    const payload = {
        systolic: updateData.systolic,
        diastolic: updateData.diastolic,
        pulseRate: updateData.pulseRate,
        weightKg: updateData.weightKg,
        date: updateData.date,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/readings/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('failedToUpdateReading'));
      
      setEditingId(null);
      setEditingData(null);
      fetchReadings(patientId);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (reading) => {
    setEditingId(reading._id);
    setEditingData({
        _id: reading._id,
        systolic: reading.bloodPressure.systolic,
        diastolic: reading.bloodPressure.diastolic,
        pulseRate: reading.pulseRate,
        weightKg: reading.weightKg || '',
        date: new Date(reading.date).toISOString().slice(0, 16),
    });
  }

  /**
   * ⭐️ MODIFIED FUNCTION ⭐️
   * Handles the deletion of a daily reading entry.
   */
  const handleDeleteReading = async (readingId) => {
    // 1. Confirm with the user before proceeding
    if (!window.confirm(t('confirmDelete'))) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        setError(t('authenticationError'));
        return;
    }

    try {
      // 2. Send the DELETE request to the backend API
      const res = await fetch(`${BACKEND_URL}/readings/${readingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || t('failedToDeleteReading'));
      }

      // 3. On success, update the UI instantly by removing the item from the state
      setReadings(prevReadings => prevReadings.filter(reading => reading._id !== readingId));

    } catch (err) {
      // 4. If anything goes wrong, display the error
      setError(err.message);
    }
  };

  const formatDate = (isoString) => new Date(isoString).toLocaleString();

  return (
    <div className="pt-24 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">{t('dailyHealthReadings')}</h1>
        
        {/* Add New Reading Form */}
        <motion.div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8" layout>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('addNewReading')}</h2>
          <form onSubmit={handleAddReading} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="number" name="systolic" value={newReading.systolic} onChange={handleInputChange} placeholder={t('systolic')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
            <input type="number" name="diastolic" value={newReading.diastolic} onChange={handleInputChange} placeholder={t('diastolic')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
            <input type="number" name="pulseRate" value={newReading.pulseRate} onChange={handleInputChange} placeholder={t('pulseRate')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
            <input type="number" step="0.1" name="weightKg" value={newReading.weightKg} onChange={handleInputChange} placeholder={t('weightKg')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            <input type="datetime-local" name="date" value={newReading.date} onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 md:col-span-2 dark:text-gray-100" required />
            <button type="submit" className="flex items-center justify-center p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition md:col-span-3">
              <PlusCircle size={20} className="mr-2" /> {t('addReading')}
            </button>
          </form>
        </motion.div>

        {/* Readings List */}
        <AnimatePresence>
          <div className="space-y-4">
            {isLoading && <p className="text-center text-gray-600 dark:text-gray-300">{t('loadingReadings')}</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!isLoading && readings.length === 0 && <p className="text-center text-gray-600 dark:text-gray-300">{t('noReadingsFound')}</p>}
            {!isLoading && readings.length > 0 && readings.map(reading => (
              editingId === reading._id ? (
                  // EDITING VIEW
                  <motion.form key={reading._id} layout onSubmit={handleUpdateReading} className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-xl shadow-md border border-blue-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                          <input type="number" name="systolic" value={editingData.systolic} onChange={handleEditChange} placeholder={t('systolic')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                          <input type="number" name="diastolic" value={editingData.diastolic} onChange={handleEditChange} placeholder={t('diastolic')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                          <input type="number" name="pulseRate" value={editingData.pulseRate} onChange={handleEditChange} placeholder={t('pulseRate')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                          <input type="number" step="0.1" name="weightKg" value={editingData.weightKg} onChange={handleEditChange} placeholder={t('weightKg')} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                          <input type="datetime-local" name="date" value={editingData.date} onChange={handleEditChange} className="col-span-2 md:col-span-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                          <button type="button" onClick={() => setEditingId(null)} className="p-2 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><XCircle size={20}/></button>
                          <button type="submit" className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"><Save size={20}/></button>
                      </div>
                  </motion.form>
              ) : (
                  // NORMAL VIEW
                  <motion.div key={reading._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md group">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                  <Droplets className="text-red-500" size={20} /> {t("bp", "BP")}: {reading.bloodPressure.systolic} / {reading.bloodPressure.diastolic}{t("mmhg", " mmHg")}
                              </p>
                              <div className="flex gap-4 mt-2 text-gray-600 dark:text-gray-300">
                                  <span className="flex items-center gap-1"><HeartPulse size={16} /> {reading.pulseRate} {t('bpm')}</span>
                                  {reading.weightKg && <span className="flex items-center gap-1"><Weight size={16} /> {reading.weightKg} {t('kg')}</span>}
                              </div>
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditing(reading)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><Edit size={18} /></button>
                              <button onClick={() => handleDeleteReading(reading._id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={18} /></button>
                          </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1"><Calendar size={14} /> {formatDate(reading.date)}</p>
                  </motion.div>
              )
            ))}
          </div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}