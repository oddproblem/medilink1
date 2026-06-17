import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserPlus, Phone, Hospital, Stethoscope, Edit, Trash2, PlusCircle, X } from 'lucide-react';
import { useLang } from '../../context/LangContext'; // 🌐 Import useLang hook

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_WITHOUT_V1}`;

const modalVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
    exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Reusable modal component for forms
const FormModal = ({ title, isOpen, onClose, children, onSave, t }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h3>
                            <motion.button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <X size={24} />
                            </motion.button>
                        </div>
                        <div className="space-y-4">{children}</div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <motion.button
                                onClick={onClose}
                                className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                                {t('cancel')}
                            </motion.button>
                            <motion.button
                                onClick={onSave}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                                {t('save')}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Main Component
export default function EmergencyManagement({ patientId }) {
    const { t, language } = useLang(); // 🌐 Use t for translations
    const [contacts, setContacts] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for Contact modal
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [contactFormData, setContactFormData] = useState({ name: '', relationship: '', phone: '' });

    // State for Doctor modal
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [currentDoctor, setCurrentDoctor] = useState(null);
    const [doctorFormData, setDoctorFormData] = useState({ name: '', specialty: '', phone: '', hospitalAffiliation: '' });
    
    // State for Hospital modal
    const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
    const [currentHospital, setCurrentHospital] = useState(null);
    const [hospitalFormData, setHospitalFormData] = useState({ name: '', address: '', phone: '' });

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            try {
                const responses = await Promise.all([
                    fetch(`${BACKEND_URL}/api/v1/emergency-contacts/patient/${patientId}`, { headers }),
                    fetch(`${BACKEND_URL}/api/v1/emergency-doctors`, { headers }),
                    fetch(`${BACKEND_URL}/api/v1/emergency-hospitals`, { headers })
                ]);
                
                const [contactsRes, doctorsRes, hospitalsRes] = responses;
                setContacts(contactsRes.ok ? await contactsRes.json() : []);
                setDoctors(doctorsRes.ok ? await doctorsRes.json() : []);
                setHospitals(hospitalsRes.ok ? await hospitalsRes.json() : []);

            } catch (err) {
                console.error("Failed to fetch emergency data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) fetchAllData();
    }, [patientId]);

    // --- Generic API Handler ---
    const apiHandler = async (url, method, body = null) => {
        const token = localStorage.getItem('authToken');
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(t('requestFailed', { status: res.status }));
        return method === 'DELETE' ? res.ok : res.json();
    };

    // --- CRUD Handlers for CONTACTS ---
    const handleSaveContact = async () => {
        const url = currentContact ? `${BACKEND_URL}/api/v1/emergency-contacts/${currentContact._id}` : `${BACKEND_URL}/api/v1/emergency-contacts`;
        const method = currentContact ? 'PUT' : 'POST';
        const body = currentContact ? contactFormData : { ...contactFormData, patientId };
        try {
            const saved = await apiHandler(url, method, body);
            setContacts(currentContact ? contacts.map(c => c._id === saved._id ? saved : c) : [...contacts, saved]);
            setIsContactModalOpen(false);
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const handleDeleteContact = async (id) => {
        if (!window.confirm(t("confirmDeleteContact"))) return;
        try {
            await apiHandler(`${BACKEND_URL}/api/v1/emergency-contacts/${id}`, 'DELETE');
            setContacts(contacts.filter(c => c._id !== id));
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const openContactModal = (contact = null) => {
        setCurrentContact(contact);
        setContactFormData(contact ? { name: contact.name, relationship: contact.relationship, phone: contact.phone } : { name: '', relationship: '', phone: '' });
        setIsContactModalOpen(true);
    };

    // --- CRUD Handlers for DOCTORS ---
    const handleSaveDoctor = async () => {
        const url = currentDoctor ? `${BACKEND_URL}/api/v1/emergency-doctors/${currentDoctor._id}` : `${BACKEND_URL}/api/v1/emergency-doctors`;
        const method = currentDoctor ? 'PUT' : 'POST';
        try {
            const saved = await apiHandler(url, method, doctorFormData);
            setDoctors(currentDoctor ? doctors.map(d => d._id === saved._id ? saved : d) : [...doctors, saved]);
            setIsDoctorModalOpen(false);
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const handleDeleteDoctor = async (id) => {
        if (!window.confirm(t("confirmDeleteDoctor"))) return;
        try {
            await apiHandler(`${BACKEND_URL}/api/v1/emergency-doctors/${id}`, 'DELETE');
            setDoctors(doctors.filter(d => d._id !== id));
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const openDoctorModal = (doctor = null) => {
        setCurrentDoctor(doctor);
        setDoctorFormData(doctor ? { name: doctor.name, specialty: doctor.specialty, phone: doctor.phone, hospitalAffiliation: doctor.hospitalAffiliation } : { name: '', specialty: '', phone: '', hospitalAffiliation: '' });
        setIsDoctorModalOpen(true);
    };

    // --- CRUD Handlers for HOSPITALS ---
    const handleSaveHospital = async () => {
        const url = currentHospital ? `${BACKEND_URL}/api/v1/emergency-hospitals/${currentHospital._id}` : `${BACKEND_URL}/api/v1/emergency-hospitals`;
        const method = currentHospital ? 'PUT' : 'POST';
        try {
            const saved = await apiHandler(url, method, hospitalFormData);
            setHospitals(currentHospital ? hospitals.map(h => h._id === saved._id ? saved : h) : [...hospitals, saved]);
            setIsHospitalModalOpen(false);
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const handleDeleteHospital = async (id) => {
        if (!window.confirm(t("confirmDeleteHospital"))) return;
        try {
            await apiHandler(`${BACKEND_URL}/api/v1/emergency-hospitals/${id}`, 'DELETE');
            setHospitals(hospitals.filter(h => h._id !== id));
        } catch (error) { alert(`${t('error')}: ${error.message}`); }
    };
    const openHospitalModal = (hospital = null) => {
        setCurrentHospital(hospital);
        setHospitalFormData(hospital ? { name: hospital.name, address: hospital.address, phone: hospital.phone } : { name: '', address: '', phone: '' });
        setIsHospitalModalOpen(true);
    };

    if (loading) return <div className="pt-20 p-6 text-center dark:text-gray-300">{t('loadingEmergencyInfo')}</div>;

    return (
        <div className="pt-20 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
                <motion.div
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                        <Shield className="mr-2 text-indigo-600 dark:text-indigo-400"/> {t('emergencyCenter')}
                    </h3>
                    
                    <div className="space-y-8">
                        {/* Emergency Contacts Section */}
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center"><UserPlus className="mr-2 text-indigo-600 dark:text-indigo-400"/>{t('patientsContacts')}</h4>
                                <motion.button onClick={() => openContactModal()} className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <PlusCircle size={16} className="mr-1"/> {t('addNew')}
                                </motion.button>
                            </div>
                            <div className="space-y-2">
                                {contacts.length > 0 ? contacts.map(c => (
                                    <motion.div key={c._id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" whileHover={{ scale: 1.02 }}>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">- {c.relationship}</span></p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><Phone size={14} className="mr-2 text-indigo-600"/>{c.phone}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <motion.button onClick={() => openContactModal(c)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Edit size={16}/></motion.button>
                                            <motion.button onClick={() => handleDeleteContact(c._id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Trash2 size={16}/></motion.button>
                                        </div>
                                    </motion.div>
                                )) : <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noContactsFound')}</p>}
                            </div>
                        </section>

                        {/* Emergency Doctors Section */}
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center"><Stethoscope className="mr-2 text-green-600 dark:text-green-400"/>{t('systemDoctors')}</h4>
                                <motion.button onClick={() => openDoctorModal()} className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <PlusCircle size={16} className="mr-1"/> {t('addNew')}
                                </motion.button>
                            </div>
                            <div className="space-y-2">
                                {doctors.length > 0 ? doctors.map(doc => (
                                    <motion.div key={doc._id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" whileHover={{ scale: 1.02 }}>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{doc.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">- {doc.specialty}</span></p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><Phone size={14} className="mr-2 text-green-600"/>{doc.phone}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <motion.button onClick={() => openDoctorModal(doc)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Edit size={16}/></motion.button>
                                            <motion.button onClick={() => handleDeleteDoctor(doc._id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Trash2 size={16}/></motion.button>
                                        </div>
                                    </motion.div>
                                )) : <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noDoctorsFound')}</p>}
                            </div>
                        </section>

                        {/* Emergency Hospitals Section */}
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center"><Hospital className="mr-2 text-red-600 dark:text-red-400"/>{t('systemHospitals')}</h4>
                                <motion.button onClick={() => openHospitalModal()} className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <PlusCircle size={16} className="mr-1"/> {t('addNew')}
                                </motion.button>
                            </div>
                            <div className="space-y-2">
                                {hospitals.length > 0 ? hospitals.map(hosp => (
                                    <motion.div key={hosp._id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" whileHover={{ scale: 1.02 }}>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{hosp.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{hosp.address}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1"><Phone size={14} className="mr-2 text-red-600"/>{hosp.phone}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <motion.button onClick={() => openHospitalModal(hosp)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Edit size={16}/></motion.button>
                                            <motion.button onClick={() => handleDeleteHospital(hosp._id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" whileHover={{ scale: 1.1 }}><Trash2 size={16}/></motion.button>
                                        </div>
                                    </motion.div>
                                )) : <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noHospitalsFound')}</p>}
                            </div>
                        </section>
                    </div>
                </motion.div>
            </motion.div>

            {/* Modals */}
            <FormModal 
                title={currentContact ? t('editContact') : t('addContact')} 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
                onSave={handleSaveContact} 
                t={t}
            >
                <input type="text" value={contactFormData.name} onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})} placeholder={t('fullName')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="text" value={contactFormData.relationship} onChange={(e) => setContactFormData({...contactFormData, relationship: e.target.value})} placeholder={t('relationship')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="tel" value={contactFormData.phone} onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})} placeholder={t('phoneNumber')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
            </FormModal>

            <FormModal 
                title={currentDoctor ? t('editDoctor') : t('addDoctor')} 
                isOpen={isDoctorModalOpen} 
                onClose={() => setIsDoctorModalOpen(false)} 
                onSave={handleSaveDoctor} 
                t={t}
            >
                <input type="text" value={doctorFormData.name} onChange={(e) => setDoctorFormData({...doctorFormData, name: e.target.value})} placeholder={t('doctorsName')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="text" value={doctorFormData.specialty} onChange={(e) => setDoctorFormData({...doctorFormData, specialty: e.target.value})} placeholder={t('specialty')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="tel" value={doctorFormData.phone} onChange={(e) => setDoctorFormData({...doctorFormData, phone: e.target.value})} placeholder={t('phoneNumber')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="text" value={doctorFormData.hospitalAffiliation} onChange={(e) => setDoctorFormData({...doctorFormData, hospitalAffiliation: e.target.value})} placeholder={t('hospitalAffiliation')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
            </FormModal>

            <FormModal 
                title={currentHospital ? t('editHospital') : t('addHospital')} 
                isOpen={isHospitalModalOpen} 
                onClose={() => setIsHospitalModalOpen(false)} 
                onSave={handleSaveHospital} 
                t={t}
            >
                <input type="text" value={hospitalFormData.name} onChange={(e) => setHospitalFormData({...hospitalFormData, name: e.target.value})} placeholder={t('hospitalName')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="text" value={hospitalFormData.address} onChange={(e) => setHospitalFormData({...hospitalFormData, address: e.target.value})} placeholder={t('address')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
                <input type="tel" value={hospitalFormData.phone} onChange={(e) => setHospitalFormData({...hospitalFormData, phone: e.target.value})} placeholder={t('phoneNumber')} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"/>
            </FormModal>
        </div>
    );
}