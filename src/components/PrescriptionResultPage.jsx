import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, AlertTriangle, FileText, Clock, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;


export default function PrescriptionResultPage() {
    const { id } = useParams();
    const { t, language, translateText } = useLang();
    const [data, setData] = useState(null);
    const [translatedStructuredMedicines, setTranslatedStructuredMedicines] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 🌐 NEW TRANSLATION LOGIC
    useEffect(() => {
        const translateMedicines = async () => {
            if (!data || !data.structuredMedicines || language === 'en') {
                setTranslatedStructuredMedicines(data?.structuredMedicines || null);
                return;
            }
            
            try {
                // Collect all keys and values to translate
                const allKeys = Object.keys(data.structuredMedicines);
                const allValues = Object.values(data.structuredMedicines);

                const translatedKeys = await translateText(allKeys, language);
                const translatedValues = await translateText(allValues, language);

                const newTranslatedObject = {};
                allKeys.forEach((key, index) => {
                    newTranslatedObject[translatedKeys[index]] = translatedValues[index];
                });
                
                setTranslatedStructuredMedicines(newTranslatedObject);

            } catch (err) {
                console.error("Translation of structured medicines failed:", err);
                setTranslatedStructuredMedicines(data.structuredMedicines);
            }
        };

        if (data?.status === 'completed') {
            translateMedicines();
        }
    }, [data, language, translateText]);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error(t('notLoggedIn'));
                }
                
                const res = await fetch(`${BACKEND_URL}/ocr-prescriptions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(t('couldNotFetchData'));
                const result = await res.json();
                setData(result);
                
                if (result.status === 'processing') {
                    setTimeout(fetchResult, 5000);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchResult();
    }, [id, t]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-800 p-8 rounded-lg shadow-xl">
                    <Loader className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                    <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">{t('processingPrescription')}</h2>
                    <p className="text-blue-700 dark:text-blue-300">{t('pleaseWait')}</p>
                </div>
            );
        }
        
        if (error) {
            return <div className="text-center text-red-500 dark:text-red-400 p-8">{error}</div>;
        }

        if (data.status === 'error') {
            return (
                <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-gray-800 p-8 rounded-lg shadow-xl">
                    <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
                    <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">{t('processingFailed')}</h2>
                    <p className="text-red-700 dark:text-red-300">{data.errorMessage}</p>
                </div>
            );
        }

        if (data.status === 'completed') {
            return (
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-xl"
                    >
                        <div className="flex items-center text-green-600 dark:text-green-400 mb-4">
                            <CheckCircle className="mr-2" />
                            <h2 className="text-2xl font-bold">{t('extractionComplete')}</h2>
                        </div>
                        
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">{t('extractedMedicines')}</h3>
                            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {translatedStructuredMedicines ? JSON.stringify(translatedStructuredMedicines, null, 2) : t('noMedicinesFound')}
                            </pre>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">{t('originalOcrText')}</h3>
                            <p className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {data.ocrText || t('noOcrText')}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            );
        }
        return null;
    };

    return (
        <div className="container mx-auto p-8 max-w-3xl pt-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">{t('prescriptionResult')}</h1>
            {renderContent()}
            <div className="text-center mt-8">
                <Link to="/patient/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    &larr; {t('backToDashboard')}
                </Link>
            </div>
        </div>
    );
}