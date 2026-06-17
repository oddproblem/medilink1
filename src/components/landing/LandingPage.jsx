//latest working landing page
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import * as THREE from "three";
import StatsSection from "../common/StatsSection";
import "../../App.css";
import { useLang } from "../../context/LangContext";

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;


export default function LandingPage() {
  const threeContainerRef = useRef(null);
  const chartCanvasRef = useRef(null);

  // Backend counters
  const [registeredTotal, setRegisteredTotal] = useState(0);
  const [curedTotal, setCuredTotal] = useState(0);
  const [beingCuredTotal, setBeingCuredTotal] = useState(0);

  // Chart data from backend
  const [chartData, setChartData] = useState({ labels: [], data: [] });

  // ✅ useLang hook for translations
  const { t } = useLang();

  // 🔄 Fetch backend data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/patients/statistics`);
        const data = await response.json();
        if (data.success) {
          animateCounters(
            data.statistics.totalPatients,
            data.statistics.patientsDischarged,
            data.statistics.patientsBeingCured
          );
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/patients/analytics/registrations`
        );
        const data = await response.json();
        if (data.success && data.analytics.length > 0) {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
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

    fetchStats();
    fetchAnalytics();
  }, []);

  // Animate counters
  const animateCounters = (totalRegistered, totalCured, totalBeingCured) => {
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setRegisteredTotal(Math.floor(totalRegistered * eased));
      setCuredTotal(Math.floor(totalCured * eased));
      setBeingCuredTotal(Math.floor(totalBeingCured * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Chart.js setup
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
            label: "Patients Registered",
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
  }, [chartData]);

  // Three.js setup
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container || container.children.length > 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.6, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ✅ Lighting (from old code)
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // ✅ DNA Helix group
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    const helixMaterial1 = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const helixMaterial2 = new THREE.MeshBasicMaterial({ color: 0x3399ff });
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    const radius = 0.6,
      spacing = 0.08,
      turns = 25;
    for (let i = 0; i < turns * 30; i++) {
      const angle = i * 0.15;
      const x1 = Math.cos(angle) * radius * 2,
        y1 = Math.sin(angle) * radius * 0.5,
        z1 = i * spacing;
      const sphere1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        helixMaterial1
      );
      sphere1.position.set(x1, y1, z1);
      dnaGroup.add(sphere1);

      const x2 = Math.cos(angle + Math.PI) * radius * 2,
        y2 = Math.sin(angle + Math.PI) * radius * 0.5,
        z2 = i * spacing;
      const sphere2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        helixMaterial2
      );
      sphere2.position.set(x2, y2, z2);
      dnaGroup.add(sphere2);

      const points = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      dnaGroup.add(line);
    }
    dnaGroup.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    dnaGroup.position.set(-4, 3, -(turns * spacing) / 2);

    // ✅ Particles (from old code)
    const pGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x1e293b,
      metalness: 0.3,
      roughness: 0.7,
    });
    for (let i = 0; i < 60; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );
      scene.add(p);
    }

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      dnaGroup.rotation.z += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        try {
          container.removeChild(renderer.domElement);
        } catch (e) { }
      }
      renderer.dispose();
    };
  }, []);


  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      {/* HERO */}
      <header className="relative min-h-[86vh] grid place-items-center overflow-hidden bg-gradient-to-b from-[#eef6ff] to-white dark:from-gray-800 dark:to-gray-950 pt-16">
        <div ref={threeContainerRef} className="absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl w-full p-4 md:p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
            {/* Left Side - Tagline + Heading */}
            <div className="col-span-1">
              <div className="p-4 sm:p-6 md:p-8 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md border border-gray-900/10 dark:border-gray-100/10 shadow-xl rounded-2xl">
                <span className="bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-slate-700 rounded-full px-3 py-1 inline-block mb-3 text-sm">
                  {t("heroTag")}
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                  {t("heroHeading")}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {t("heroDesc")}
                </p>
                <div className="flex gap-2">
                  <a
                    href="/auth"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                  >
                    {t("signIn")}
                  </a>
                  <a
                    href="/#stats"
                    className="stats-btn bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-full transition-colors"
                  >
                    {t("viewStats")}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Side - Stats + Info Cards */}
            <div className="col-span-1">
              <div className="grid grid-cols-2 gap-3">
                {/* Registered */}
                <div className="bg-white dark:bg-gray-800 p-4 text-center rounded-xl shadow-md">
                  <div className="text-red-500 text-3xl sm:text-4xl font-extrabold">
                    {registeredTotal.toLocaleString()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {t("registered")}
                  </div>
                </div>

                {/* Being Cured */}
                <div className="bg-white dark:bg-gray-800 p-4 text-center rounded-xl shadow-md">
                  <div className="text-blue-500 text-3xl sm:text-4xl font-extrabold">
                    {beingCuredTotal.toLocaleString()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {t("beingCured")}
                  </div>
                </div>

                {/* Cured */}
                <div className="bg-white dark:bg-gray-800 p-4 text-center rounded-xl shadow-md col-span-2">
                  <div className="text-green-500 text-3xl sm:text-4xl font-extrabold">
                    {curedTotal.toLocaleString()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {t("cured")}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md col-span-2">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="bi bi-shield-lock text-3xl text-blue-600" />
                    <div>
                      <div className="font-semibold">
                        {t("smarterCare")}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {t("smarterCareDesc")}
                      </div>
                    </div>
                  </div>
                  <hr className="my-3 border-gray-200 dark:border-gray-700" />
                  <div className="flex items-center gap-3">
                    <i className="bi bi-translate text-3xl text-blue-600" />
                    <div>
                      <div className="font-semibold">
                        {t("multilingual")}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {t("multilingualDesc")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* FEATURES */}
      <section id="features" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-4 mb-8">
            <div className="col-span-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                {t("featuresHeading")}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {t("featuresDesc")}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
              <i className="bi bi-qr-code text-5xl mb-4 text-blue-600" />
              <h5 className="font-bold text-xl mb-2">{t("feature1")}</h5>
              <p className="text-gray-600 dark:text-gray-300">
                {t("feature1Desc")}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
              <i className="bi bi-journal-medical text-5xl mb-4 text-blue-600" />
              <h5 className="font-bold text-xl mb-2">{t("feature2")}</h5>
              <p className="text-gray-600 dark:text-gray-300">
                {t("feature2Desc")}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
              <i className="bi bi-graph-up-arrow text-5xl mb-4 text-blue-600" />
              <h5 className="font-bold text-xl mb-2">{t("feature3")}</h5>
              <p className="text-gray-600 dark:text-gray-300">
                {t("feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS & CHART */}
      {/* <section id="stats" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-extrabold text-center mb-8">
            Registration Analytics
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-[400px]">
            <canvas ref={chartCanvasRef}></canvas>
          </div>
        </div>
      </section> */}
      {/* STATS & CHART */}
      <StatsSection />
    </div>
  );
}
