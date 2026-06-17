import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { Calendar, Stethoscope } from 'lucide-react';
import { useLang } from '../../context/LangContext'; // 🌐 Import your translation hook

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;


export default function PrescriptionPage() {
  const { t } = useLang();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch prescriptions, can be called to refresh data
  const fetchPrescriptions = async () => {
    const token = localStorage.getItem('authToken');
    const doctoken = localStorage.getItem('doctorAuthToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const docdecodedToken = jwtDecode(doctoken);
      const patientId = decodedToken.id;
      const response = await fetch(`${BACKEND_URL}/prescriptions/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      const data = await response.json();
      setPrescriptions(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Function to handle the API call for updating a medicine's status
  const handleStatusUpdate = async (prescriptionId, medicineId, newStatus) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${BACKEND_URL}/prescriptions/${prescriptionId}/medicines/${medicineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update the state locally for an instant UI change without a full refetch
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.map(p => 
          p._id === prescriptionId
            ? { ...p, medicines: p.medicines.map(m => m._id === medicineId ? { ...m, status: newStatus } : m) }
            : p
        )
      );
    } catch (error) {
      console.error('Failed to update medicine status:', error);
    }
  };

  return (
    <div className="pt-20 p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.h2
        className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        {t('myPrescriptions')}
      </motion.h2>

      <div className="space-y-6 max-w-4xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500">{t('loadingPrescriptions')}</p>
        ) : prescriptions.length > 0 ? (
          prescriptions.map((p, i) => (
            <motion.div
              key={p._id}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            >
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(p.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="text-gray-600 dark:text-gray-400" size={20} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('dr')} {p.doctorId}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-gray-200 dark:divide-gray-700 p-4">
                {p.medicines.map(med => (
                  <li key={med._id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {med.dosage} - {med.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${med.status === 'current' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {t(med.status)}
                      </span>
                      <button
                        onClick={() => handleStatusUpdate(p._id, med._id, med.status === 'current' ? 'past' : 'current')}
                        className={`px-3 py-1 text-xs rounded-full transition ${
                          med.status === 'current' 
                          ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800' 
                          : 'bg-green-200 hover:bg-green-300 text-green-800'
                        }`}
                      >
                        {t('markAs')} {t(med.status === 'current' ? 'past' : 'current')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-gray-500">{t('noPrescriptionsFound')}</p>
        )}
      </div>
    </div>
  );
}