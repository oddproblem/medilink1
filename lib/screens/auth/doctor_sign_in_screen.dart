import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/ApiService.dart';
import '../../app_theme.dart';
import '../patient/language_provider.dart';

class DoctorSignInScreen extends StatefulWidget {
  const DoctorSignInScreen({super.key});

  @override
  State<DoctorSignInScreen> createState() => _DoctorSignInScreenState();
}

class _DoctorSignInScreenState extends State<DoctorSignInScreen> {
  final ApiService _apiService = ApiService();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final langProvider = context.read<LanguageProvider>();
    if (_email.text.isEmpty || _password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(langProvider.t('Please enter email and password', 'Please enter email and password'))),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await _apiService.doctorLogin({
        "email": _email.text,
        "password": _password.text,
      });
      if (res['success'] == true) {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/dashboard/doctor');
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '${langProvider.t('loginFailed', 'Login failed')}: ${res['message'] ?? 'Unknown error'}',
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${langProvider.t('loginFailed', 'Login failed')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text(langProvider.t('doctorSignIn')),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primary.withOpacity(0.08),
              AppTheme.background,
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                elevation: 4,
                shadowColor: Colors.black.withOpacity(0.05),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 36.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Brand/Doctor Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.local_hospital_rounded,
                          size: 48,
                          color: AppTheme.success,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        langProvider.t('doctorPortal', 'Doctor Portal'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        langProvider.t('welcomeBack', 'Welcome back! Sign in.'),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Input Fields
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: langProvider.t('email', 'Email Address'),
                          prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.success),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _password,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          hintText: langProvider.t('password', 'Password'),
                          prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.success),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _obscure = !_obscure),
                            icon: Icon(
                              _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.success,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  langProvider.t('signIn', 'Sign In'),
                                  style: const TextStyle(fontSize: 16),
                                ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Autofill Link
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _email.text = 'doctor@gmail.com';
                            _password.text = 'pass';
                          });
                        },
                        icon: const Icon(Icons.flash_on, color: AppTheme.accent, size: 18),
                        label: const Text(
                          'Autofill Demo Account',
                          style: TextStyle(color: AppTheme.accent, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Divider(height: 32, color: Color(0xFFE2E8F0)),

                      // Sign Up Redirect
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            langProvider.t('Don\'t have an account?', 'Don\'t have an account?'),
                            style: const TextStyle(color: AppTheme.textMuted),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () => Navigator.pushReplacementNamed(
                              context,
                              '/auth/doctor/sign-up',
                            ),
                            child: Text(
                              langProvider.t('noAccount', 'Sign Up'),
                              style: const TextStyle(
                                color: AppTheme.success,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
