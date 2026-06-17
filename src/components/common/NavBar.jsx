import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { useLang } from "../../context/LangContext";
import MigrantModal from "../modals/MigrantModal";
import DoctorModal from "../modals/DoctorModal";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ✅ Auth

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showMigrantModal, setShowMigrantModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { language, setLanguage, t, languages } = useLang();
  const navigate = useNavigate();

  const { doctorToken, patientToken, logout } = useAuth();

  const handleThemeAndLightToggle = () => {
    toggleDarkMode();
  };

  const changeLanguage = (code) => {
    setLanguage(code);
    setShowLangMenu(false);
  };

  const redirectToAuth = () => {
    window.location.href = "/auth";
  };

  const redirectToDocAuth = () => {
    window.location.href = "/doctor/auth";
  };

  const handleLogout = (type) => {
    logout(type);
    navigate("/");
  };

  // ✅ For language dropdown portal positioning
  const buttonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showLangMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 160 + window.scrollX, // align right (160px width)
      });
    }
  }, [showLangMenu]);

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-[10000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center text-2xl font-bold text-blue-600 dark:text-blue-400">
              <a href="/">SwiftMediLink</a>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-6 items-center">
              <a href="/" className="text-gray-800 dark:text-gray-200 hover:text-blue-500">
                {t("home")}
              </a>
              <a
                href="/emergency"
                className="landing-emergency-btn text-gray-800 dark:text-gray-200 hover:text-blue-500 z-[10000]"
              >
                {t("Emergency")}
              </a>

              {/* Services Dropdown */}
              <div className="relative landing-services-btn">
                <button
                  onClick={() => setShowServicesMenu(!showServicesMenu)}
                  className="text-gray-800 dark:text-gray-200 hover:text-blue-500 focus:outline-none"
                >
                  {t("services")} ▼
                </button>
                {showServicesMenu && (
                  <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <a
                      href="/disease-prediction"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("aiAnalyzer1") || "AI Disease Image Analyzer"}
                    </a>
                    <a
                      href="/disease-symptom-prediction"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("aiAnalyzer2") || "AI Symptom Analyzer"}
                    </a>
                    <a
                      href="/hotspot-map"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("hotspot")}
                    </a>
                    <a
                      href="/prescriptions"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("myPrescriptions") || "My Prescriptions"}
                    </a>
                    <a
                      href="/prescription/process"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("processPrescription") || "Process Prescription"}
                    </a>
                    <a
                      href="/patient/book-appointment"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("bookAppointment") || "Book Appointment"}
                    </a>
                    <a
                      href="/patient/my-appointments"
                      className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("myAppointments") || "My Appointments"}
                    </a>
                  </div>
                )}
              </div>

              {/* Doctor Auth Button */}
              {doctorToken ? (
                <button
                  onClick={() => handleLogout("doctor")}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t("doctorLogout", "Doctor Logout")}
                </button>
              ) : patientToken ? (
                <a
                  href="/patient/dashboard"
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 dashboard-btn"
                >
                  {t("patientDashboard", "Patient Dashboard")}
                </a>
              ) : (
                <button
                  onClick={redirectToDocAuth}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 landing-doctor-btn"
                >
                  {t("doctorSignIn")}
                </button>
              )}

              {/* Patient Auth Button */}
              {patientToken ? (
                <button
                  onClick={() => handleLogout("patient")}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  {t("patientLogout", "Patient Logout")}
                </button>
              ) : doctorToken ? (
                <a
                  href="/doctor/dashboard"
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 dashboard-btn"
                >
                  {t("doctorDashboard", "Doctor's Dashboard")}
                </a>
              ) : (
                <button
                  onClick={redirectToAuth}
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 landing-signin-btn"
                >
                  {t("patientSignIn")}
                </button>
              )}



              {/* Language Dropdown (Desktop) */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="lng-btn px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {language.toUpperCase()} ▼
                </button>
                {showLangMenu &&
                  createPortal(
                    <div
                      className="absolute w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[11000] max-h-64 overflow-y-auto"
                      style={{
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                      }}
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => changeLanguage(lang.value)}
                          className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
              </div>

              {/* Dark/Light Toggle */}
              <button
                onClick={handleThemeAndLightToggle}
                className="ml-4 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-2xl text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {isOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu with Animation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white dark:bg-gray-900 shadow-md px-4 py-6 space-y-4"
            >
              <a
                href="/"
                className="block text-gray-800 dark:text-gray-200 hover:text-blue-500"
              >
                {t("home")}
              </a>
              <a
                href="/emergency"
                className="block text-gray-800 dark:text-gray-200 hover:text-blue-500"
              >
                {t("Emergency")}
              </a>
              <button
                onClick={() => setShowServicesMenu(!showServicesMenu)}
                className="block text-gray-800 dark:text-gray-200 hover:text-blue-500 w-full text-left"
              >
                {t("services")} ▼
              </button>
              {showServicesMenu && (
                <div className="pl-4 space-y-2">
                  <a
                    href="/disease-prediction"
                    className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  >
                    {t("aiAnalyzer1") || "AI Disease Image Analyzer"}
                  </a>
                  <a
                    href="/disease-symptom-prediction"
                    className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  >
                    {t("aiAnalyzer2") || "AI Symptom Analyzer"}
                  </a>
                  <a
                    href="/hotspot-map"
                    className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  >
                    {t("hotspot")}
                  </a>
                  <a
                    href="/prescriptions"
                    className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  >
                    {t("myPrescriptions") || "My Prescriptions"}
                  </a>
                  <a
                    href="/prescription/process"
                    className="block text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  >
                    {t("processPrescription") || "Process Prescription"}
                  </a>
                </div>
              )}

              {/* Auth Buttons */}
              {doctorToken ? (
                <button
                  onClick={() => handleLogout("doctor")}
                  className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t("doctorLogout", "Doctor Logout")}
                </button>
              ) : (
                <button
                  onClick={redirectToDocAuth}
                  className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  {t("doctorSignIn")}
                </button>
              )}

              {patientToken ? (
                <button
                  onClick={() => handleLogout("patient")}
                  className="w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  {t("patientLogout", "Patient Logout")}
                </button>
              ) : (
                <button
                  onClick={redirectToAuth}
                  className="w-full px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  {t("patientSignIn")}
                </button>
              )}

              {/* Language + Theme (Mobile) */}
              <div className="flex justify-between items-center w-full">
                <div>
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {language.toUpperCase()} ▼
                  </button>
                  {showLangMenu && (
                    <div className="mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => changeLanguage(lang.value)}
                          className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleThemeAndLightToggle}
                  className="text-gray-800 dark:text-gray-200 focus:outline-none"
                >
                  {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Modals */}
      <DoctorModal show={showDoctorModal} onClose={() => setShowDoctorModal(false)} />
      <MigrantModal show={showMigrantModal} onClose={() => setShowMigrantModal(false)} />
    </>
  );
};

export default Navbar;
