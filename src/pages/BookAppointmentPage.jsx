import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Calendar, MessageSquare, Send, Loader } from "lucide-react";
import {useLang} from "../context/LangContext";
const API_BASE = (process.env.REACT_APP_BACKEND_URL_E || "") // e.g. http://localhost:5000

export default function BookAppointmentPage() {
  const { doctorId: doctorIdParam } = useParams();       // optional param if you ever pass one
  const location = useLocation();                       // optional state/query fallback
  const navigate = useNavigate();
  const {t}=useLang();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorIdParam || "");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Resolve patientId: prefer explicit 'patientId' in localStorage, otherwise fall back to authToken
  const resolvePatientId = () => {
    return localStorage.getItem("patientId") || localStorage.getItem("authToken") || null;
  };

  // min date for input
  const getMinDateTime = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 16);
  };

  // fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setFetchingDoctors(true);
        setError("");
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/doctors`, { headers });
        const json = await res.json();
        // The API returns an array (per your route). If wrapped, handle both — but user indicated direct array.
        const arr = Array.isArray(json) ? json : (json.doctors || json.result || []);
        setDoctors(arr);
        // Try to preset a selected doctor:
        const candidate =
          doctorIdParam ||
          new URLSearchParams(location.search).get("doctorId") ||
          (location.state && location.state.doctorId) ||
          null;

        if (candidate) {
          // match either _id (string) or numeric doctorId
          const match = arr.find(
            (d) => String(d._id) === String(candidate) || String(d.doctorId) === String(candidate)
          );
          if (match) setSelectedDoctorId(match._id || match.doctorId);
          else setSelectedDoctorId(candidate);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(t("failedToLoadDoctors", "Failed to load doctors. Check console."));
      } finally {
        setFetchingDoctors(false);
      }
    };

    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const patientId = resolvePatientId();
    if (!patientId) {
      setError(t("patientNotFoundLogin", "Patient not found. Please login."));
      return;
    }
    if (!selectedDoctorId) {
      setError(t("pleaseSelectDoctor"));
      return;
    }
    if (!appointmentDate) {
      setError(t("pleaseChooseAppointmentTime"));
      return;
    }

    setLoading(true);
    try {
      // Prepare payload — send doctor _id where possible
      const doctorToSend = selectedDoctorId;

      const payload = {
        doctorId: doctorToSend,
        appointmentDate,
        reason,
        patientId,
      };

      const token = localStorage.getItem("authToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || JSON.stringify(data) || t("bookingFailed", "Booking failed");
        throw new Error(msg);
      }

      setSuccess(t("appointmentBookedSuccessfully"));
      // navigate to appointments list
      setTimeout(() => navigate("/patient/my-appointments"), 1100);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || t("bookingFailed", "Booking failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 pt-24 max-w-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">{t("bookAppointment")}</h1>

      {fetchingDoctors ? (
        <p className="text-center">{t("loadingDoctors")}</p>
      ) : (
        <>
          {doctors.length === 0 && <p className="text-center text-gray-600 mb-4">{t("noDoctorsFoundShort")}</p>}

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border">
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-50 font-bold mb-2">{t("chooseDoctor")}</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="p-3 w-full border rounded-lg bg:dark-gray-50 dark:bg-gray-700"
                required
              >
                <option value="" >{t("selectDoctor")}</option>
                {doctors.map((d) => (
                  <option key={d._id || d.doctorId} value={d._id || d.doctorId}>
                    {d.name} {d.council ? `(${d.council})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 ">
              <label htmlFor="appointmentDate" className="block  text-gray-700 dark:text-gray-50 font-bold mb-2">
                {t("appointmentDateAndTime")}
              </label>
              <div className="relative ">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  id="appointmentDate"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  min={getMinDateTime()}
                  className="pl-10 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg:dark-gray-50 dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="reason" className="block text-gray-700 dark:text-gray-50 font-bold mb-2">{t("reasonForVisit")}</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-gray-800" />
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows="4"
                  className="pl-10 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-gray-300 dark:text-gray-100 bg:dark-gray-50 dark:bg-gray-700"
                  placeholder={t("e.g., Follow-up, fever, etc.")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-indigo-400"
            >
              {loading ? <Loader className="animate-spin" /> : <><Send className="mr-2 h-5 w-5" /> {t("confirmBooking")}</>}
            </button>

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {success && <p className="text-green-500 text-center mt-4">{success}</p>}
          </form>
        </>
      )}
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