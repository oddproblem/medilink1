import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Users, Activity, Search, CalendarCheck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {useLang} from "../../context/LangContext";
// Define the full base URL for your backend API
const BACKEND_URL =  `${process.env.REACT_APP_BACKEND_WITHOUT_V1}`; // e.g., "http://localhost:5000"

// A custom hook for debouncing to prevent excessive API calls while typing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Simple JWT parser
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    patientsBeingCured: 0,
    patientsDischarged: 0,
    totalPatients: 0,
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]); // State for appointments

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { t }=useLang();

  // Effect for fetching all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("doctorAuthToken");
        if (!token) {
            navigate('/doctor/login'); // Redirect if no token
            return;
        }

        const decodedToken = parseJwt(token);
        const doctorId = decodedToken?.id; // Assuming the doctor's ID is stored in the 'id' field

        if (!doctorId) {
            console.error("Could not find Doctor ID in token.");
            navigate('/doctor/login'); // Redirect if ID is not found
            return;
        }
        
        const headers = {
          Authorization: `Bearer ${token}`, // Standard Bearer token format
          "Content-Type": "application/json",
        };

        // Fetch stats
        const statsRes = await fetch(`${BACKEND_URL}/api/v1/patients/statistics`, { headers });
        if (!statsRes.ok) throw new Error("Failed to fetch stats");
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.statistics);

        // Fetch patients
        const patientsRes = await fetch(`${BACKEND_URL}/api/v1/patients?status=under treatment`, { headers });
        if (!patientsRes.ok) throw new Error("Failed to fetch patients");
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
        
        // Fetch appointments
        const appointmentsRes = await fetch(`${BACKEND_URL}/api/v1/appointments/doctor/${doctorId}`, { headers });
        if (!appointmentsRes.ok) throw new Error("Failed to fetch appointments");
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, [navigate]);

  // Effect for searching patients
  useEffect(() => {
    const searchPatients = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem("doctorAuthToken");
        const res = await fetch(
          `${BACKEND_URL}/api/v1/patients/search?q=${debouncedSearchTerm}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        setIsSearching(false);
      }
    };
    searchPatients();
  }, [debouncedSearchTerm]);
  
  // Handler to update appointment status
  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
        const token = localStorage.getItem("doctorAuthToken");
        const res = await fetch(`${BACKEND_URL}/api/v1/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!res.ok) throw new Error('Failed to update status');

        // Update UI by removing the appointment from the list
        setAppointments(prev => prev.filter(app => app._id !== appointmentId));
    } catch (error) {
        console.error('Error updating appointment status:', error);
        // You might want to show an error message to the user here
    }
  };

  const handleSelectPatient = (patient) => {
    navigate(`/patient/${patient._id}`);
  };
  
  const statCards = [
    {
      title: t("totalPatients", "Total Patients"),
      value: stats.totalPatients,
      icon: <Users size={42} />,
      color: "from-indigo-500 to-indigo-700",
    },
    {
      title: t("currentlyTreating", "Currently Treating"),
      value: stats.patientsBeingCured,
      icon: <Activity size={42} />,
      color: "from-rose-500 to-rose-700",
    },
    {
      title: t("patientsDischarged", "Patients Discharged"),
      value: stats.patientsDischarged,
      icon: <UserCheck size={42} />,
      color: "from-green-500 to-green-700",
    },
  ];

  return (
    <div className="pt-20 p-6 bg-gray-50 min-h-screen dark:bg-gray-900 transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">
        {t("doctorDashboard", "Doctor's Dashboard")}
      </h1>

      {/* --- MODIFIED SEARCH BAR --- */}
      <motion.div
        className=" search-patient relative w-full md:max-w-2xl mb-8" // Made it wider
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className=" flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Search
            className="  ml-4 text-gray-500 dark:text-gray-400"
            size={22}
          />
          <input
            type="text"
            placeholder={t("searchPatientProfilePlaceholder", "SEARCH PATIENT NAME TO VIEW PROFILE")} // Changed placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 outline-none dark:bg-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-lg"
          />
        </div>
        {(searchResults.length > 0 || isSearching) && (
          <ul className="absolute w-full mt-1 bg-white dark:bg-gray-800 dark:text-gray-100 border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 dark:border-gray-700">
            {isSearching ? (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
                {t("searching")}
              </li>
            ) : (
              searchResults.map((patient) => (
                <motion.li
                  key={patient._id}
                  onClick={() => handleSelectPatient(patient)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {patient.fullName}
                </motion.li>
              ))
            )}
          </ul>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            className={`bg-gradient-to-r ${stat.color} text-white rounded-2xl shadow-lg p-6 flex items-center justify-between`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
          >
            <div>
              <h3 className="text-lg font-semibold">{stat.title}</h3>
              <p className="text-4xl font-extrabold mt-2">{stat.value}</p>
            </div>
            <div className="opacity-80">{stat.icon}</div>
          </motion.div>
        ))}
      </div>
      
      {/* --- NEW APPOINTMENTS SECTION --- */}
      <motion.div
        className="appointment-list bg-white p-6 rounded-2xl shadow-lg dark:bg-gray-800 transition-colors duration-300 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className=" text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
          {t("upcomingAppointmentsDoctor", "Upcoming Appointments")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t("patientName", "Patient Name")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t("dateAndTime", "Date & Time")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t("reason", "Reason")}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t("actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.length > 0 ? (
                appointments.map((app, index) => (
                  <motion.tr 
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{app.patientId?.fullName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{new Date(app.appointmentDate).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{app.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleUpdateAppointmentStatus(app._id, 'completed')} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 mr-4" title={t("markAsCompleted", "Mark as Completed")}>
                        <CalendarCheck size={20} />
                      </button>
                      <button onClick={() => handleUpdateAppointmentStatus(app._id, 'cancelled')} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" title={t("cancelAppointment", "Cancel Appointment")}>
                        <XCircle size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">{t("noUpcomingAppointments", "No upcoming appointments.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Patient List */}
      <motion.div
        className="patient-unde-treatment bg-white p-6 rounded-2xl shadow-lg dark:bg-gray-800 transition-colors duration-300"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 transition-colors duration-300">
          {t("patientsUnderTreatment", "Patients Under Treatment")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700 transition-colors duration-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("name", "Name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("age", "Age")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("status", "Status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("lastUpdate", "Last Update")}
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <motion.tbody
              className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {patients.length > 0 ? (
                patients.map((patient, index) => (
                  <motion.tr
                    key={patient._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {patient.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {patient.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        {t(patient.status.toLowerCase().replace(/\s+/g, ""), patient.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                      {new Date(patient.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSelectPatient(patient)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
                      >
                        {t("viewProfile", "View Profile")}
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <td
                    colSpan="5"
                    className="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    {t("noPatients", "No patients found.")}
                  </td>
                </motion.tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

