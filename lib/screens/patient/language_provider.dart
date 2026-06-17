import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider with ChangeNotifier {
  LanguageProvider([dynamic apiService]) : _apiService = apiService {
    _loadFromCache();
  }

  final dynamic _apiService;

  String _selectedLanguage = 'en';
  bool _isTranslating = false;
  Map<String, String> _activeTranslations = const {};

  final List<Map<String, String>> supportedLanguages = const [
    {'value': 'en', 'label': 'English'},
    {'value': 'hi', 'label': 'Hindi'},
    {'value': 'ml', 'label': 'Malayalam'},
    {'value': 'bn', 'label': 'Bengali'},
    {'value': 'mr', 'label': 'Marathi'},
    {'value': 'ta', 'label': 'Tamil'},
    {'value': 'te', 'label': 'Telugu'},
    {'value': 'as', 'label': 'Assamese'},
    {'value': 'bho', 'label': 'Bhojpuri'},
    {'value': 'doi', 'label': 'Dogri'},
    {'value': 'gu', 'label': 'Gujarati'},
    {'value': 'kn', 'label': 'Kannada'},
    {'value': 'kok', 'label': 'Konkani'},
    {'value': 'mai', 'label': 'Maithili'},
    {'value': 'mni-Mtei', 'label': 'Meiteilon'},
    {'value': 'ne', 'label': 'Nepali'},
    {'value': 'or', 'label': 'Odia'},
    {'value': 'pa', 'label': 'Punjabi'},
    {'value': 'sa', 'label': 'Sanskrit'},
    {'value': 'sd', 'label': 'Sindhi'},
    {'value': 'ur', 'label': 'Urdu'},
    {'value': 'fr', 'label': 'French'},
    {'value': 'es', 'label': 'Spanish'},
    {'value': 'de', 'label': 'German'},
    {'value': 'zh', 'label': 'Chinese'},
    {'value': 'ar', 'label': 'Arabic'},
    {'value': 'ru', 'label': 'Russian'},
    {'value': 'ja', 'label': 'Japanese'},
    {'value': 'pt', 'label': 'Portuguese'},
  ];

  String get selectedLanguage => _selectedLanguage;
  bool get isTranslating => _isTranslating;

  Future<void> _loadFromCache() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedLanguage = prefs.getString('selectedLanguage') ??
        prefs.getString('preferredLanguage');

    if (cachedLanguage == null || cachedLanguage == _selectedLanguage) return;

    _selectedLanguage = cachedLanguage;
    await _loadStaticTranslations(cachedLanguage, notifyWhenDone: true);
  }

  Future<void> setLanguage(String langCode) async {
    if (langCode == _selectedLanguage) return;

    _selectedLanguage = langCode;
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.setString('selectedLanguage', langCode),
      prefs.setString('preferredLanguage', langCode),
    ]);

    await _loadStaticTranslations(langCode, notifyWhenDone: true);
  }

  Future<void> _loadStaticTranslations(
    String langCode, {
    bool notifyWhenDone = false,
  }) async {
    if (langCode == 'en') {
      _activeTranslations = const {};
      _isTranslating = false;
      if (notifyWhenDone) notifyListeners();
      return;
    }

    _isTranslating = true;
    if (notifyWhenDone) notifyListeners();

    try {
      final raw = await rootBundle.loadString('translations/$langCode.json');
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        _activeTranslations = decoded.map(
          (key, value) => MapEntry(key.toString(), value?.toString() ?? ''),
        );
      } else {
        _activeTranslations = const {};
      }
    } catch (_) {
      _activeTranslations = const {};
    } finally {
      _isTranslating = false;
      if (notifyWhenDone) notifyListeners();
    }
  }

  String t(
    String key, [
    String? fallback,
    Map<String, Object?> params = const {},
  ]) {
    final lookupKey = _keyAliases[key] ?? key;
    var text = _selectedLanguage == 'en'
        ? null
        : _activeTranslations[lookupKey] ?? _activeTranslations[key];

    text ??= _baseTexts[lookupKey] ?? _baseTexts[key] ?? fallback ?? key;

    if (params.isNotEmpty) {
      params.forEach((paramKey, value) {
        text = text!.replaceAll('{{$paramKey}}', value?.toString() ?? '');
        text = text!.replaceAll('{{ $paramKey }}', value?.toString() ?? '');
      });
    }

    return text!;
  }

  Future<List<String>> translateTexts(
    List<String> texts, {
    String? targetLanguage,
  }) async {
    final target = targetLanguage ?? _selectedLanguage;
    if (target == 'en' || texts.isEmpty) return texts;

    try {
      final translated = await _apiService?.translateTexts(texts, target);
      if (translated is List<String> && translated.length == texts.length) {
        return translated;
      }
    } catch (_) {
      // Dynamic translation is a best-effort enhancement. Static UI strings
      // should remain usable even if the backend translator is offline.
    }

    return texts;
  }

  static const Map<String, String> _keyAliases = {
    'Get Started': 'getStarted',
    'Sign In': 'signIn',
    'Patient Sign Up': 'patientSignUpTitle',
    'KYC via DigiLocker': 'step1Title',
    'Start Digilocker': 'startDigilocker',
    'Health Trends': 'healthTrends',
    'Health Summary': 'healthSummary',
    'Add Daily Reading': 'addDailyReading',
    'Save Reading': 'saveReading',
    'Current Medicines': 'currentMedicines',
    'Prescriptions Stored': 'prescriptionsStored',
    'Doctor Sign In': 'doctorSignIn',
    'Patient Sign In': 'patientSignIn',
  };

  static const Map<String, String> _baseTexts = {
    'welcomeTitle': 'Welcome to SwiftMediLink',
    'welcomeSubtitle': 'Your Health, Connected.',
    'getStarted': 'Get Started',
    'SwiftMedilink': 'SwiftMediLink',
    'Swift way to manage patient records':
        'Swift way to manage patient records',
    'landingTitle': 'SwiftMediLink',
    'doctorSignIn': 'Doctor Sign In',
    'patientSignIn': 'Patient Sign In',
    'heroTag': 'SwiftMediLink - Fast, Secure Patient Transfers',
    'heroHeading': 'Medical Records Ready Before Arrival',
    'heroDesc':
        'With Aadhaar verification and AI-powered record extraction, doctors receive clean, actionable data before the stretcher arrives.',
    'signIn': 'Sign in',
    'statRegistered': 'Registered',
    'statTreating': 'Being Treated',
    'statDischarged': 'Discharged',
    'footerSlogan':
        'Smarter Care Journeys - from diagnosis to treatment, every step powered by connected records.',
    'footerLangs':
        'Multilingual: Hindi, Bengali, Tamil, Malayalam, and English',
    'patientDashboardTitle': 'SwiftMediLink - Patient',
    'logout': 'Log out',
    'servicesHub': 'Services & Emergency Hub',
    'sosEmergency': 'SOS Emergency',
    'sosEmergencyDesc': 'Assistance & alerts',
    'prescriptionOcr': 'Prescription OCR',
    'prescriptionOcrDesc': 'Scan & extract',
    'medicationSummary': 'Medication Summary',
    'medicationSummaryDesc':
        'Review medicines extracted from uploaded prescriptions.',
    'outbreakHotspots': 'Outbreak Hotspots',
    'outbreakHotspotsDesc': 'Track spread',
    'pdfHealthReport': 'PDF Health Report',
    'pdfHealthReportDesc': 'Email medical history',
    'skinPredictor': 'Skin Predictor',
    'skinPredictorDesc': 'AI skin scan',
    'symptomPredictor': 'Symptom Predictor',
    'symptomPredictorDesc': 'AI symptom scan',
    'healthTrends': 'Health Trends',
    'viewLogs': 'View Logs',
    'hospitalVisits': 'Hospital Visits',
    'prescriptionsStored': 'Prescriptions Stored',
    'healthSummary': 'Health Summary',
    'noSummary': 'No summary available.',
    'regenerateSummary': 'Regenerate Summary',
    'seeLess': 'See Less',
    'seeMore': 'See More',
    'addDailyReading': 'Add Daily Reading',
    'systolic': 'Systolic',
    'diastolic': 'Diastolic',
    'systolicBP': 'Systolic BP',
    'diastolicBP': 'Diastolic BP',
    'weight': 'Weight',
    'weightKg': 'Weight (kg)',
    'pulse': 'Pulse',
    'pulseRate': 'Pulse Rate',
    'saveReading': 'Save Reading',
    'noReadingsForChart': 'No readings to display in chart.',
    'currentMedicines': 'Current Medicines',
    'noCurrentMedicines':
        'No active medicines. Prescriptions added by your doctor will appear here.',
    'pastMedicines': 'Past Medicines',
    'noPastMedicines': 'No past medicines found.',
    'markAsPast': 'Mark as Past',
    'markAsCurrent': 'Mark as Current',
    'diseaseHistory': 'Disease History',
    'noHistoryDetails': 'No details available',
    'patientNotes': 'Patient Notes',
    'noNotes': 'No notes have been added yet.',
    'notesHint': 'Write your symptoms or notes here...',
    'saveNote': 'Save Note',
    'removeTooltip': 'Remove',
    'deleteNoteTooltip': 'Delete Note',
    'deleteNoteTitle': 'Delete Note',
    'deleteNoteConfirm':
        'Are you sure you want to delete this note? This action cannot be undone.',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'editNote': 'Edit Note',
    'editingNote': 'Editing note...',
    'cancelEdit': 'Cancel Edit',
    'saveChanges': 'Save Changes',
    'prescribedMedicines': 'Prescribed Medicines',
    'noPrescribed':
        'No prescribed medicines yet. Consult your doctor for prescriptions.',
    'Ask History, Medicines etc': 'Ask history, medicines, and more',
    'Ask Ai': 'Ask AI',
    'Type your query here...': 'Type your query here...',
    'aiChatHint':
        'Ask a specific question about this patient history, medications, or vitals.',
    'newMedicineHint': 'New medicine name...',
    'addPrescriptionTooltip': 'Add Prescription',
    'doctorNotesHint': 'Write notes or observations here...',
    'aiChatInputHint': 'Type your question...',
    'markAsPrescribed': 'Mark as Prescribed',
    'noIllnessName': 'No illness name provided',
    'noNoteContent': 'No content',
    'patientsUnderTreatment': 'Patients Under Treatment',
    'patientSignUpTitle': 'Patient Sign Up',
    'step1Title': 'Step 1: Verify your identity',
    'step1Desc': 'We use DigiLocker to securely verify your Aadhaar details.',
    'startDigilocker': 'Start DigiLocker Authentication',
    'step2Title': 'Step 2: Complete Registration',
    'emailHint': 'Enter your email',
    'passwordHint': 'Create a password',
    'createAccount': 'Create Account',
    'processPrescription': 'Process Prescription',
    'newPrescriptionScan': 'New Prescription Scan',
    'newPrescriptionScanDesc':
        'Upload or capture a prescription image to automatically extract medicines.',
    'noPrescriptionSelected': 'No prescription selected',
    'takePhotoOrUpload': 'Take a photo or upload from gallery',
    'takePhoto': 'Take Photo',
    'uploadImage': 'Upload Image',
    'scanAndExtract': 'Scan & Extract',
    'imageSelected': 'Image selected successfully.',
    'selectPrescriptionFirst':
        'Please select or capture a prescription image first.',
    'submittingPrescription': 'Submitting prescription file...',
    'processingStarted': 'OCR processing started. Extracting text...',
    'prescriptionAnalyzed': 'Prescription successfully analyzed.',
    'backgroundProcessing': 'Background processing...',
    'extractionResults': 'Extraction Results',
    'sourceFile': 'Source File',
    'imagePreviewUnavailable': 'Image preview unavailable',
    'extractedMedicines': 'Extracted Medicines',
    'medicine': 'Medicine',
    'medicineName': 'Medicine Name',
    'name': 'Name',
    'dosage': 'Dosage',
    'frequency': 'Frequency',
    'duration': 'Duration',
    'instructions': 'Instructions',
    'noMedicinesFound': 'No medicines found.',
    'viewRawExtractedText': 'View Raw Extracted Text',
    'noTextExtracted': 'No text extracted.',
    'ocrScanHistory': 'OCR Scan History',
    'noPreviousScans': 'No previous prescription scans found.',
    'scanSuccessful': 'Scan Successful',
    'scanFailed': 'Scan Failed',
    'view': 'View',
    'status': 'Status',
    'uploaded': 'Uploaded',
    'processing': 'Processing',
    'completed': 'Completed',
    'error': 'Error',
    'totalPrescriptions': 'Total Prescriptions',
    'completedPrescriptions': 'Completed Prescriptions',
    'totalMedicines': 'Total Medicines',
    'processNewPrescription': 'Process New Prescription',
    'uploadedPrescriptionGroups': 'Uploaded Prescription Groups',
    'noMedicineSummary':
        'No extracted medicines yet. Process a prescription to build your summary.',
    'retry': 'Retry',
    'backToDashboard': 'Back to Dashboard',
    'patient': 'Patient',
    'age': 'Age',
    'generalPhysician': 'General Physician',
    'signature': '--- Signature ---',
    'years': 'years',
  };
}
