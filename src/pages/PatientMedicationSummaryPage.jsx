import React from 'react';
import { Link } from 'react-router-dom';
import { Loader, BookCopy, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;

export default function PatientMedicationSummaryPage() {
    const [summary, setSummary] = useState({ count: 0, prescriptions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t, language, translateText } = useLang();
    const [translatedPrescriptions, setTranslatedPrescriptions] = useState([]);

    useEffect(() => {
        const translatePrescriptions = async () => {
            if (summary.prescriptions.length === 0 || language === "en") {
                setTranslatedPrescriptions(
                    summary.prescriptions.map((p) => ({
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
                summary.prescriptions.forEach((p) => {
                    (p.medicines ?? []).forEach((m) => {
                        textsToTranslate.push(m.name || "");
                        textsToTranslate.push(m.dosage || "");
                        textsToTranslate.push(m.frequency || "");
                        textsToTranslate.push(m.duration || "");
                    });
                });

                const translatedTexts = await translateText(textsToTranslate, language);

                let tIndex = 0;
                const newTranslatedPrescriptions = summary.prescriptions.map((p) => ({
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
                console.error("Translation of medication summary prescriptions failed:", error);
                setTranslatedPrescriptions(
                    summary.prescriptions.map((p) => ({
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
    }, [summary.prescriptions, language, translateText]);

    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error(t('notLoggedIn'));

                const decodedToken = jwtDecode(token);
                const patientId = decodedToken.id;

                const [countRes, medicinesRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/ocr-prescriptions/patient/${patientId}/count`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${BACKEND_URL}/ocr-prescriptions/patient/${patientId}/medicines`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (!countRes.ok || !medicinesRes.ok) {
                    throw new Error(t('couldNotFetchData'));
                }

                const countData = await countRes.json();
                const prescriptionsData = await medicinesRes.json();

                setSummary({ count: countData.count, prescriptions: prescriptionsData });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSummaryData();
    }, [t]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="animate-spin h-12 w-12 text-indigo-600" />
            </div>
        );
    }
    
    // ... error handling UI can remain the same ...

    // Helper to format date nicely
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl pt-24 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded flex items-center gap-3 mb-6" role="alert">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}
            <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">{t('medicationSummary')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{t('medicationSummaryDesc')}</p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
    <div className="flex items-center">
        <BookCopy className="w-10 h-10 text-indigo-500 mr-4" />
        <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('totalPrescriptions')}</h2>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.count}</p>
        </div>
        </div>
            {/* 👇 NEW BUTTON ADDED HERE */}
            <a 
                href="/prescription/process"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
                {t('processNewPrescription') || 'Process New Rx'}
            </a>
        </div>
            
            <div className="space-y-8">
                {translatedPrescriptions.length > 0 ? (
                    translatedPrescriptions.map((prescription) => (
                        <div key={prescription.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center">
                                <Calendar className="mr-3 h-5 w-5" />
                                {formatDate(prescription.date)}
                            </h3>
                            <div className="relative overflow-x-auto rounded-lg">
                                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                    <thead className="text-xs text-gray-800 dark:text-gray-200 uppercase bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('medicine')}</th>
                                            <th scope="col" className="px-6 py-3">{t('dosage')}</th>
                                            <th scope="col" className="px-6 py-3">{t('frequency')}</th>
                                            <th scope="col" className="px-6 py-3">{t('duration')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(prescription.translatedMedicines || prescription.medicines || []).map((med, index) => (
                                            <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-b-0">
                                                <th scope="row" className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">{med.translatedName || med.name}</th>
                                                <td className="px-6 py-4">{med.translatedDosage || med.dosage}</td>
                                                <td className="px-6 py-4">{med.translatedFrequency || med.frequency}</td>
                                                <td className="px-6 py-4">{med.translatedDuration || med.duration}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">{t('noMedicinesFound')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('noMedicinesFoundDesc')}</p>
                    </div>
                )}
            </div>

            <div className="text-center mt-8">
                <Link to="/patient/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    &larr; {t('backToDashboard')}
                </Link>
            </div>
        </div>
    );
}