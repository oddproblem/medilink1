import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import '../../App.css';

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;

export default function DiseaseHistory() {
  const { t, language, translateText } = useLang();
  const [history, setHistory] = useState([]);
  const [translatedHistory, setTranslatedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => await loadSlim(engine)).then(() => setInit(true));

    const fetchHistory = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        console.warn("No authentication token found. Cannot fetch disease history.");
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const patientId = decodedToken.id;

        const response = await fetch(`${BACKEND_URL}/history/patient/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 404) {
          setHistory([]);
        } else if (!response.ok) {
          throw new Error('Failed to fetch history');
        } else {
          const data = await response.json();
          setHistory(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error("Error fetching full history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // 🌐 NEW TRANSLATION LOGIC: Translate dynamic data when history or language changes
  useEffect(() => {
    const translateDynamicData = async () => {
      if (history.length === 0 || language === 'en') {
        setTranslatedHistory(history.map(item => ({
          ...item,
          translatedIllnessName: item.illnessName,
          translatedSymptoms: item.initialSymptoms,
          translatedHospital: item.hospital,
          translatedDoctorName: item.prescribedBy?.name || 'N/A'
        })));
        return;
      }

      // Collect all dynamic text strings into a single array for a batch translation call
      const textToTranslate = history.flatMap(item => {
        const texts = [
          item.illnessName,
          ...item.initialSymptoms
        ];
        if (item.hospital) texts.push(item.hospital);
        if (item.prescribedBy?.name) texts.push(item.prescribedBy.name); // ✅ Add doctor name
        return texts;
      });

      try {
        const translatedTexts = await translateText(textToTranslate, language);

        let translatedIndex = 0;
        const newTranslatedHistory = history.map(item => {
          const translatedIllness = translatedTexts[translatedIndex++];
          const translatedSymptoms = item.initialSymptoms.map(() => translatedTexts[translatedIndex++]);
          const translatedHospital = item.hospital ? translatedTexts[translatedIndex++] : item.hospital;
          const translatedDoctorName = item.prescribedBy?.name ? translatedTexts[translatedIndex++] : item.prescribedBy?.name; // ✅ Get translated doctor name

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
        setTranslatedHistory(history.map(item => ({
          ...item,
          translatedIllnessName: item.illnessName,
          translatedSymptoms: item.initialSymptoms,
          translatedHospital: item.hospital,
          translatedDoctorName: item.prescribedBy?.name || 'N/A'
        })));
      }
    };

    translateDynamicData();
  }, [history, language, translateText]);

  const particlesOptions = {
    background: { color: "transparent" },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: "repulse" }, onClick: { enable: true, mode: "push" } },
      modes: { repulse: { distance: 100 }, push: { quantity: 4 } },
    },
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      size: { value: 2 }, move: { enable: true, speed: 1 }, links: { enable: true, color: "#60a5fa", opacity: 0.4, distance: 150 },
      opacity: { value: 0.5 }, color: { value: "#60a5fa" },
    },
    detectRetina: true,
  };

  return (
    <div className="relative min-h-screen">
      {init && (
        <Particles id="tsparticles" options={particlesOptions} className="absolute inset-0 -z-10" />
      )}
      <div className="pt-24 p-6">
        <motion.h2
          className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          {t('patientDiseaseHistory')}
        </motion.h2>

        <div className="overflow-x-auto">
          <motion.table
            className="min-w-full bg-white/20 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          >
            <thead className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('diagnosisDate')}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('illness')}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('symptoms')}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('doctor')}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('hospital')}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-600 dark:text-gray-300">
                    {t('loadingHistory')}
                  </td>
                </tr>
              ) : translatedHistory.length > 0 ? (
                translatedHistory.map((row, i) => (
                  <motion.tr
                    key={row._id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="border-b dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700/40 transition"
                  >
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200">
                      {row.diagnosisDate ? new Date(row.diagnosisDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">
                      {row.translatedIllnessName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                      {row.translatedSymptoms ? row.translatedSymptoms.join(', ') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {row.translatedDoctorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {row.translatedHospital || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${
                        // FIX: Compare the original status string, not the translated one
                        row.status === 'ongoing'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                        }`}>
                        {/* The text itself should still be translated */}
                        {t(row.status)}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-600 dark:text-gray-300">
                    {t('noHistoryFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </motion.table>
        </div>
      </div>
    </div>
  );
}