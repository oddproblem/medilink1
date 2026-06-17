// src/common/StatsSection.jsx
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useLang } from "../../context/LangContext"; // ✅ import LangContext

const BACKEND_URL =  `${process.env.REACT_APP_BACKEND_URL_E}`;

const StatsSection = () => {
  const chartCanvasRef = useRef(null);

  // ✅ Backend counters
  const [registeredTotal, setRegisteredTotal] = useState(0);
  const [curedTotal, setCuredTotal] = useState(0);
  const [beingCuredTotal, setBeingCuredTotal] = useState(0);

  // ✅ Chart data
  const [chartData, setChartData] = useState({ labels: [], data: [] });

  const { t } = useLang(); // ✅ use translation helper

  // 🔄 Fetch statistics (Registered, Cured, Being Cured)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/patients/statistics`);
        const data = await response.json();

        if (data.success) {
          setRegisteredTotal(data.statistics.totalPatients || 0);
          setCuredTotal(data.statistics.patientsDischarged || 0);
          setBeingCuredTotal(data.statistics.patientsBeingCured || 0);
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      }
    };

    fetchStats();
  }, []);

  // 🔄 Fetch analytics (Registrations over time)
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/patients/analytics/registrations`);
        const data = await response.json();

        if (data.success && data.analytics.length > 0) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const labels = data.analytics.map(
            (item) => `${monthNames[item._id.month - 1]} ${item._id.year}`
          );
          const counts = data.analytics.map((item) => item.count);

          setChartData({ labels, data: counts });
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
  }, []);

  // ✅ Chart.js setup (re-runs when data or language changes)
  useEffect(() => {
    if (!chartData.labels.length) return;

    const ctx = chartCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: t("registered"), // ✅ translated label
            data: chartData.data,
            tension: 0.35,
            borderColor: "rgba(239,68,68,1)",
            backgroundColor: "rgba(239,68,68,.12)",
            fill: true,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
      },
    });

    return () => chart.destroy();
  }, [chartData, t]);

  // ✅ Derived values
  const cureRate = registeredTotal === 0 ? 0 : Math.round((curedTotal / registeredTotal) * 100);
  const activeCases = Math.max(0, registeredTotal - curedTotal - beingCuredTotal);

  return (
    <section id="stats" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-center mb-8">
          {t("chartTitle")}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ✅ Stats Card */}
          <div className="col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
              <div className="flex items-center gap-4 mb-4">
                <i className="bi bi-people-fill text-4xl text-red-500" />
                <div>
                  <div className="font-semibold">
                    {t("totalRegistered")}
                  </div>
                  <div className="text-3xl font-bold text-red-500">
                    {registeredTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <i className="bi bi-heart-pulse text-4xl text-blue-500" />
                {/* <div>
                  <div className="font-semibold">
                    {t("beingCured")}
                  </div>
                  <div className="text-3xl font-bold text-blue-500">
                    {beingCuredTotal.toLocaleString()}
                  </div>
                </div> */}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <i className="bi bi-heart-pulse text-4xl text-green-500" />
                <div>
                  <div className="font-semibold">
                    {t("totalCured")}
                  </div>
                  <div className="text-3xl font-bold text-green-500">
                    {curedTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              <hr className="my-4 border-gray-200 dark:border-gray-700" />

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("cureRate")}
                  </div>
                  <div className="text-2xl font-bold">
                    {isNaN(cureRate) ? "0%" : cureRate + "%"}
                  </div>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("activeCases")}
                  </div>
                  <div className="text-2xl font-bold">{activeCases.toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {t("demoNote")}
              </div>
            </div>
          </div>

          {/* ✅ Chart */}
          <div className="col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-[400px]">
              <canvas ref={chartCanvasRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
