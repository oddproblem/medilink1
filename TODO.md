# TODO: Implement Medilink Patches

## Flutter Fixes (A.1 - A.5)

### A.1 Robust response processing (ApiService.dart)
- Replace _processResponse with robust implementation that handles empty responses, string-wrapped JSON, and fallbacks.

### A.2 Defensive API wrappers
- Update searchPatients to use defensive pattern handling list or {data:[]} or {patients:[]}.
- Apply same defensive pattern to getPatients, getNotesByPatient, getDailyReadings, getPatientHistory, getPrescriptions, getPatientsByStatus.

### A.3 Add explicit init() to ApiService and ensure callers await it
- ApiService already has init(), ensure screens call it.
- Update doctor_dashboard_screen.dart: await init() in initState before _fetchPatients.
- Update patient_dashboard_screen.dart: already has, but improve user null handling with re-login dialog.
- Update patient_detail_screen.dart: add init() call in initState.

### A.4 Debounce & search (doctor screen)
- Adjust _onSearchChanged debounce to 400ms (already 500, change to 400).
- Ensure mounted check (already has).

### A.5 Patient dashboard fetch logic
- Ensure _fetchPatientData() called after await _apiService.init().
- Change user null handling: if currentUser null after init, show explicit UI message and offer re-login.

### A.6 Add more logging/error transparency
- Add print(e) or debugPrint(e) in all catch blocks that swallow errors.

## Server-side fixes (B.1 - B.4)

### B.1 patientController.searchPatients — return consistent JSON
- Update to return { success: true, data: [...] }.

### B.2 Auth middleware — accept doctor tokens
- Update authMiddleware.js to check for patient or doctor.

### B.3 Use .lean() in Mongoose queries
- Append .lean() to find() calls in controllers.

### B.4 Add logging and a /health route
- Add /api/v1/health route returning {ok: true, timestamp: ...}.

## C. WebView (DigiLocker) — definite fixes
- Replace digilocker_webview_screen.dart with robust implementation.

## D. Make doctor side fully functional
- Ensure auth, search, patient selection work.

## E. Health Summary using AI
- Backend: create summaryController.js with generateSummary endpoint.
- Flutter: ensure generateSummary call works.

## F. Extra improvements
- Consistent API contract {success,data}.
- Centralized error handler.
- Unit tests.
- Offline handling.
- Telemetry.
- Pagination.
- Permissions.
- Audit logs.

## G. Feature Alignment (Server vs Client)
- [x] Client-side Prescription OCR Scan UI: Integrate image selector/camera capture, trigger OCR upload to `/api/v1/ocr-prescriptions/upload`, track processing status, and render parsed prescription items.
- [x] Client-side Disease Outbreak Hotspots Screen: Implement a view to query `/api/v1/hotspots` and display active disease hotspots on a map or card list.
- [x] Client-side Emergency Dashboard: Implement a dedicated Emergency view listing emergency contacts, doctors, and hospitals, with a prominent "Trigger Emergency Alert" button calling `/api/v1/emergency/alert`.
- [x] Client-side PDF Health Reports: Add a "Generate Report" option to patient dashboards to trigger PDF report generation via `/api/v1/report/generate`.

## H. Static Multilingual Localization (Completed)
- [x] Remove dynamic online translation API routes (`/api/v1/translate`) and controllers from the Express backend.
- [x] Create and maintain static localized dictionaries (`_hiTexts`, `_mlTexts`, `_bnTexts`, `_taTexts`, `_teTexts`) offline in the Flutter client.
- [x] Implement local lookup in `LanguageProvider` to instantly translate UI strings on language selection change without network dependencies.
- [x] Clean up redundant duplicate files for `language_provider.dart`.
- [x] Remove dynamic translation wrapper and listeners for AI-generated summaries on patient dashboard (render summaries in their raw English format).

