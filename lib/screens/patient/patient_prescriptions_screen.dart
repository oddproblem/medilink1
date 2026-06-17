import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../core/models/Prescription.dart';
import '../../core/network/ApiService.dart';
import 'package:intl/intl.dart';

class PatientPrescriptionsScreen extends StatefulWidget {
  final String patientId;

  const PatientPrescriptionsScreen({
    super.key,
    required this.patientId,
  });

  @override
  State<PatientPrescriptionsScreen> createState() =>
      _PatientPrescriptionsScreenState();
}

class _PatientPrescriptionsScreenState
    extends State<PatientPrescriptionsScreen> {
  final ApiService _apiService = ApiService();
  List<Prescription> _prescriptions = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchPrescriptions();
  }

  Future<void> _fetchPrescriptions() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      await _apiService.init();
      final data = await _apiService.getPrescriptions(widget.patientId);
      setState(() {
        _prescriptions = data..sort((a, b) => b.date.compareTo(a.date));
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prescription History'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPrescriptions,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline,
                  size: 48, color: AppTheme.warning),
              const SizedBox(height: 16),
              Text(
                'Failed to load prescriptions: $_errorMessage',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchPrescriptions,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_prescriptions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.medical_services_outlined,
                  size: 64, color: AppTheme.textMuted),
              const SizedBox(height: 16),
              Text(
                'No historical prescriptions found.',
                style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 16,
                    fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _prescriptions.length,
      itemBuilder: (context, index) {
        final prescription = _prescriptions[index];
        return _buildPrescriptionCard(prescription);
      },
    );
  }

  Widget _buildPrescriptionCard(Prescription prescription) {
    final formattedDate =
        DateFormat('dd MMM yyyy, hh:mm a').format(prescription.date);

    return Card(
      margin: const EdgeInsets.only(bottom: 16.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
      elevation: 0,
      color: AppTheme.card,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long,
                        color: AppTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      formattedDate,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14.0,
                      ),
                    ),
                  ],
                ),
                if (prescription.prescriptionUrl != null &&
                    prescription.prescriptionUrl!.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.file_download,
                        color: AppTheme.primary),
                    onPressed: () {
                      // Handled attachment link / launch web view or file downloder
                    },
                    tooltip: 'Download Original',
                  )
              ],
            ),
            const Divider(height: 24, thickness: 1),
            ...prescription.medicines.map((med) => _buildMedicineRow(med)),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicineRow(Medicine med) {
    Color badgeColor;
    switch (med.status.toLowerCase()) {
      case 'current':
        badgeColor = AppTheme.success;
        break;
      case 'prescribed':
        badgeColor = AppTheme.primary;
        break;
      default:
        badgeColor = AppTheme.textMuted;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 4.0),
            width: 8.0,
            height: 8.0,
            decoration: BoxDecoration(
              color: badgeColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12.0),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        med.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15.0,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8.0, vertical: 4.0),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                      child: Text(
                        med.status.toUpperCase(),
                        style: TextStyle(
                          color: badgeColor,
                          fontSize: 10.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4.0),
                Text(
                  'Dosage: ${med.dosage ?? "N/A"}  •  Freq: ${med.frequency ?? "N/A"}  •  Duration: ${med.duration ?? "N/A"}',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12.0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
