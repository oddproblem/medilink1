import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/ApiService.dart';
import '../../app_theme.dart';
import '../patient/language_provider.dart';

class DoctorSignUpScreen extends StatefulWidget {
  const DoctorSignUpScreen({super.key});

  @override
  State<DoctorSignUpScreen> createState() => _DoctorSignUpScreenState();
}

class _DoctorSignUpScreenState extends State<DoctorSignUpScreen> {
  final ApiService _apiService = ApiService();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _doctorId = TextEditingController();
  final _licenseNumber = TextEditingController();
  bool _isLoading = false;
  bool _obscure = true;
  Map<String, dynamic>? _verifiedDoctor;

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _doctorId.dispose();
    _licenseNumber.dispose();
    super.dispose();
  }

  Future<void> _verifyDoctor() async {
    final langProvider = context.read<LanguageProvider>();
    if (_doctorId.text.isEmpty || _licenseNumber.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(langProvider.t('Please enter Doctor ID and License Number', 'Please enter Doctor ID and License Number'))),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.verifyDoctor({
        'doctorId': _doctorId.text,
        'licenseNumber': _licenseNumber.text,
      });
      if (res['success'] == true) {
        setState(() {
          _verifiedDoctor = res['doctor'];
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(langProvider.t('verificationSuccess', 'Doctor verified successfully'))),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? langProvider.t('verificationFailed', 'Verification failed'))),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${langProvider.t('verificationFailed', 'Verification failed')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    final langProvider = context.read<LanguageProvider>();
    if (_username.text.isEmpty ||
        _email.text.isEmpty ||
        _password.text.isEmpty ||
        _verifiedDoctor == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(langProvider.t('Please fill all fields and verify doctor', 'Please fill all fields and verify doctor'))),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      await _apiService.registerDoctor({
        'username': _username.text,
        'email': _email.text,
        'password': _password.text,
        'verifiedDoctor': _verifiedDoctor,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(langProvider.t('registrationSuccess', 'Registration successful! Please sign in.'))),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${langProvider.t('registrationFailed', 'Registration failed')}: $e')),
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
        title: Text(langProvider.t('doctorRegistration', 'Doctor Registration')),
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
                      // Doctor Icon
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
                        langProvider.t('doctorRegistration', 'Doctor Registration'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        langProvider.t('verifyIdentity', 'Verify your identity to register.'),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 28),

                      if (_verifiedDoctor == null) ...[
                        // Step 1: Verification Form
                        TextField(
                          controller: _doctorId,
                          decoration: InputDecoration(
                            hintText: langProvider.t('nmcDoctorId', 'NMC Doctor ID / Doctor ID'),
                            prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.success),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _licenseNumber,
                          decoration: InputDecoration(
                            hintText: langProvider.t('registrationNumber', 'License / Registration Number'),
                            prefixIcon: const Icon(Icons.description_outlined, color: AppTheme.success),
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _verifyDoctor,
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
                                : Text(langProvider.t('verifyIdentityButton', 'Verify Identity')),
                          ),
                        ),
                      ] else ...[
                        // Step 2: Account details creation Form
                        Card(
                          color: Colors.green.shade50,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: BorderSide(color: Colors.green.shade200),
                          ),
                          child: ListTile(
                            leading: const Icon(Icons.check_circle, color: Colors.green),
                            title: Text(_verifiedDoctor!['name'] ?? 'Doctor Verified'),
                            subtitle: Text('${_verifiedDoctor!['specialty'] ?? ''} • ${_verifiedDoctor!['hospital'] ?? ''}'),
                          ),
                        ),
                        const SizedBox(height: 24),
                        TextField(
                          controller: _username,
                          decoration: InputDecoration(
                            hintText: langProvider.t('chooseUsername', 'Choose Username'),
                            prefixIcon: const Icon(Icons.person_outline, color: AppTheme.success),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: langProvider.t('emailForLogin', 'Email Address'),
                            prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.success),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _password,
                          obscureText: _obscure,
                          decoration: InputDecoration(
                            hintText: langProvider.t('createPassword', 'Create Password'),
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
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _register,
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
                                : Text(langProvider.t('createAccount', 'Create Account')),
                          ),
                        ),
                      ],
                      const Divider(height: 32, color: Color(0xFFE2E8F0)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            langProvider.t('alreadyAccount', 'Already have an account?'),
                            style: const TextStyle(color: AppTheme.textMuted),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () => Navigator.pushReplacementNamed(
                              context,
                              '/auth/doctor',
                            ),
                            child: Text(
                              langProvider.t('signIn', 'Sign In'),
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
