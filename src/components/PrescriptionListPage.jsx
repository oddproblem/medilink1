// pages/PrescriptionListPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Loader,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useLang } from "../context/LangContext"; // ✅ import hook

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;


export default function PrescriptionListPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLang(); // ✅ multilingual hook

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(t("notLoggedIn"));
        }

        const decodedToken = jwtDecode(token);
        const patientId = decodedToken.id;

        const res = await fetch(
          `${BACKEND_URL}/ocr-prescriptions/patient/${patientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error(t("fetchPrescriptionsFailed"));
        }

        const data = await res.json();
        setPrescriptions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [t]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" />;
      case "processing":
        return <Clock className="text-blue-500 animate-pulse" />;
      case "error":
        return <AlertTriangle className="text-red-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl mt-20">
      {/* ✅ added mt-20 so it clears navbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("myPrescriptions")}</h1>
        <Link
          to="/prescription/process"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {t("uploadNew")}
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <p className="text-center text-gray-500 p-8">
          {t("noPrescriptions")}
        </p>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => (
            <Link
              key={p._id}
              to={`/prescription/result/${p._id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-4">{getStatusIcon(p.status)}</div>
                  <div>
                    <p className="font-semibold text-lg text-gray-600">
                      {t("prescriptionUploadedOn")}{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {t("status")}: {t(p.status, p.status)}
                    </p>
                  </div>
                </div>
                <span className="text-indigo-600 font-semibold">
                  {t("viewDetails")} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
