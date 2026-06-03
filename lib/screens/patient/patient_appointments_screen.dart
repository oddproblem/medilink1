import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../app_theme.dart';
import '../../core/models/Appointment.dart';
import '../../core/models/Doctor.dart';
import '../../core/network/ApiService.dart';

class PatientAppointmentsScreen extends StatefulWidget {
  const PatientAppointmentsScreen({super.key});

  @override
  State<PatientAppointmentsScreen> createState() =>
      _PatientAppointmentsScreenState();
}

class _PatientAppointmentsScreenState extends State<PatientAppointmentsScreen> {
  final ApiService _apiService = ApiService();
  AppointmentsBundle? _appointments;
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
      final patient = _apiService.currentUser;
      if (patient == null) {
        throw ApiException(401, 'Please sign in again to view appointments.');
      }
      final appointments = await _apiService.getPatientAppointments(patient.id);
      if (!mounted) return;
      setState(() => _appointments = appointments);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openBooking() async {
    final booked = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const BookAppointmentScreen()),
    );
    if (booked == true) await _loadAppointments();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Appointments')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openBooking,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Book appointment'),
      ),
      body: RefreshIndicator(onRefresh: _loadAppointments, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
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
              child: const Text('Try again'),
            ),
          ),
        ],
      );
    }

    final appointments = _appointments!;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        _section(
          'Upcoming',
          appointments.openAppointments,
          emptyText:
              'No upcoming appointments. Book a consultation when you need one.',
        ),
        const SizedBox(height: 20),
        _section(
          'Past visits',
          appointments.pastAppointments,
          emptyText: 'Completed and cancelled appointments will appear here.',
        ),
      ],
    );
  }

  Widget _section(
    String title,
    List<Appointment> appointments, {
    required String emptyText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        if (appointments.isEmpty)
          _EmptyCard(text: emptyText)
        else
          ...appointments.map(
            (appointment) => _AppointmentCard(appointment: appointment),
          ),
      ],
    );
  }
}

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _reasonController = TextEditingController();
  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  DateTime? _appointmentDate;
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors() async {
    try {
      final doctors = await _apiService.getDoctors();
      if (!mounted) return;
      setState(() => _doctors = doctors);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not load doctors: $error')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 180)),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 10, minute: 0),
    );
    if (time == null) return;

    setState(() {
      _appointmentDate = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _bookAppointment() async {
    final reason = _reasonController.text.trim();
    if (_selectedDoctor == null || _appointmentDate == null || reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Choose a doctor, date, time, and add a short reason.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _apiService.bookAppointment({
        'doctorId': _selectedDoctor!.id,
        'appointmentDate': _appointmentDate!.toUtc().toIso8601String(),
        'reason': reason,
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Booking failed: $error')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book appointment')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Plan a consultation',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          const Text(
            'Pick a registered doctor and a convenient time. Your upcoming visit will appear on both dashboards.',
            style: TextStyle(color: AppTheme.textMuted, height: 1.5),
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<Doctor>(
            value: _selectedDoctor,
            decoration: const InputDecoration(labelText: 'Doctor'),
            items: _doctors
                .map(
                  (doctor) => DropdownMenuItem(
                    value: doctor,
                    child: Text(
                      doctor.council == null
                          ? doctor.name
                          : '${doctor.name} - ${doctor.council}',
                    ),
                  ),
                )
                .toList(),
            onChanged: _isLoading
                ? null
                : (doctor) => setState(() => _selectedDoctor = doctor),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _pickDateTime,
            icon: const Icon(Icons.calendar_month_outlined),
            label: Text(
              _appointmentDate == null
                  ? 'Choose date and time'
                  : DateFormat(
                      'EEE, d MMM y - h:mm a',
                    ).format(_appointmentDate!),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _reasonController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Reason for visit',
              hintText: 'Briefly describe what you would like to discuss',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _isSubmitting ? null : _bookAppointment,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check_circle_outline),
            label: Text(_isSubmitting ? 'Booking...' : 'Confirm appointment'),
          ),
        ],
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final Appointment appointment;

  const _AppointmentCard({required this.appointment});

  @override
  Widget build(BuildContext context) {
    final isScheduled = appointment.status == 'scheduled';
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor:
                  (isScheduled ? AppTheme.primary : AppTheme.textMuted)
                      .withOpacity(0.12),
              child: Icon(
                Icons.event_note_outlined,
                color: isScheduled ? AppTheme.primary : AppTheme.textMuted,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appointment.doctorName ?? 'Doctor consultation',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat(
                      'EEE, d MMM y - h:mm a',
                    ).format(appointment.appointmentDate),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    appointment.reason,
                    style: const TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            _StatusChip(status: appointment.status),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'completed' => AppTheme.success,
      'cancelled' => AppTheme.warning,
      _ => AppTheme.primary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String text;

  const _EmptyCard({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        text,
        style: const TextStyle(color: AppTheme.textMuted, height: 1.4),
      ),
    );
  }
}
