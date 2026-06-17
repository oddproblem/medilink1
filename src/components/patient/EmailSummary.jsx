import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const BACKEND_URL =  `${process.env.REACT_APP_BACKEND_WITHOUT_V1}`;

export default function EmailSummary({ patientId }) { // ✅ Correctly receives patientId from props
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // type can be 'success' or 'error'
  const { t } = useLang();

  const handleSendEmail = async () => {
    setIsLoading(true);
    setFeedback({ message: '', type: '' });

    // ✅ Verifies the DOCTOR'S login status using the doctor's token
    const token = localStorage.getItem('doctorAuthToken'); // Corrected from 'authToken' for consistency
    if (!token) {
      setFeedback({ message: t('authErrorDoctor', 'Authentication error. Please log in as a doctor.'), type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/summary/generate-and-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Sends DOCTOR'S token for authentication
        },
        // ✅ Sends the PATIENT'S ID (from the URL via props) in the body
        body: JSON.stringify({ patientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('unknownError', 'An unknown error occurred.'));
      }

      setFeedback({ message: data.message, type: 'success' });

    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mt-6 dark:bg-gray-800 border dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
        <Mail className="mr-2 text-indigo-500" />
        {t('emailReportTitle')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        {t('emailReportDesc')}
      </p>

      <button
        onClick={handleSendEmail}
        disabled={isLoading}
        className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={20} />
            {t('processing')}
          </>
        ) : (
          t('reportDeliveryBtn')
        )}
      </button>

      {/* Feedback Message Area */}
      {feedback.message && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-center ${
          feedback.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
          {feedback.message}
        </div>
      )}
    </div>
  );
}