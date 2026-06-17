import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";


const API_BASE = (process.env.REACT_APP_BACKEND_URL_E || "");



export default function PatientAppointmentsPage() {
  const [openAppointments, setOpenAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLang();

  const resolvePatientId = () => {
    return localStorage.getItem("patientId") || localStorage.getItem("authToken") || null;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const patientId = resolvePatientId();
        if (!patientId) {
          setError(t("noPatientIdError", "No patientId found in localStorage. Please log in."));
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/appointments/patient/${patientId}`, { headers });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || t("failedToFetchAppointments", "Failed to fetch appointments"));
        }

        // Controller returns { openAppointments, pastAppointments }
        setOpenAppointments(data.openAppointments || []);
        setPastAppointments(data.pastAppointments || []);
      } catch (err) {
        console.error("Fetch appointments error:", err);
        setError(err.message || t("errorFetchingAppointments", "Error fetching appointments"));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-center mt-8">{t("loadingAppointments")}</p>;
  if (error) return <p className="text-center mt-8 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-8 pt-24 max-w-3xl">
      {/* Heading + Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">{t("myAppointments")}</h1>
        <Link
          to="/patient/book-appointment"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {t("bookAppointment")}
        </Link>
      </div>

      <section className="mb-12 ">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-600">{t("upcomingAppointment")}</h2>
        {openAppointments.length ? (
          openAppointments.map((a) => (
            <div key={a._id} className="mb-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
              <p><strong>{t("doctor")}:</strong> {a.doctorId?.name ?? "—"}</p>
              <p><strong>{t("date")}:</strong> {new Date(a.appointmentDate).toLocaleString()}</p>
              <p><strong>{t("reason", "Reason")}:</strong> {a.reason}</p>
              <p className="text-yellow-600"><strong>{t("status")}:</strong> {t(a.status, a.status)}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">{t("No upcoming appointments.")}</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-600">{t("pastAppointment")}</h2>
        {pastAppointments.length ? (
          pastAppointments.map((a) => (
            <div key={a._id} className="mb-4 p-4 border rounded-lg shadow-sm  bg-gray-50 dark:bg-gray-800">
              <p><strong>{t("doctor")}:</strong> {a.doctorId?.name ?? "—"}</p>
              <p><strong>{t("date")}:</strong> {new Date(a.appointmentDate).toLocaleString()}</p>
              <p><strong>{t("reason", "Reason")}:</strong> {a.reason}</p>
              <p className={a.status === "completed" ? "text-green-600" : "text-red-600"}><strong>{t("status")}:</strong> {t(a.status, a.status)}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">{t("noPastAppointments")}</p>
        )}
      </section>
       {/* Dashboard button at the bottom */}
      <div className="mt-12 flex justify-center">
        <Link
          to="/patient/dashboard"
          className="bg-indigo-700 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t("goToDashboard")}
        </Link>
      </div>
    </div>
  );
}
