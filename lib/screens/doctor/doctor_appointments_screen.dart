import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../app_theme.dart';
import '../../core/models/Appointment.dart';
import '../../core/network/ApiService.dart';
import '../patient/language_provider.dart';

class DoctorAppointmentsScreen extends StatefulWidget {
  const DoctorAppointmentsScreen({super.key});

  @override
  State<DoctorAppointmentsScreen> createState() =>
      _DoctorAppointmentsScreenState();
}

class _DoctorAppointmentsScreenState extends State<DoctorAppointmentsScreen> {
  final ApiService _apiService = ApiService();
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _apiService.init();
      final doctor = _apiService.currentUser;
      if (doctor == null) {
        throw ApiException(401, 'Please sign in again to view appointments.');
      }
      final appointments = await _apiService.getDoctorAppointments(doctor.id);
      if (!mounted) return;
      setState(() => _appointments = appointments);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(Appointment appointment, String status) async {
    final lang = context.read<LanguageProvider>();
    try {
      await _apiService.updateAppointmentStatus(appointment.id, status);
      await _loadAppointments();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${lang.t('status', 'Status')} marked $status.')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update appointment: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('upcomingAppointmentsDoctor', 'Today and upcoming')),
        centerTitle: true,
      ),
      body: RefreshIndicator(onRefresh: _loadAppointments, child: _buildBody(lang)),
    );
  }

  Widget _buildBody(LanguageProvider lang) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 80),
          const Icon(
            Icons.event_busy_outlined,
            size: 56,
            color: AppTheme.textMuted,
          ),
          const SizedBox(height: 16),
          Text(_error!, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Center(
            child: OutlinedButton(
              onPressed: _loadAppointments,
              child: Text(lang.t('retry', 'Try again')),
            ),
          ),
        ],
      );
    }
    if (_appointments.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 80),
          const Icon(
            Icons.event_available_outlined,
            size: 56,
            color: AppTheme.primary,
          ),
          const SizedBox(height: 16),
          Text(lang.t('noUpcomingAppointments', 'No scheduled appointments.'), textAlign: TextAlign.center),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: _appointments.length,
      itemBuilder: (context, index) {
        final appointment = _appointments[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const CircleAvatar(child: Icon(Icons.person_outline)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appointment.patientName ?? lang.t('patient', 'Patient consultation'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            DateFormat(
                              'EEE, d MMM y - h:mm a',
                            ).format(appointment.appointmentDate),
                            style: const TextStyle(color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(appointment.reason),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => _updateStatus(appointment, 'completed'),
                      icon: const Icon(Icons.check, size: 18),
                      label: Text(lang.t('markAsCompleted', 'Complete')),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => _updateStatus(appointment, 'cancelled'),
                      icon: const Icon(Icons.close, size: 18),
                      label: Text(lang.t('cancelAppointment', 'Cancel')),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
