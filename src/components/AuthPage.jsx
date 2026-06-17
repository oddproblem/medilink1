// src/components/auth/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../context/LangContext"; // ✅ import LangContext
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}/auth`;

const AuthPage = () => {
  const navigate = useNavigate();
  const { translations } = useLang(); // ✅ translations hook
  const auth = useAuth();

  const [view, setView] = useState("login");
  const [status, setStatus] = useState({ message: "", isError: false });
  const [kycUserData, setKycUserData] = useState(null);

  const [loginForm, setLoginForm] = useState({ uid: "3395", name: "Priyanshu Upadhyay", password: "pass" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "", email: "" });

  const showStatus = (message, isError = false) => setStatus({ message, isError });
  const clearStatus = () => setStatus({ message: "", isError: false });

  const handleApiResponse = async (response) => {
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || translations.apiError || "An unknown API error occurred");
    }
    return data;
  };

  useEffect(() => {
    const initializeFlow = async () => {
      clearStatus();

      // Check URL parameters for Google OAuth callback info
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const patientId = params.get("patientId");
      const error = params.get("error");

      if (error) {
        showStatus(
          error === "AuthenticationFailed"
            ? "Google authentication failed. Please try again."
            : error === "Unauthorized"
            ? "You are not authorized."
            : `Authentication error: ${error}`,
          true
        );
        // Clean URL params so they don't linger on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (token && patientId) {
        showStatus("Google login successful! Redirecting...");
        auth.login('patient', token, patientId);
        // Clean URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          navigate("/patient/dashboard");
        }, 1000);
        return;
      }

      const sessionId = sessionStorage.getItem("digilockerSessionId");
      const accessToken = sessionStorage.getItem("digilockerAccessToken");

      if (sessionId && accessToken) {
        await fetchAadhaarData(sessionId, accessToken);
        return;
      }

      const kycDataStr = localStorage.getItem("kycUserData");
      if (kycDataStr) {
        const data = JSON.parse(kycDataStr);
        setKycUserData(data);
        setView("registration");
        return;
      }

      setView("login");
    };

    initializeFlow();
  }, []);

  const handleInitiateKyc = async () => {
    showStatus(translations.initiatingSession || "🚀 Initiating session...");
    try {
      const response = await fetch(`${BACKEND_URL}/initiate-digilocker`, { method: "POST" });
      const data = await handleApiResponse(response);
      sessionStorage.setItem("digilockerSessionId", data.sessionId);
      sessionStorage.setItem("digilockerAccessToken", data.accessToken);
      window.location.href = data.authorizationUrl;
    } catch (error) {
      showStatus(error.message, true);
    }
  };

  const fetchAadhaarData = async (sessionId, accessToken) => {
    setView("initiate");
    showStatus(translations.fetchingDetails || "📄 Welcome back! Fetching your details...");
    try {
      const response = await fetch(`${BACKEND_URL}/get-digilocker-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, accessToken }),
      });
      const data = await handleApiResponse(response);

      localStorage.setItem("kycUserData", JSON.stringify(data.userData));
      setKycUserData(data.userData);
      setView("registration");
      clearStatus();
    } catch (error) {
      showStatus(error.message, true);
      setView("initiate");
    } finally {
      sessionStorage.removeItem("digilockerSessionId");
      sessionStorage.removeItem("digilockerAccessToken");
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    const { password, confirmPassword, email } = passwordForm;

    if (password !== confirmPassword) {
      showStatus(translations.passwordMismatch || "Passwords do not match.", true);
      return;
    }
    if (!email) {
      showStatus(translations.enterEmail || "Please enter your email address.", true);
      return;
    }
    if (!kycUserData) {
      showStatus(translations.userDataMissing || "User data not found. Please start KYC again.", true);
      setView("initiate");
      return;
    }

    showStatus(translations.creatingAccount || "Creating your account...");
    try {
      const response = await fetch(`${BACKEND_URL}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userData: kycUserData, password, email }),
      });
      const data = await handleApiResponse(response);

      localStorage.removeItem("kycUserData");
      setKycUserData(null);
      showStatus(data.message);

      setTimeout(() => {
        setView("login");
        clearStatus();
      }, 2500);
    } catch (error) {
      showStatus(error.message, true);
      if (error.message.includes("already registered")) {
        localStorage.removeItem("kycUserData");
        setKycUserData(null);
        setTimeout(() => {
          setView("login");
          clearStatus();
        }, 3000);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    showStatus(translations.loggingIn || "Logging in...");
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await handleApiResponse(response);

      //localStorage.setItem("authToken", data.token);
      //localStorage.setItem("patientId", data.user?.id);
      auth.login('patient', data.token, data.user?.id);
      clearStatus();
      navigate("/patient/dashboard");
    } catch (error) {
      showStatus(error.message, true);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/google`;
  };

  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.id]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.id]: e.target.value });

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
  };

  const renderView = () => (
    <AnimatePresence mode="wait">
      {view === "initiate" && (
        <motion.div key="initiate" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{translations.registerWithKyc || "Register with KYC"}</h1>
          <p className="text-gray-600 dark:text-gray-300">{translations.kycDesc || "We'll verify your identity with DigiLocker."}</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleInitiateKyc} className=" start-kyc px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition">
            🚀 {translations.startKyc || "Start KYC Process"}
          </motion.button>
          <p className="mt-2 text-sm text-indigo-600 hover:underline cursor-pointer" onClick={() => setView("login")}>
            {translations.alreadyRegistered || "Already registered? Login here."}
          </p>
        </motion.div>
      )}

      {view === "registration" && (
        <motion.div key="registration" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
          {kycUserData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className=" p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{translations.verifiedDetails || "Your Verified Details"}</h3>
              <p className="text-gray-700 dark:text-gray-300"><strong>{translations.uid || "UID"}:</strong> {kycUserData.uid.slice(0, -4).replace(/./g, "X") + kycUserData.uid.slice(-4)}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{translations.name || "Name"}:</strong> {kycUserData.name}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{translations.age || "Age"}:</strong> {kycUserData.age}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>{translations.address || "Address"}:</strong> {kycUserData.address}</p>
            </motion.div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{translations.completeRegistration || "Complete Your Registration"}</h2>
            <motion.form onSubmit={handleSetPassword} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <input type="email" id="email" placeholder={translations.emailAddress || "Email Address"} value={passwordForm.email} onChange={handlePasswordChange} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
              <input type="password" id="password" placeholder={translations.newPassword || "New Password"} value={passwordForm.password} onChange={handlePasswordChange} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
              <input type="password" id="confirmPassword" placeholder={translations.confirmPassword || "Confirm Password"} value={passwordForm.confirmPassword} onChange={handlePasswordChange} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition">
                {translations.createAccount || "Create Account"}
              </motion.button>
            </motion.form>
          </div>
        </motion.div>
      )}

      {view === "login" && (
        <motion.div key="login" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="pat-auth-card space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">{translations.login || "Login"}</h1>
          <motion.form onSubmit={handleLogin} className="login space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <input type="text" id="uid" placeholder={translations.aadhaarUid || "Aadhaar Number (UID)"} value={loginForm.uid} onChange={handleLoginChange} required className=" w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
            <input type="text" id="name" placeholder={translations.fullName || "Full Name (as per Aadhaar)"} value={loginForm.name} onChange={handleLoginChange} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
            <input type="password" id="password" placeholder={translations.password || "Password"} value={loginForm.password} onChange={handleLoginChange} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition">
              {translations.login || "Login"}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">{translations.or || "OR"}</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Google Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-sm transition font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h4.01c2.34-2.16 3.69-5.35 3.69-8.75z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.95 1.19-3.05 0-5.64-2.06-6.56-4.83H1.36v3.23C3.33 21.6 7.42 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.44 14.32a7.18 7.18 0 0 1 0-4.64V6.45H1.36a11.93 11.93 0 0 0 0 11.1l4.08-3.23z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.42 0 3.33 2.4 1.36 6.45l4.08 3.23c.92-2.77 3.51-4.83 6.56-4.83z"
              />
            </svg>
            {translations.continueWithGoogle || "Continue with Google"}
          </motion.button>

          <p className="kyc-reg text-sm text-indigo-600 hover:underline cursor-pointer text-center" onClick={() => setView("initiate")}>
            {translations.firstTime || "First time user? Complete KYC to register."}
          </p>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`p-3 rounded-lg text-center ${
              status.isError
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
};

export default AuthPage;
