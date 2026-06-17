import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn, UserPlus, Mail, KeyRound, User, Fingerprint, ShieldCheck, CheckCircle2
} from 'lucide-react';
// 🌐 Import the useLang hook
import { useLang } from '../../context/LangContext';

import { useAuth } from '../../context/AuthContext';


const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}/doctors`;


export default function DoctorAuth() {
    const navigate = useNavigate();
    // 🌐 Use the useLang hook to access the translation function
    const { t } = useLang();
    const auth = useAuth();

    const [view, setView] = useState("login");
    const [status, setStatus] = useState({ message: "", isError: false });
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        doctorId: '',
        licenseNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const [verifiedDoctor, setVerifiedDoctor] = useState(null);

    const showStatus = (message, isError = false) => setStatus({ message, isError });
    const clearStatus = () => setStatus({ message: "", isError: false });


    useEffect(() => {
        // Pre-fill the form with default credentials for demonstration
        setFormData(prevData => ({
            ...prevData,
            email: 'doc@gmail.com',
            password: 'pass',
        }));
    }, []); 



    useEffect(() => {
        clearStatus();
    }, [view]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearStatus();
        showStatus(t('verifyingNMC'));
        try {
            const res = await fetch(`${BACKEND_URL}/verify-doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: formData.doctorId,
                    licenseNumber: formData.licenseNumber,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setVerifiedDoctor(data.doctor);
            showStatus(t('verificationSuccess'));
            setLoading(false);
            setTimeout(() => {
                setView("registration");
                clearStatus();
            }, 1000);
        } catch (err) {
            showStatus(err.message || t('verificationFailed'), true);
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearStatus();
        showStatus(t('creatingAccount'));
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    verifiedDoctor: verifiedDoctor,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showStatus(data.message);
            setLoading(false);
            setTimeout(() => {
                setView("login");
                clearStatus();
            }, 3000);
        } catch (err) {
            showStatus(err.message || t('registrationFailed'), true);
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearStatus();
        showStatus(t('loggingIn'));
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            auth.login('doctor', data.token)
            //localStorage.setItem('doctorAuthToken', data.token);
            showStatus(t('loginSuccess'));
            setLoading(false);
            setTimeout(() => navigate('/doctor/dashboard'), 1000);
        } catch (err) {
            showStatus(err.message || t('loginFailed'), true);
            setLoading(false);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
    };

    const renderView = () => (
        <AnimatePresence mode="wait">
            {view === "login" && (
                <motion.div key="login" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 doc-auth-card">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('doctorPortal')}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{t('welcomeBack')}</p>
                    </div>
                    <form className="doctor-login-form space-y-4" onSubmit={handleLogin}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <input id="email" name="email" type="email" placeholder={t('emailAddress')} value={formData.email} onChange={handleChange} required className="w-full pl-4 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <input id="pass" name="password" type="password" placeholder={t('password')} value={formData.password} onChange={handleChange} required className="w-full pl-4 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.button
                            id="submit-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-semibold"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                            {loading ? t('processing') : <><LogIn size={20} /> {t('signIn')}</>}
                        </motion.button>
                    </form>
                    <p className="new-reg text-center text-sm text-gray-600 dark:text-gray-300">
                        {t('Don\'t have an account?')}
                        <button onClick={() => setView("verify")} className="font-medium text-indigo-600 hover:underline ml-1">
                            {t('noAccount')}
                        </button>
                    </p>
                </motion.div>
            )}

            {view === "verify" && (
                <motion.div key="verify" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('doctorRegistration')}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{t('verifyIdentity')}</p>
                    </div>
                    <form className="doctor-registration space-y-4" onSubmit={handleVerify}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input id="nmc-id" name="doctorId" type="text" placeholder={t('nmcDoctorId')} value={formData.doctorId} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input id="license" name="licenseNumber" type="text" placeholder={t('registrationNumber')} value={formData.licenseNumber} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.button
                            id="verify-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-semibold"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                            {loading ? t('processing') : t('verifyIdentityButton')}
                        </motion.button>
                    </form>
                    <p className="sign-up-btn text-center text-sm text-gray-600 dark:text-gray-300">
                        {t('alreadyAccount')}
                        <button onClick={() => setView("login")} className="font-medium text-indigo-600 hover:underline ml-1">
                            {t('signIn')}
                        </button>
                    </p>
                </motion.div>
            )}

            {view === "registration" && (
                <motion.div key="registration" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                    {verifiedDoctor && (
                        <motion.div
                            className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl dark:bg-green-900 dark:border-green-700 dark:text-green-100"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <CheckCircle2 size={20} /><h3 className="font-semibold">{t('verifiedDetails')}</h3>
                            </div>
                            <p className="text-sm mt-1"><b>{t('name')}</b> {verifiedDoctor.name}</p>
                            <p className="text-sm"><b>{t('council')}</b> {verifiedDoctor.council}</p>
                        </motion.div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('completeRegistration')}</h2>
                    <form className="space-y-4" onSubmit={handleRegister}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input name="username" type="text" placeholder={t('chooseUsername')} value={formData.username} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input name="email" type="email" placeholder={t('emailForLogin')} value={formData.email} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input name="password" type="password" placeholder={t('createPassword')} value={formData.password} onChange={handleChange} required className="w-full pl-10 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                        </motion.div>
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-semibold"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                            {loading ? t('processing') : <><UserPlus size={20} /> {t('createAccount')}</>}
                        </motion.button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                {renderView()}
                <AnimatePresence>
                    {status.message && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`p-3 rounded-lg text-center ${status.isError
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                            }`}>
                            {status.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}