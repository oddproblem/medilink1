import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/config/AppConfig.dart';
import '../../core/network/ApiService.dart';
import '../../app_theme.dart';
import '../patient/language_provider.dart';
import 'oauth_webview_screen.dart';

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
    final langProvider = context.read<LanguageProvider>();
    if (_aadhaar.text.isEmpty || _name.text.isEmpty || _password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(langProvider.t('Please enter Aadhaar, name and password', 'Please enter Aadhaar, name and password'))),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _apiService.login(_aadhaar.text, _name.text, _password.text);
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/dashboard/patient');
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

  Future<void> _loginWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final googleAuthUrl = '${AppConfig.baseUrl}/auth/google';
      const redirectUrl = 'http://localhost:3000/auth';

      if (kIsWeb) {
        // Redirect current browser window
        final uri = Uri.parse(googleAuthUrl);
        await launchUrl(
          uri,
          mode: LaunchMode.platformDefault,
          webOnlyWindowName: '_self',
        );
      } else {
        // Open secure in-app WebView for mobile/desktop
        final result = await Navigator.push<Map<String, String>>(
          context,
          MaterialPageRoute(
            builder: (_) => const OAuthWebViewScreen(
              authorizationUrl: '${AppConfig.baseUrl}/auth/google',
              redirectUrl: redirectUrl,
            ),
          ),
        );

        if (result != null && result['token'] != null && result['patientId'] != null) {
          await _apiService.saveOAuthSession(result['token']!, result['patientId']!);
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/dashboard/patient');
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google Sign-In failed: $e')),
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
        title: Text(langProvider.t('patientSignIn')),
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
                      // Brand/Medical Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.medical_services_rounded,
                          size: 48,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        langProvider.t('welcomeTitle', 'Welcome to SwiftMediLink'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        langProvider.t('welcomeSubtitle', 'Your Health, Connected.'),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Input Fields
                      TextField(
                        controller: _aadhaar,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: langProvider.t('aadhaarNumber', 'Aadhaar Number (UID)'),
                          prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.primary),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _name,
                        decoration: InputDecoration(
                          hintText: langProvider.t('name', 'Full Name'),
                          prefixIcon: const Icon(Icons.person_outline, color: AppTheme.primary),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _password,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          hintText: langProvider.t('password', 'Password'),
                          prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.primary),
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
                      const SizedBox(height: 16),

                      // Google Sign In (OAuth) Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton(
                          onPressed: _isLoading ? null : _loginWithGoogle,
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.grey.shade300),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Image.network(
                                'https://developers.google.com/static/identity/images/g-logo.png',
                                width: 22,
                                height: 22,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(Icons.g_mobiledata, size: 24, color: Colors.blue),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                langProvider.t('signInGoogle', 'Sign In with Google'),
                                style: TextStyle(
                                  color: Colors.grey.shade700,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Autofill Link
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _aadhaar.text = '3395';
                            _name.text = 'Priyanshu Upadhyay';
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
                              '/auth/patient/sign-up',
                            ),
                            child: Text(
                              langProvider.t('noAccount', 'Sign Up'),
                              style: const TextStyle(
                                color: AppTheme.primary,
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
