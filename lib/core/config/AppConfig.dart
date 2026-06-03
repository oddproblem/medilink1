class AppConfig {
  // Points to local backend server. For physical USB devices, run `adb reverse tcp:5000 tcp:5000`
  static const String baseUrl = "http://127.0.0.1:5000/api/v1";
  // Remote production server:
  // static const String baseUrl = "https://newmediback.onrender.com/api/v1";
}
