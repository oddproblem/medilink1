import { useContext, createContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { guides } from "../guides.js";

export const GuideContext = createContext();

// Wait helper to ensure elements exist before highlighting
const waitForElement = (selector, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const interval = 50;
    let elapsed = 0;
    const check = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(check);
        resolve(el);
      } else if (elapsed >= timeout) {
        clearInterval(check);
        reject(new Error(`Element ${selector} not found`));
      }
      elapsed += interval;
    }, interval);
  });

export const GuideProvider = ({ children }) => {
  const location = useLocation();
  const [showGuide, setShowGuide] = useState(false);
  const [currentGuide, setCurrentGuide] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const [completedGuides, setCompletedGuides] = useState({
    public: false,
    patient: false,
    doctor: false,
    patientAuth: false,
    doctorAuth: false,
    doctorVerify: false
  });                                                                   

  // ✅ Move startGuide OUTSIDE useEffect
  const startGuide = async (guide) => {
    if (!guide || !guide.length) return;
    const firstStep = guide[0];
    if (firstStep.waitFor) {
      try {
        await waitForElement(firstStep.waitFor);
      } catch (err) {
        console.warn(err);
      }
    }
    setCurrentGuide(guide);
    setShowGuide(true);
  };

  // Auto-start certain guides based on location + tokens
  useEffect(() => {
    const doctorToken = localStorage.getItem("doctorAuthToken");
    const patientToken = localStorage.getItem("authToken");

    if (!doctorToken && !patientToken && !completedGuides.public && location.pathname === "/") {
      startGuide(guides.public);
    } else if (location.pathname === "/auth" && !completedGuides.patientAuth) {
      startGuide(guides.patientAuth);
    } else if (location.pathname === "/doctor/auth" && !completedGuides.doctorAuth) {
      startGuide(guides.doctorAuth);
    } else if (patientToken && !completedGuides.patient && location.pathname.startsWith("/patient")) {
      startGuide(guides.patient);
    } else if (doctorToken && !completedGuides.doctor && location.pathname.startsWith("/doctor")) {
      startGuide(guides.doctor);
    } else {
      setShowGuide(false);
    }
  }, [location, completedGuides]);

  const nextStep = async () => {
    const step = currentGuide[stepIndex];
    if (step?.waitFor) {
      try {
        await waitForElement(step.waitFor);
      } catch (err) {
        console.warn(err);
      }
    }

    if (stepIndex < currentGuide.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      endGuide();
    }
  };

  const skipGuide = () => {
    endGuide();
  };

  const endGuide = () => {
    setShowGuide(false);

    if (currentGuide === guides.public) setCompletedGuides((prev) => ({ ...prev, public: true }));
    if (currentGuide === guides.patient) setCompletedGuides((prev) => ({ ...prev, patient: true }));
    if (currentGuide === guides.doctor) setCompletedGuides((prev) => ({ ...prev, doctor: true }));
    if (currentGuide === guides.patientAuth) setCompletedGuides((prev) => ({ ...prev, patientAuth: true }));
    if (currentGuide === guides.doctorAuth) setCompletedGuides((prev) => ({ ...prev, doctorAuth: true }));
    if (currentGuide === guides.doctorVerifyGuide) setCompletedGuides(prev => ({ ...prev, doctorVerify: true }));


    setStepIndex(0);
  };

  return (
    <GuideContext.Provider
      value={{
        showGuide,
        currentGuide,
        stepIndex,
        startGuide,   // ✅ exposed here
        nextStep,
        skipGuide,
        completedGuides,
      }}
    >
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  return useContext(GuideContext);
};
