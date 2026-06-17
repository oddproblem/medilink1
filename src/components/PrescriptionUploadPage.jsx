// pages/PrescriptionUploadPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, FileCheck, Loader } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { useLang } from '../context/LangContext'; // ✅ import useLang

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL_E}`;

export default function PrescriptionUploadPage() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' or 'camera'
  const [status, setStatus] = useState('idle'); // idle, uploading, processing
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLang(); // ✅ translation function

  // Handles file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  // Activates the camera
  const startCamera = async () => {
    setMode('camera');
    setFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(t("cameraError"));
      setMode('select');
    }
  };

  // Stops camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Captures photo
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        const capturedFile = new File([blob], "prescription.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
      }, 'image/jpeg');
      stopCamera();
      setMode('select');
    }
  };

  // Submission process
  const handleSubmit = async () => {
    if (!file) {
      setError(t("noFileError"));
      return;
    }
    setStatus('uploading');
    setError('');

    try {
      // Step 1: Upload to Cloudinary
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const cloudinaryRes = await fetch(url, { method: "POST", body: formData });
      if (!cloudinaryRes.ok) throw new Error(t("cloudinaryError"));
      const cloudinaryData = await cloudinaryRes.json();

      setStatus('processing');

      // Step 2: Send URL and patientId to backend
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error(t("authError"));

      const decodedToken = jwtDecode(token);
      const patientId = decodedToken.id;

      const backendRes = await fetch(`${BACKEND_URL}/ocr-prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          fileUrl: cloudinaryData.secure_url,
          patientId: patientId
        }),
      });

      if (!backendRes.ok) throw new Error(t("backendError"));
      
      const { recordId } = await backendRes.json();
      navigate(`/prescription/result/${recordId}`);

    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };
  
  return (
    <div className="container mx-auto p-8 max-w-2xl mt-20">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("processPrescription")}</h1>
      {mode === 'camera' ? (
        <div className="text-center">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg shadow-lg mb-4"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <button onClick={capturePhoto} className="px-6 py-3 bg-red-600 text-white rounded-lg mr-4">{t("capture")}</button>
          <button onClick={() => { stopCamera(); setMode('select'); }} className="px-6 py-3 bg-gray-500 text-white rounded-lg">{t("cancel")}</button>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-500 p-8 rounded-lg shadow-md text-center">
          <div className="flex justify-center gap-4 mb-6">
            <button onClick={() => document.getElementById('file-upload').click()} className="flex-1 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 hover:dark:bg-gray-700">
              <Upload className="mb-2" /> {t("uploadFile")}
            </button>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf"/>
            <button onClick={startCamera} className="flex-1 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 hover:dark:bg-gray-700">
              <Camera className="mb-2" /> {t("useCamera")}
            </button>
          </div>
          
          {file && (
            <div className="text-left bg-green-100 p-3 rounded-lg flex items-center">
              <FileCheck className="text-green-700 mr-2" />
              <p className="text-green-800">{t("selected")}: {file.name}</p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!file || status !== 'idle'}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 flex items-center justify-center"
            >
              {status === 'idle' && t("uploadAndProcess")}
              {(status === 'uploading' || status === 'processing') && <Loader className="animate-spin mr-2" />}
              {status === 'uploading' && t("uploadingCloud")}
              {status === 'processing' && t("sendingAI")}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
}
