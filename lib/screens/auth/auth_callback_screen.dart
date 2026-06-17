import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/ApiService.dart';

class AuthCallbackScreen extends StatefulWidget {
  const AuthCallbackScreen({super.key});

  @override
  State<AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends State<AuthCallbackScreen> {
  @override
  void initState() {
    super.initState();
    _handleAuthCallback();
  }

  Future<void> _handleAuthCallback() async {
    final apiService = context.read<ApiService>();
    final uri = Uri.base;
    final token = uri.queryParameters['token'];
    final patientId = uri.queryParameters['patientId'];

    if (token != null && patientId != null) {
      try {
        await apiService.saveOAuthSession(token, patientId);
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/dashboard/patient');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to complete login: $e')),
          );
          Navigator.pushReplacementNamed(context, '/auth/patient');
        }
      }
    } else {
      if (mounted) {
        // If query parameters are missing, redirect to welcome screen
        Navigator.pushReplacementNamed(context, '/');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Completing Sign-In...',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
