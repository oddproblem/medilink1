import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/AppConfig.dart';
import '../models/Appointment.dart';
import '../models/DailyReading.dart';
import '../models/Doctor.dart';
import '../models/HealthSummary.dart';
import '../models/History.dart';
import '../models/Note.dart';
import '../models/Patient.dart';
import '../models/Prescription.dart';
import '../models/Report.dart';
import '../models/User.dart';
import '../models/disease_history.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic payload;

  ApiException(this.statusCode, this.message, [this.payload]);

  @override
  String toString() => message;
}

class ApiService {
  final String _baseUrl = AppConfig.baseUrl;
  String? _token;
  String? _currentRole;
  User? _currentUser;
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    final prefs = await SharedPreferences.getInstance();
    _token = _normalizeToken(prefs.getString('token'));
    _currentRole = prefs.getString('userRole');

    final userId = prefs.getString('userId');
    final userName = prefs.getString('userName');
    if (userId != null && userName != null) {
      _currentUser = User(id: userId, username: userName);
    }

    _initialized = true;
  }

  User? get currentUser => _currentUser;
  String? get currentRole => _currentRole;
  bool get isAuthenticated => _token != null && _currentUser != null;

  String? _normalizeToken(String? token) {
    if (token == null) return null;
    return token
        .replaceFirst(RegExp(r'^Bearer\s+', caseSensitive: false), '')
        .trim();
  }

  Future<void> _saveSession(String token, User user, String role) async {
    final prefs = await SharedPreferences.getInstance();
    final normalizedToken = _normalizeToken(token)!;

    await Future.wait([
      prefs.setString('token', normalizedToken),
      prefs.setString('userId', user.id),
      prefs.setString('userName', user.username),
      prefs.setString('userRole', role),
    ]);

    _token = normalizedToken;
    _currentUser = user;
    _currentRole = role;
    _initialized = true;
  }

  Future<void> saveOAuthSession(String token, String patientId) async {
    final prefs = await SharedPreferences.getInstance();
    final normalizedToken = _normalizeToken(token)!;
    await prefs.setString('token', normalizedToken);
    _token = normalizedToken;
    _initialized = true;

    // Fetch patient details to get the name
    final patient = await getPatientById(patientId);

    // Save full session
    await _saveSession(token, User(id: patientId, username: patient.name), 'patient');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.remove('token'),
      prefs.remove('userId'),
      prefs.remove('userName'),
      prefs.remove('userRole'),
    ]);
    _token = null;
    _currentUser = null;
    _currentRole = null;
    _initialized = true;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    await init();
    final uri = Uri.parse('$_baseUrl$endpoint');
    final encodedBody = body == null ? null : jsonEncode(body);

    late final http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: _headers);
        break;
      case 'POST':
        response = await http.post(uri, headers: _headers, body: encodedBody);
        break;
      case 'PUT':
        response = await http.put(uri, headers: _headers, body: encodedBody);
        break;
      case 'PATCH':
        response = await http.patch(uri, headers: _headers, body: encodedBody);
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: _headers, body: encodedBody);
        break;
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }

    return _processResponse(response);
  }

  dynamic _processResponse(http.Response response) {
    dynamic payload;
    if (response.body.isNotEmpty) {
      try {
        payload = jsonDecode(response.body);
        if (payload is String) {
          try {
            payload = jsonDecode(payload);
          } catch (_) {
            // Some upstream services return plain text in a JSON string.
          }
        }
      } catch (_) {
        payload = response.body;
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      var message = 'Request failed with status ${response.statusCode}';
      if (payload is Map) {
        message = (payload['message'] ??
                payload['error'] ??
                payload['details'] ??
                message)
            .toString();
      } else if (payload is String && payload.trim().isNotEmpty) {
        message = payload;
      }
      throw ApiException(response.statusCode, message, payload);
    }

    return payload;
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    throw ApiException(500, 'Unexpected response format from server', value);
  }

  List<dynamic> _asList(dynamic value) {
    if (value is List) return value;
    if (value is Map && value['data'] is List) return value['data'] as List;
    if (value is Map && value['patients'] is List) {
      return value['patients'] as List;
    }
    return const [];
  }

  Future<dynamic> initiateDigilocker(Map<String, dynamic> data) =>
      _request('POST', '/auth/initiate-digilocker', body: data);

  Future<dynamic> getDigilockerData(Map<String, dynamic> data) =>
      _request('POST', '/auth/get-digilocker-data', body: data);

  Future<dynamic> setPasswordAndRegister(Map<String, dynamic> data) =>
      _request('POST', '/auth/set-password', body: data);

  Future<Map<String, dynamic>> login(
    String uid,
    String name,
    String password,
  ) async {
    final response = _asMap(
      await _request(
        'POST',
        '/auth/login',
        body: {'uid': uid, 'name': name, 'password': password},
      ),
    );
    final userData = _asMap(response['user']);
    await _saveSession(
      response['token'].toString(),
      User(
        id: userData['id'].toString(),
        username: userData['name'].toString(),
      ),
      'patient',
    );
    return response;
  }

  Future<dynamic> verifyDoctor(Map<String, dynamic> data) =>
      _request('POST', '/doctors/verify-doctor', body: data);

  Future<dynamic> registerDoctor(Map<String, dynamic> data) =>
      _request('POST', '/doctors/register', body: data);

  Future<Map<String, dynamic>> doctorLogin(Map<String, dynamic> data) async {
    final response = _asMap(
      await _request('POST', '/doctors/login', body: data),
    );
    final doctor = _asMap(response['doctor']);
    await _saveSession(
      response['token'].toString(),
      User(id: doctor['id'].toString(), username: doctor['name'].toString()),
      'doctor',
    );
    return response;
  }

  Future<List<Doctor>> getDoctors() async {
    final response = await _request('GET', '/doctors');
    return _asList(
      response,
    ).map((item) => Doctor.fromJson(_asMap(item))).toList();
  }

  Future<List<Patient>> getPatients() async {
    final response = await _request('GET', '/patients');
    return _asList(
      response,
    ).map((item) => Patient.fromJson(_asMap(item))).toList();
  }

  Future<Patient> getPatientById(String id) async {
    return Patient.fromJson(_asMap(await _request('GET', '/patients/$id')));
  }

  Future<List<Patient>> searchPatients(String query) async {
    final encoded = Uri.encodeQueryComponent(query);
    final response = await _request('GET', '/patients/search?q=$encoded');
    return _asList(
      response,
    ).map((item) => Patient.fromJson(_asMap(item))).toList();
  }

  Future<Map<String, dynamic>> getPatientStatistics() async {
    final response = _asMap(await _request('GET', '/patients/statistics'));
    if (response['statistics'] is Map) return _asMap(response['statistics']);
    return response;
  }

  Future<Map<String, dynamic>> getPatientAnalytics() async {
    return _asMap(await _request('GET', '/patients/analytics/registrations'));
  }

  Future<List<Patient>> getPatientsByStatus(String status) async {
    final encoded = Uri.encodeQueryComponent(status);
    final response = await _request('GET', '/patients?status=$encoded');
    return _asList(
      response,
    ).map((item) => Patient.fromJson(_asMap(item))).toList();
  }

  Future<List<Prescription>> getPrescriptions(String patientId) async {
    try {
      final response = await _request(
        'GET',
        '/prescriptions/patient/$patientId',
      );
      return _asList(
        response,
      ).map((item) => Prescription.fromJson(_asMap(item))).toList();
    } on ApiException catch (error) {
      if (error.statusCode == 404) return [];
      rethrow;
    }
  }

  Future<Prescription> createPrescription(Map<String, dynamic> data) async {
    return Prescription.fromJson(
      _asMap(await _request('POST', '/prescriptions', body: data)),
    );
  }

  Future<Prescription> updatePrescription(
    String id,
    Map<String, dynamic> data,
  ) async {
    return Prescription.fromJson(
      _asMap(await _request('PUT', '/prescriptions/$id', body: data)),
    );
  }

  Future<dynamic> updateMedicineStatus(
    String prescriptionId,
    String medicineId,
    Map<String, dynamic> data,
  ) async {
    try {
      return await _request(
        'PATCH',
        '/prescriptions/medicines/$prescriptionId/$medicineId/status',
        body: data,
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 405) {
        // Fallback to older PUT route structure or method
        return await _request(
          'PUT',
          '/prescriptions/medicines/$prescriptionId/$medicineId/status',
          body: data,
        );
      }
      rethrow;
    }
  }

  Future<List<DiseaseHistory>> getPatientHistory(String patientId) async {
    final response = await _request('GET', '/history/patient/$patientId');
    return _asList(
      response,
    ).map((item) => DiseaseHistory.fromJson(_asMap(item))).toList();
  }

  Future<History> createDiseaseHistory(Map<String, dynamic> data) async {
    return History.fromJson(
      _asMap(await _request('POST', '/history', body: data)),
    );
  }

  Future<History> updateDiseaseHistory(
    String id,
    Map<String, dynamic> data,
  ) async {
    return History.fromJson(
      _asMap(await _request('PUT', '/history/$id', body: data)),
    );
  }

  Future<Map<String, dynamic>> getHistorySummary(String patientId) async {
    return _asMap(await _request('GET', '/history/patient/$patientId/summary'));
  }

  Future<List<DailyReading>> getDailyReadings(String patientId) async {
    final response = await _request('GET', '/readings/patient/$patientId');
    return _asList(
      response,
    ).map((item) => DailyReading.fromJson(_asMap(item))).toList();
  }

  Future<DailyReading> addDailyReading(Map<String, dynamic> data) async {
    return DailyReading.fromJson(
      _asMap(await _request('POST', '/readings', body: data)),
    );
  }

  Future<DailyReading> updateDailyReading(
    String id,
    Map<String, dynamic> data,
  ) async {
    return DailyReading.fromJson(
      _asMap(await _request('PUT', '/readings/$id', body: data)),
    );
  }

  Future<dynamic> deleteDailyReading(String id) =>
      _request('DELETE', '/readings/$id');

  Future<Report> generateReport(Map<String, dynamic> params) async {
    return Report.fromJson(
      _asMap(await _request('POST', '/report/generate', body: params)),
    );
  }

  Future<HealthSummary> generateSummary(Map<String, dynamic> params) async {
    final response = _asMap(
      await _request('POST', '/summary/generate', body: params),
    );
    return HealthSummary.fromJson(
      response['data'] is Map ? _asMap(response['data']) : response,
    );
  }

  Future<HealthSummary?> getSummary(String patientId) async {
    try {
      return HealthSummary.fromJson(
        _asMap(await _request('GET', '/summary/patient/$patientId')),
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<dynamic> queryHealthData(Map<String, dynamic> data) =>
      _request('POST', '/summary/query', body: data);

  Future<List<String>> translateTexts(List<String> texts, String target) async {
    final response = _asMap(
      await _request(
        'POST',
        '/translate',
        body: {'q': texts, 'target': target},
      ),
    );
    final translations = response['translations'];
    if (translations is List) {
      return translations.map((item) => item?.toString() ?? '').toList();
    }
    if (translations is String) return [translations];
    return texts;
  }

  Future<List<Note>> getNotesByPatient(String patientId) async {
    final response = await _request('GET', '/notes/patient/$patientId');
    return _asList(
      response,
    ).map((item) => Note.fromJson(_asMap(item))).toList();
  }

  Future<dynamic> createNote(Map<String, dynamic> data) =>
      _request('POST', '/notes', body: data);

  Future<dynamic> updateNote(String id, Map<String, dynamic> data) =>
      _request('PUT', '/notes/$id', body: data);

  Future<dynamic> deleteNote(String id) => _request('DELETE', '/notes/$id');

  Future<dynamic> restoreNote(String id) =>
      _request('PUT', '/notes/$id/restore', body: const {});

  Future<dynamic> triggerAlert(Map<String, dynamic> data) =>
      _request('POST', '/emergency/alert', body: data);

  Future<AppointmentsBundle> getPatientAppointments(String patientId) async {
    return AppointmentsBundle.fromJson(
      _asMap(await _request('GET', '/appointments/patient/$patientId')),
    );
  }

  Future<List<Appointment>> getDoctorAppointments(String doctorId) async {
    final response = await _request('GET', '/appointments/doctor/$doctorId');
    return _asList(
      response,
    ).map((item) => Appointment.fromJson(_asMap(item))).toList();
  }

  Future<int> getPatientAppointmentCount(String patientId) async {
    final response = _asMap(
      await _request('GET', '/appointments/patient/$patientId/count'),
    );
    return response['count'] is int
        ? response['count'] as int
        : int.tryParse('${response['count']}') ?? 0;
  }

  Future<Appointment> bookAppointment(Map<String, dynamic> data) async {
    return Appointment.fromJson(
      _asMap(await _request('POST', '/appointments', body: data)),
    );
  }

  Future<Appointment> updateAppointmentStatus(
    String appointmentId,
    String status,
  ) async {
    return Appointment.fromJson(
      _asMap(
        await _request(
          'PUT',
          '/appointments/$appointmentId/status',
          body: {'status': status},
        ),
      ),
    );
  }

  // === OCR PRESCRIPTION ENDPOINTS ===
  Future<Map<String, dynamic>> processOcrPrescription(
      String patientId, String fileUrl) async {
    return _asMap(
      await _request(
        'POST',
        '/ocr-prescriptions',
        body: {'patientId': patientId, 'fileUrl': fileUrl},
      ),
    );
  }

  Future<Map<String, dynamic>> uploadOcrPrescription(
      String patientId, String filePath) async {
    await init();
    final uri = Uri.parse('$_baseUrl/ocr-prescriptions');
    final request = http.MultipartRequest('POST', uri);

    // Add headers
    request.headers.addAll({
      if (_token != null) 'Authorization': 'Bearer $_token',
    });

    // Add fields
    request.fields['patientId'] = patientId;

    // Add file
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    return _asMap(_processResponse(response));
  }

  Future<Map<String, dynamic>> getOcrPrescriptionResult(String recordId) async {
    return _asMap(await _request('GET', '/ocr-prescriptions/$recordId'));
  }

  Future<List<dynamic>> getOcrPrescriptionsForPatient(String patientId) async {
    final response =
        await _request('GET', '/ocr-prescriptions/patient/$patientId');
    return _asList(response);
  }

  Future<int> getOcrPrescriptionCount(String patientId) async {
    final response = _asMap(
      await _request('GET', '/ocr-prescriptions/patient/$patientId/count'),
    );
    return response['count'] is int
        ? response['count'] as int
        : int.tryParse('${response['count']}') ?? 0;
  }

  Future<List<dynamic>> getOcrPrescriptionMedicines(String patientId) async {
    final response = await _request(
      'GET',
      '/ocr-prescriptions/patient/$patientId/medicines',
    );
    return _asList(response);
  }

  // === DISEASE HOTSPOTS ENDPOINTS ===
  Future<List<dynamic>> getDiseaseHotspots(String illnessName) async {
    final encoded = Uri.encodeQueryComponent(illnessName);
    final response = await _request('GET', '/hotspots?illnessName=$encoded');
    return _asList(response);
  }

  // === EMERGENCY DASHBOARD ENDPOINTS ===
  Future<Map<String, dynamic>> triggerEmergencyAlert(String patientId) async {
    return _asMap(
      await _request('POST', '/emergency/alert',
          body: {'patientId': patientId}),
    );
  }

  Future<List<dynamic>> getEmergencyContacts(String patientId) async {
    final response =
        await _request('GET', '/emergency-contacts/patient/$patientId');
    return _asList(response);
  }

  Future<Map<String, dynamic>> createEmergencyContact(
      Map<String, dynamic> data) async {
    return _asMap(await _request('POST', '/emergency-contacts', body: data));
  }

  Future<Map<String, dynamic>> deleteEmergencyContact(String id) async {
    return _asMap(await _request('DELETE', '/emergency-contacts/$id'));
  }

  Future<List<dynamic>> getEmergencyDoctors() async {
    final response = await _request('GET', '/emergency-doctors');
    return _asList(response);
  }

  Future<List<dynamic>> getEmergencyHospitals() async {
    final response = await _request('GET', '/emergency-hospitals');
    return _asList(response);
  }

  // === PDF HEALTH REPORT ===
  Future<Map<String, dynamic>> generateHealthReport() async {
    return _asMap(await _request('POST', '/report/generate', body: const {}));
  }
}
