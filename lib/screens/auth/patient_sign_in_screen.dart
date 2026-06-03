import 'package:flutter/material.dart';
import '../../core/network/ApiService.dart';
import '../../app_theme.dart';

class PatientSignInScreen extends StatefulWidget {
  const PatientSignInScreen({super.key});

  @override
  State<PatientSignInScreen> createState() => _PatientSignInScreenState();
}

class _PatientSignInScreenState extends State<PatientSignInScreen> {
  final ApiService _apiService = ApiService();
  final _aadhaar = TextEditingController();
  final _name = TextEditingController();
  final _password = TextEditingController();
  bool _isLoading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _aadhaar.dispose();
    _name.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_aadhaar.text.isEmpty || _name.text.isEmpty || _password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Aadhaar, name and password')),
      );
      return;
    }

      setState(() => _isLoading = true);
      try {
        await _apiService.login(_aadhaar.text, _name.text, _password.text);
        Navigator.pushNamed(context, '/dashboard/patient');
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: $e')),
        );
      } finally {
        setState(() => _isLoading = false);
      }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Patient Sign In')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _aadhaar,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: 'Aadhaar Number'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(hintText: 'Name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    hintText: 'Password',
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(
                          _obscure ? Icons.visibility : Icons.visibility_off),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _login,
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Sign In'),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _aadhaar.text = '3395';
                      _name.text = 'Priyanshu Upadhyay';
                      _password.text = 'pass';
                    });
                  },
                  icon: const Icon(Icons.flash_on, color: AppTheme.accent),
                  label: const Text('Autofill Demo Account'),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pushReplacementNamed(
                          context, '/auth/patient/sign-up'),
                      child: const Text('Sign Up'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
