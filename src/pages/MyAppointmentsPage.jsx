import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock, PlusCircle, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL_E;

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${BACKEND_URL}/appointments/my-appointments`, {
          headers: { 'Authorization': token },
        });
        const data = await res.json();
        setAppointments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-12 w-12 text-indigo-600" /></div>;

  return (
    <div className="container mx-auto p-8 pt-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
        <Link to="/patient/find-doctor" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" />
          Book New Appointment
        </Link>
      </div>

      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map(app => (
            <div key={app._id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
              <div>
                <p className="font-bold text-lg text-gray-800">Dr. {app.doctorId.name}</p>
                <p className="text-sm text-gray-600">{app.doctorId.council}</p>
                <p className="text-sm text-gray-500 mt-2">Reason: {app.reason}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold flex items-center justify-end">
                   <StatusIcon status={app.status} />
                   <span className="ml-2 capitalize">{app.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(app.appointmentDate).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">You have no appointments.</p>
        )}
      </div>
    </div>
  );
}