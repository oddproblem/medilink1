import React from 'react';
import { motion } from 'framer-motion';
import { Pill, History, RefreshCw } from 'lucide-react';

export default function MedicationList({ t, currentMeds, pastMeds, handleStatusUpdate }) {
    return (
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <motion.div
                className=" bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}
            >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Pill className="mr-2 text-blue-500" /> {t('currentMedicines')}
                </h3>
                <ul className="space-y-3 mb-4">
                    {currentMeds.length > 0 ? (
                        currentMeds.map((med) => (
                            <motion.li
                                key={med._id}
                                className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50 p-3 rounded-lg hover:scale-[1.02] transition"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{med.translatedName || med.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {med.translatedDosage || med.dosage} — {med.translatedFrequency || med.frequency}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleStatusUpdate(med.prescriptionId, med._id, 'past')}
                                    title={t('markAsPast')}
                                    className="medication-current p-2 rounded-full text-yellow-600 hover:bg-yellow-200 dark:hover:bg-gray-600 transition"
                                >
                                    <History size={18} />
                                </button>
                            </motion.li>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">{t('noCurrentMedicines')}</p>
                    )}
                </ul>
            </motion.div>

            <motion.div
                className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.5)" }}
            >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <History className="mr-2 text-gray-500" /> {t('pastMedicines')}
                </h3>
                <ul className="space-y-3 mb-4">
                    {pastMeds.length > 0 ? (
                        pastMeds.map((med) => (
                            <motion.li
                                key={med._id}
                                className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50 p-3 rounded-lg opacity-70 hover:scale-[1.02] transition"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{med.translatedName || med.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {med.translatedDosage || med.dosage} — {med.translatedFrequency || med.frequency}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleStatusUpdate(med.prescriptionId, med._id, 'current')}
                                    title={t('markAsCurrent')}
                                    className="past-medication p-2 rounded-full text-green-600 hover:bg-green-200 dark:hover:bg-gray-600 transition"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </motion.li>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">{t('noPastMedicines')}</p>
                    )}
                </ul>
            </motion.div>
        </div>
    );
}