import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomNavbar from "./components/common/NavBar";
import LandingPage from "./components/landing/LandingPage";
import "./index.css";
import "./App.css";
import Footer from "./components/common/Footer";
import PatientDashboard from "./components/patient/dashboard/PatientDashboard";
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import DiseaseHistory from "./components/patient/DiseaseHistory";
import PrescriptionPage from './components/patient/Prescriptions';
import AuthPage from './components/AuthPage';
import DailyReadingsPage from './components/patient/DailyReadingsPage';
import DoctorAuth from './components/doctor/DoctorAuth';
import PatientProfile from './components/patient/PatientProfile';
import DiseasePrediction from "./components/common/image_test";
import HotspotMap from "./components/common/HotspotMap";
import { ThemeProvider, useTheme } from "./context/ThemeContext"; 
import EmergencyManagement from "./components/patient/EmergencyManagement";
import DiseaseSymptomPrediction from "./components/common/DiseaseSymptomPrediction";
import PrescriptionUploadPage from "./components/PrescriptionUploadPage";
import PrescriptionResultPage from "./components/PrescriptionResultPage";
import PrescriptionListPage from "./components/PrescriptionListPage";
import PatientMedicationSummaryPage from './pages/PatientMedicationSummaryPage'; // ✅ Import the new page
import BookAppointmentPage from "./pages/BookAppointmentPage";
import PatientAppointmentsPage from "./pages/PatientAppointmentsPage";

import { AuthProvider } from "./context/AuthContext"


// Wrapper to access theme context inside App
function ThemedApp() {
  const { darkMode } = useTheme();

  return (
      <Router>
        <>
          <div
            className={
              darkMode
                ? "dark bg-gray-900 text-white min-h-screen flex flex-col"
                : "bg-white text-gray-900 min-h-screen flex flex-col"
            }
          >
            {/* Navbar always visible */}
            <CustomNavbar />

            {/* Routes */}
            <main className="flex-grow dark:bg-gray-900">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/patient/history" element={<DiseaseHistory />} />
                {/* <Route path="/patient/prescriptions" element={<PrescriptionPage />} /> */}
                <Route path="/patient/readings" element={<DailyReadingsPage />} />
                <Route path="/doctor/auth" element={<DoctorAuth />} />
                <Route path="/patient/:id" element={<PatientProfile />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/disease-prediction" element={<DiseasePrediction />} />
                <Route path="/disease-symptom-prediction" element={<DiseaseSymptomPrediction />} />
                <Route path="/prescriptions" element={<PrescriptionListPage />} /> {/* <-- Add this new route */}
                <Route path="/prescription/process" element={<PrescriptionUploadPage />} />
                <Route path="/prescription/result/:id" element={<PrescriptionResultPage />} />
                <Route path="/patient/medication-summary" element={<PatientMedicationSummaryPage />} />
                <Route path="/patient/book-appointment" element={<BookAppointmentPage />} />
                <Route path="/patient/my-appointments" element={<PatientAppointmentsPage />} />            


                <Route
                  path="/hotspot-map"
                  element={
                    <HotspotMap
                      disease="Chickenpox"
                      center={{ lat: 28.6139, lng: 77.2090 }}
                      radius={10}
                    />
                  }
                />

                <Route
                  path="/emergency"
                  element={
                    <div className="container mx-auto p-4">
                      <EmergencyManagement patientId="68bae87b0ab9cc9c53ad1efc" />
                    </div>
                  }
                />
              </Routes>
            </main>

            {/* Footer always visible */}
            <Footer />


          </div>
        </>
      </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
