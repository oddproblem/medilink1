import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../context/LangContext';

// --- UI Components ---
const CameraView = ({ onCapture, onClose, t }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        const openCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert(t("cameraAccessError"));
                onClose();
            }
        };

        openCamera();
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onClose, t]);

    const handleCapture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg'));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 dark:bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
            <motion.video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-lg h-auto rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            />
            <div className="flex gap-4 mt-6">
                <motion.button
                    onClick={handleCapture}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all transform"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {t('capturePhoto')}
                </motion.button>
                <motion.button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {t('closeCamera')}
                </motion.button>
            </div>
        </div>
    );
};

const PredictionResult = ({ result, imageSrc, t, language, translateText }) => {
    const [translatedResult, setTranslatedResult] = useState(null);

    useEffect(() => {
        const translateResult = async () => {
            if (!result || language === 'en') {
                setTranslatedResult(result);
                return;
            }

            try {
                const textsToTranslate = [
                    result.prediction,
                    result.description,
                    ...result.precautions
                ];
                const translatedTexts = await translateText(textsToTranslate, language);
                
                setTranslatedResult({
                    ...result,
                    prediction: translatedTexts[0],
                    description: translatedTexts[1],
                    precautions: translatedTexts.slice(2)
                });
            } catch (err) {
                console.error("Translation of prediction result failed:", err);
                setTranslatedResult(result); // Fallback to original
            }
        };

        translateResult();
    }, [result, language, translateText]);

    if (!translatedResult) return null;

    return (
        <motion.div 
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('imageAnalyzed')}</h3>
                    <img src={imageSrc} alt={t('uploadedPreview')} className="rounded-lg object-cover w-full h-auto aspect-square shadow-lg" />
                </div>
                <div className="md:col-span-2">
                    <div className="flex justify-between items-baseline mb-3">
                        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{translatedResult.prediction}</p>
                        <span className="text-lg font-semibold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                            {translatedResult.confidence}% {t('confidence')}
                        </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{translatedResult.description}</p>
                    
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('recommendedPrecautions')}:</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        {translatedResult.precautions.map((precaution, index) => (
                            <li key={index}>{precaution}</li>
                        ))}
                    </ul>
                    
                    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            <strong>{t('disclaimer')}:</strong> {t('disclaimerText')}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main App Component ---
export default function DiseasePrediction() {
    const { t, language, translateText } = useLang();
    const [predictionResult, setPredictionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
                setPredictionResult(null);
                setError(null);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCameraCapture = (imageData) => {
        setImageSrc(imageData);
        setPredictionResult(null);
        setError(null);
    };

    const handlePredict = async () => {
        if (!imageSrc) return;
        setIsLoading(true);
        setPredictionResult(null);
        setError(null);

        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append("file", blob, "skin_image.jpg");
            
            const apiResponse = await fetch("https://hmm183-skin-disease-detection.hf.space/predict", {
                method: "POST",
                body: formData,
            });

            if (!apiResponse.ok) {
                throw new Error(t('predictionServerError', { status: apiResponse.status, statusText: apiResponse.statusText }));
            }

            const data = await apiResponse.json();
            
            // FIX: Check confidence level here
            if (data.confidence < 65) {
                setError(t('lowConfidenceError'));
                setPredictionResult(null);
            } else {
                setPredictionResult(data);
            }
            
        } catch (err) {
            console.error("Prediction error:", err);
            setError(t('predictionErrorMsg'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClear = () => {
        setImageSrc(null);
        setPredictionResult(null);
        setError(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4 font-sans text-gray-900 dark:text-white transition-colors duration-300">
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
            {isCameraOpen && <CameraView onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} t={t} />}
            
            <div className="w-full max-w-4xl mx-auto pt-16">
                <motion.div
                    className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="p-8">
                        <header className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">{t('aiPredictorTitle')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('aiPredictorDesc')}</p>
                        </header>
                        
                        <main>
                            <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-4">{t('provideImage')}</h2>
                                {imageSrc ? (
                                    <div className="mb-4 relative group">
                                        <img src={imageSrc} alt={t('uploadedPreview')} className="max-w-xs mx-auto rounded-lg shadow-lg"/>
                                        <button onClick={handleClear} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-48 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center mb-4">
                                        <p className="text-gray-500 dark:text-gray-400">{t('noImageSelected')}</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <motion.button onClick={() => fileInputRef.current.click()} className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {t('uploadImage')}
                                    </motion.button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>
                                    <motion.button onClick={() => setIsCameraOpen(true)} className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                        {t('useCamera')}
                                    </motion.button>
                                </div>
                            </div>
                            
                            <div className="flex justify-center mt-8">
                                <motion.button
                                    onClick={handlePredict}
                                    disabled={isLoading || !imageSrc}
                                    className="w-full sm:w-1/2 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('analyzingImage')}
                                        </>
                                    ) : t('predictCondition')}
                                </motion.button>
                            </div>
                            
                            {error && (
                                <div className="mt-6 p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 border border-red-500 dark:border-red-600 rounded-lg text-center">
                                    <p>{error}</p>
                                    <p className="text-sm mt-2">{t('serverConnectionMessage')}</p>
                                </div>
                            )}
                            
                            {predictionResult && <PredictionResult result={predictionResult} imageSrc={imageSrc} t={t} language={language} translateText={translateText} />}
                        </main>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}