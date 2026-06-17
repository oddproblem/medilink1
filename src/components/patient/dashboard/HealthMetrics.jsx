import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ClipboardList, FileText } from 'lucide-react';

// Custom tooltip from PatientDashboard.jsx
const CustomTooltip = ({ active, payload, label, t }) => {
    if (active && payload && payload.length) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg p-3 shadow-lg bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 backdrop-blur-md"
            >
                <p className="font-semibold">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm">
                        {t(entry.name.toLowerCase())}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </motion.div>
        );
    }
    return null;
};

export default function HealthMetrics({ t, formattedHealthData, prescriptionCount }) {
    const statCards = [
        { title: t('hospitalVisits'), value: 12, icon: <ClipboardList size={42} />, color: "from-indigo-500 to-indigo-700" },
        { title: t('prescriptionsStored'), value: prescriptionCount, icon: <FileText size={42} />, color: "from-emerald-500 to-emerald-700" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
                className="lg:col-span-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:border-indigo-400/40 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        {t('healthTrends')}
                    </h2>
                    <Link to="/patient/readings" className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        {t('seeAllReadings')}
                    </Link>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedHealthData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip content={<CustomTooltip t={t} />} />
                        <Legend />
                        <Line type="monotone" dataKey="s" name={t('systolic')} stroke="#6366f1" strokeWidth={3} dot />
                        <Line type="monotone" dataKey="d" name={t('diastolic')} stroke="#f59e0b" strokeWidth={3} dot />
                        <Line type="monotone" dataKey="w" name={t('weight')} stroke="#10b981" strokeWidth={3} dot />
                        <Line type="monotone" dataKey="p" name={t('pulse')} stroke="#ef4444" strokeWidth={3} dot />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>

            <div className="flex flex-col gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={index}
                        className={`bg-gradient-to-r ${stat.color} text-white rounded-2xl shadow-lg p-6 flex items-center justify-between transition-all duration-300`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (index + 1), duration: 0.3 }}
                        whileHover={{ scale: 1.07, boxShadow: "0 0 25px rgba(99,102,241,0.7)" }}
                    >
                        <div>
                            <h3 className="text-lg font-semibold">{stat.title}</h3>
                            <p className="text-4xl font-extrabold mt-2">{stat.value}</p>
                        </div>
                        <div className="opacity-90">
                            {stat.icon}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}