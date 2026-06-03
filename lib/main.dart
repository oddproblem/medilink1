import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// Core services and providers
import 'core/network/ApiService.dart';
import 'screens/patient/language_provider.dart';

// App theme
import 'app_theme.dart';

// Screens
import 'screens/welcome_screen.dart';
import 'screens/landing_screen.dart';
import 'screens/auth/doctor_sign_in_screen.dart';
import 'screens/auth/patient_sign_in_screen.dart';
import 'screens/auth/doctor_sign_up_screen.dart';
import 'screens/auth/patient_sign_up_screen.dart';
import 'screens/doctor/doctor_dashboard_screen.dart';
import 'screens/doctor/doctor_appointments_screen.dart';
import 'screens/patient/patient_dashboard_screen.dart';
import 'screens/patient/patient_appointments_screen.dart';
import 'screens/patient/ocr_scan_screen.dart';
import 'screens/patient/disease_hotspots_screen.dart';
import 'screens/patient/emergency_dashboard_screen.dart';
import 'screens/patient/disease_prediction_screen.dart';
import 'screens/patient/symptom_prediction_screen.dart';

void main() {
  // Create a single ApiService instance to be shared across the app.
  final apiService = ApiService();

  runApp(
    MultiProvider(
      providers: [
        // Provide the ApiService instance so it can be accessed if needed.
        Provider(create: (_) => apiService),
        // Create the LanguageProvider, giving it the ApiService instance.
        // The provider will now automatically load cached language settings on startup.
        ChangeNotifierProvider(create: (_) => LanguageProvider(apiService)),
      ],
      child: const MediLinkApp(),
    ),
  );
}

class MediLinkApp extends StatelessWidget {
  const MediLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SwiftMediLink',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme.copyWith(
        textTheme: GoogleFonts.interTextTheme(AppTheme.lightTheme.textTheme),
      ),
      // The WelcomeScreen is now the first screen the user sees.
      initialRoute: '/',
      routes: {
        // The root route now points to the new WelcomeScreen.
        '/': (_) => const WelcomeScreen(),
        // The original landing page is moved to '/landing'.
        '/landing': (_) => const LandingScreen(),
        '/auth/doctor': (_) => const DoctorSignInScreen(),
        '/auth/patient': (_) => const PatientSignInScreen(),
        '/auth/doctor/sign-up': (_) => const DoctorSignUpScreen(),
        '/auth/patient/sign-up': (_) => const PatientSignUpScreen(),
        '/dashboard/doctor': (_) => const DoctorDashboard(),
        '/dashboard/patient': (_) => const PatientDashboardScreen(),
        '/appointments/doctor': (_) => const DoctorAppointmentsScreen(),
        '/appointments/patient': (_) => const PatientAppointmentsScreen(),
        '/ocr-scan': (_) => const OcrScanScreen(),
        '/hotspots': (_) => const DiseaseHotspotsScreen(),
        '/emergency': (_) => const EmergencyDashboardScreen(),
        '/disease-prediction': (_) => const DiseasePredictionScreen(),
        '/symptom-prediction': (_) => const SymptomPredictionScreen(),
      },
    );
  }
}
