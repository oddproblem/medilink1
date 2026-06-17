import React from 'react';
import { Stethoscope, User, Scale, Pill, CalendarDays } from 'lucide-react';
import { useLang } from '../../context/LangContext'; // Assuming you have a language context

export default function FormattedPrescription({ jsonData }) {
  const { t } = useLang(); // For multilingual support

  // Basic validation to prevent errors if data is incomplete
  if (!jsonData || !jsonData.medicines) {
    return (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">
            {t('invalidPrescriptionData')}
        </div>
    );
  }

  const { patient_name, age, weight, medicines } = jsonData;
  const doctorName = "Dr. Placeholder"; // You can pass this as a prop if it's dynamic

  return (
    <div className="bg-white dark:bg-gray-800 p-8 font-sans max-w-2xl mx-auto rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      
      {/* Header Section */}
      <header className="flex justify-between items-center pb-4 border-b-2 border-gray-300 dark:border-gray-600">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{doctorName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("generalPhysician", "General Physician")}</p>
        </div>
        <Stethoscope className="w-12 h-12 text-indigo-500" />
      </header>

      {/* Patient Details Section */}
      <section className="grid grid-cols-3 gap-4 py-6">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('patient')}</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{patient_name || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('age')}</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{age ? `${age} ${t("years", "years")}` : 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('weight')}</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{weight || 'N/A'}</p>
          </div>
        </div>
      </section>

      {/* Medicines Table */}
      <section className="mt-4">
        <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs text-gray-800 dark:text-gray-200 uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3"><Pill className="inline-block mr-2 h-4 w-4"/>{t('medicine')}</th>
                <th scope="col" className="px-6 py-3">{t('dosage')}</th>
                <th scope="col" className="px-6 py-3">{t('frequency')}</th>
                <th scope="col" className="px-6 py-3">{t('duration')}</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, index) => (
                <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-b-0">
                  <th scope="row" className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {med.name}
                  </th>
                  <td className="px-6 py-4">{med.dosage}</td>
                  <td className="px-6 py-4">{med.frequency}</td>
                  <td className="px-6 py-4">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer / Signature */}
      <footer className="mt-12 text-right">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("signature", "--- Signature ---")}</p>
      </footer>
    </div>
  );
}