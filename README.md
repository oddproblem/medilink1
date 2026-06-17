# 🏥 MediLink

### *Bridging the gap between patients and healthcare providers*

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack healthcare management platform that empowers patients to track their health while giving doctors a powerful interface to manage and monitor their patient base — with AI-driven insights, multilingual support for 28+ languages, and real-time vitals tracking.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Contributors](#-contributors)

---

</div>

## ✨ Features

### 👤 Patient Portal
| Feature | Description |
|---------|-------------|
| **📊 Health Dashboard** | Unified view of vitals, medications, notes, and disease history with interactive FL charts |
| **💊 Medication Tracker** | Track current, prescribed, and past medications with dosage and schedule info |
| **📈 Vitals & Trends** | Log daily readings (BP, heart rate, glucose, SpO₂, temperature) with trend visualization |
| **🔬 Prescription OCR** | Scan physical prescriptions using LLMWhisperer-powered OCR and auto-extract medicines |
| **🧠 AI Health Summary** | Gemini-powered health summary generation based on medical history and vitals |
| **🦠 Disease Prediction** | AI-driven symptom analysis and skin disease prediction from images |
| **🗺️ Disease Hotspots** | View active disease outbreak hotspots on an interactive map |
| **🚨 Emergency Dashboard** | One-tap emergency alerts with quick access to contacts, doctors, and nearby hospitals |
| **📄 PDF Health Reports** | Generate downloadable PDF health reports on demand |
| **📅 Appointments** | Book, view, and manage doctor appointments |

### 🩺 Doctor Portal
| Feature | Description |
|---------|-------------|
| **👥 Patient Management** | Search, view, and manage all assigned patients from a unified dashboard |
| **📋 Patient Detail View** | Deep-dive into any patient's vitals, prescriptions, notes, and disease history |
| **📝 Clinical Notes** | Add, edit, and manage patient notes with timestamps |
| **💉 Prescription Management** | Create and manage prescriptions with multi-medicine support |
| **🔍 Diagnostic Tools** | Access AI-generated summaries and historical health data for each patient |

### 🌐 Multilingual Support
- **28+ languages** including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Urdu, Arabic, Japanese, Chinese, and more
- **Static translations** for all UI elements — loaded instantly from bundled JSON files
- **Dynamic AI translation** via Gemini for database-sourced content (medicines, notes, vitals)
- **Seamless language switching** — users can change language on-the-fly from any screen

### 🔐 Authentication
- **Google OAuth 2.0** sign-in with account picker for patients
- **Email/Password** authentication for doctors with JWT tokens
- **DigiLocker** integration for document verification
- **OTP Verification** via email for secure account creation

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Flutter 3.x · Dart · Provider (State Management) |
| **Backend** | Node.js · Express 5 · Passport.js |
| **Database** | MongoDB Atlas · Mongoose ODM |
| **AI / ML** | Google Gemini API · LLMWhisperer (OCR) |
| **Auth** | Google OAuth 2.0 · JWT · bcrypt |
| **Charts** | FL Chart |
| **PDF** | PDFKit |
| **Email** | Nodemailer |
| **Deployment** | Render (Backend) · APK (Mobile) |

</div>

---

## 🚀 Getting Started

### Prerequisites

- **Flutter SDK** ≥ 3.0.0
- **Node.js** ≥ 18.x
- **MongoDB Atlas** cluster (or local MongoDB)
- **Google Cloud** project with OAuth credentials
- **Gemini API** key

### 1. Clone the Repository

```bash
git clone https://github.com/oddproblem/medilink1.git
cd medilink1
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_callback_url

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Email (Nodemailer)
EMAIL_USER=your_email
EMAIL_PASS=your_app_password

# LLMWhisperer OCR
LLMWHISPERER_API_KEY=your_llmwhisperer_key
```

Start the server:

```bash
node server.js
```

### 3. Flutter App Setup

```bash
# From project root
flutter pub get
flutter run
```

### 4. Build Release APK

```bash
flutter build apk --release
```

The APK will be at `build/app/outputs/flutter-apk/app-release.apk`.

---

## 🏗 Architecture

```
medilink1/
├── lib/                          # Flutter application
│   ├── main.dart                 # App entry point & provider setup
│   ├── app_theme.dart            # Global theme configuration
│   ├── core/
│   │   ├── config/               # App configuration
│   │   ├── models/               # Dart data models
│   │   └── network/
│   │       └── ApiService.dart   # Centralized HTTP client
│   ├── screens/
│   │   ├── auth/                 # Authentication screens
│   │   │   ├── patient_sign_in_screen.dart
│   │   │   ├── doctor_sign_in_screen.dart
│   │   │   ├── oauth_webview_screen.dart
│   │   │   └── digilocker_webview_screen.dart
│   │   ├── patient/              # Patient-facing screens
│   │   │   ├── patient_dashboard_screen.dart
│   │   │   ├── disease_prediction_screen.dart
│   │   │   ├── ocr_scan_screen.dart
│   │   │   ├── emergency_dashboard_screen.dart
│   │   │   ├── disease_hotspots_screen.dart
│   │   │   ├── language_provider.dart
│   │   │   └── ...
│   │   ├── doctor/               # Doctor-facing screens
│   │   │   ├── doctor_dashboard_screen.dart
│   │   │   └── doctor_appointments_screen.dart
│   │   └── patient_detail_screen.dart  # Shared patient detail view
│   └── widgets/                  # Reusable UI components
│
├── server/                       # Node.js backend
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── passport.js           # Google OAuth strategy
│   ├── controllers/              # Route handlers
│   ├── middleware/                # Auth middleware
│   ├── models/                   # Mongoose schemas
│   │   ├── patientModel.js
│   │   ├── Doctor.js
│   │   ├── prescriptionModel.js
│   │   ├── ocrPrescriptionModel.js
│   │   ├── dailyReadingModel.js
│   │   └── ...
│   ├── routes/                   # API route definitions
│   ├── services/                 # Business logic
│   │   ├── geminiService.js      # Gemini AI integration
│   │   ├── aiService.js          # AI prediction service
│   │   ├── digilockerService.js  # DigiLocker verification
│   │   ├── emailService.js       # Email/OTP service
│   │   └── ...
│   └── utils/                    # Helper utilities
│
└── translations/                 # 28+ language JSON files
    ├── hi.json                   # Hindi
    ├── bn.json                   # Bengali
    ├── ta.json                   # Tamil
    ├── te.json                   # Telugu
    └── ...
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback handler |
| `POST` | `/auth/login` | Doctor email/password login |
| `POST` | `/auth/register` | Register new doctor account |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patients` | List all patients |
| `GET` | `/patients/:id` | Get patient by ID |
| `POST` | `/patients` | Create patient profile |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/doctors` | List all doctors |
| `GET` | `/doctors/search` | Search patients by name/condition |
| `GET` | `/doctors/:id/patients` | Get patients assigned to doctor |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/prescriptions/:patientId` | Get patient prescriptions |
| `POST` | `/prescriptions` | Create new prescription |

### Health Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/readings/:patientId` | Get daily vitals readings |
| `POST` | `/readings` | Log new daily reading |
| `GET` | `/notes/:patientId` | Get patient clinical notes |
| `POST` | `/notes` | Add clinical note |
| `GET` | `/history/:patientId` | Get disease history |
| `GET` | `/summary/:patientId` | Get AI health summary |
| `POST` | `/summary/generate` | Generate new AI summary |

### OCR & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ocr-prescriptions/upload` | Upload prescription for OCR |
| `GET` | `/ocr-prescriptions/:patientId` | Get OCR results |
| `POST` | `/report/generate` | Generate PDF health report |

### Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/emergency/alert` | Trigger emergency alert |
| `GET` | `/emergency-contacts/:patientId` | Get emergency contacts |
| `GET` | `/emergency-doctors/:patientId` | Get emergency doctors |
| `GET` | `/emergency-hospitals/:patientId` | Get nearby hospitals |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/translate` | Translate text via Gemini AI |
| `GET` | `/hotspots` | Get disease outbreak hotspots |
| `GET` | `/appointments/:userId` | Get user appointments |
| `POST` | `/verify/send-otp` | Send OTP verification email |
| `POST` | `/verify/verify-otp` | Verify OTP code |
| `GET` | `/health` | Server health check |

---

## 🌍 Supported Languages

<details>
<summary>Click to expand — 28 languages supported</summary>

| Code | Language | Script |
|------|----------|--------|
| `hi` | Hindi | देवनागरी |
| `bn` | Bengali | বাংলা |
| `ta` | Tamil | தமிழ் |
| `te` | Telugu | తెలుగు |
| `mr` | Marathi | मराठी |
| `gu` | Gujarati | ગુજરાતી |
| `kn` | Kannada | ಕನ್ನಡ |
| `ml` | Malayalam | മലയാളം |
| `pa` | Punjabi | ਪੰਜਾਬੀ |
| `or` | Odia | ଓଡ଼ିଆ |
| `as` | Assamese | অসমীয়া |
| `ur` | Urdu | اردو |
| `sd` | Sindhi | سنڌي |
| `ne` | Nepali | नेपाली |
| `sa` | Sanskrit | संस्कृतम् |
| `kok` | Konkani | कोंकणी |
| `doi` | Dogri | डोगरी |
| `mai` | Maithili | मैथिली |
| `bho` | Bhojpuri | भोजपुरी |
| `mni-Mtei` | Manipuri | মৈতৈলোন্ |
| `ar` | Arabic | العربية |
| `zh` | Chinese | 中文 |
| `ja` | Japanese | 日本語 |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `de` | German | Deutsch |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |

</details>

---

## 📦 Key Dependencies

### Flutter (Client)
| Package | Purpose |
|---------|---------|
| `provider` | State management & language switching |
| `fl_chart` | Interactive health data charts |
| `google_fonts` | Premium typography |
| `http` | HTTP client for API calls |
| `webview_flutter` | OAuth & DigiLocker web views |
| `shared_preferences` | Local user session storage |
| `image_picker` | Camera/gallery for OCR & skin prediction |
| `intl` | Date/time formatting |

### Node.js (Server)
| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `@google/generative-ai` | Gemini AI integration |
| `passport-google-oauth20` | Google OAuth strategy |
| `jsonwebtoken` | JWT authentication |
| `llmwhisperer-client` | Prescription OCR engine |
| `pdfkit` | PDF report generation |
| `nodemailer` | Email & OTP delivery |
| `bcryptjs` | Password hashing |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/oddproblem">
        <img src="https://github.com/oddproblem.png" width="100px;" alt="oddproblem" style="border-radius: 50%;"/>
        <br />
        <sub><b>Argha Saha</b></sub>
      </a>
      <br />
      <a href="https://github.com/oddproblem"><code>@oddproblem</code></a>
    </td>
    <td align="center">
      <a href="https://github.com/hmm183">
        <img src="https://github.com/hmm183.png" width="100px;" alt="hmm183" style="border-radius: 50%;"/>
        <br />
        <sub><b>Vrishank Raina</b></sub>
      </a>
      <br />
      <a href="https://github.com/hmm183"><code>@hmm183</code></a>
    </td>
  </tr>
</table>

### Argha Saha — [`@oddproblem`](https://github.com/oddproblem)

> *Project creator & foundation architect*

| Area | Contributions |
|------|--------------|
| **🏗️ Project Foundation** | Designed and scaffolded the entire Flutter + Express project structure from scratch |
| **🗄️ Database Design** | Designed all 15 Mongoose schemas — patients, doctors, prescriptions, readings, notes, disease history, OCR results, appointments, emergency contacts, and more |
| **🖥️ Backend API** | Built the Express 5 server with 18 route modules, MVC architecture, and MongoDB Atlas integration |
| **📱 Flutter Core** | Initial patient & doctor dashboards, authentication screens, and navigation flow |
| **🔐 Auth System** | Passport.js Google OAuth strategy, session management, JWT token infrastructure |
| **📊 Data Models** | Dart model classes for all entities with JSON serialization |

<details>
<summary>📝 Commit History</summary>

| Commit | Changes |
|--------|---------|
| `Initial commit: MediLink Flutter + server project` | 275 files · +19,647 lines |

</details>

---

### Vrishank Raina — [`@hmm183`](https://github.com/hmm183)

> *Feature engineering, AI integration & multilingual systems*

| Area | Contributions |
|------|--------------|
| **🌐 Multilingual System** | Built the entire `LanguageProvider` with static JSON translations for 28 languages + dynamic Gemini AI translation for database content |
| **🔐 Google OAuth Fix** | Fixed WebView OAuth block by implementing custom User-Agent strategy & account picker (`prompt=select_account`) |
| **🤖 AI / ML Integration** | Integrated Gemini AI for health summaries, translation, and disease prediction; connected skin disease ML predictor |
| **📸 Prescription OCR** | Connected LLMWhisperer-powered OCR pipeline — image upload, processing, and result parsing |
| **📊 Dynamic Translation** | Implemented real-time translation of medicines, notes, vitals, and AI summaries across both patient & doctor views |
| **⚡ Performance** | Optimized loading times, debounced search, lazy data fetching, and defensive API response handling |
| **🩺 Doctor Features** | Doctor language selector, patient detail deep-dive with translated content, clinical notes management |
| **🚨 Emergency & Hotspots** | Emergency dashboard UI, disease hotspot map integration |
| **🔧 DevOps** | Production deployment on Render, API URL configuration, `.env.example` setup |

<details>
<summary>📝 Commit History</summary>

| Commit | Changes |
|--------|---------|
| `Fix Google OAuth block, add translation logging and select account prompts` | 68 files · +5,712 |
| `Fix skin predictor 400 upload error and add full dynamic translation logic` | 5 files · +604 |
| `Enhance skin disease prediction error output` | 1 file · +2 |
| `Add .env.example for React frontend configurations` | 1 file · +4 |
| `Optimize loading times, update ML predictor URLs, translate dynamic results, add doctor lang selector` | 106 files · +23,258 |
| `Update API base URL to production Render server` | 1 file · +1 |
| `Implement Google OAuth, Multilingual translation, and UI cleanups` | 352 files · +28,639 |
| `refactor: update network configurations, database binding, and add patient/doctor features` | 70 files · +7,332 |

</details>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for better healthcare**

*MediLink — Because your health data should work for you.*

</div>
]]>
