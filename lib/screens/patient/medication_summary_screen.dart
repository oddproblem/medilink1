import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../app_theme.dart';
import '../../core/network/ApiService.dart';
import '../../widgets/section_card.dart';
import 'language_provider.dart';

class MedicationSummaryScreen extends StatefulWidget {
  const MedicationSummaryScreen({super.key});

  @override
  State<MedicationSummaryScreen> createState() =>
      _MedicationSummaryScreenState();
}

class _MedicationSummaryScreenState extends State<MedicationSummaryScreen> {
  final ApiService _apiService = ApiService();

  bool _isLoading = true;
  String? _errorMessage;
  int _prescriptionCount = 0;
  List<Map<String, dynamic>> _prescriptions = [];

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      await _apiService.init();
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        throw ApiException(401, 'Please log in again.');
      }

      final results = await Future.wait([
        _apiService.getOcrPrescriptionCount(currentUser.id),
        _apiService.getOcrPrescriptionMedicines(currentUser.id),
      ]);

      final prescriptions = (results[1] as List<dynamic>)
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();

      if (!mounted) return;
      setState(() {
        _prescriptionCount = results[0] as int;
        _prescriptions = prescriptions;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  int get _medicineCount {
    return _prescriptions.fold<int>(
      0,
      (total, prescription) => total + _medicineList(prescription).length,
    );
  }

  List<dynamic> _medicineList(Map<String, dynamic> prescription) {
    final medicines = prescription['medicines'];
    return medicines is List ? medicines : const [];
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'Unknown date';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('dd MMM yyyy, hh:mm a').format(parsed.toLocal());
  }

  String _medicineField(dynamic medicine, List<String> keys) {
    if (medicine is! Map) return 'N/A';
    for (final key in keys) {
      final value = medicine[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }
    return 'N/A';
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('medicationSummary')),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _loadSummary,
            icon: const Icon(Icons.refresh),
            tooltip: lang.t('retry'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadSummary,
        child: _buildBody(lang),
      ),
    );
  }

  Widget _buildBody(LanguageProvider lang) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_errorMessage != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 120),
          const Icon(Icons.error_outline, size: 56, color: AppTheme.warning),
          const SizedBox(height: 16),
          Text(
            _errorMessage!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton.icon(
              onPressed: _loadSummary,
              icon: const Icon(Icons.refresh),
              label: Text(lang.t('retry')),
            ),
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        SectionCard(
          title: lang.t('medicationSummary'),
          trailing: TextButton.icon(
            onPressed: () {
              Navigator.of(context)
                  .pushNamed('/ocr-scan')
                  .then((_) => _loadSummary());
            },
            icon: const Icon(Icons.document_scanner_outlined, size: 18),
            label: Text(lang.t('processNewPrescription')),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                lang.t('medicationSummaryDesc'),
                style: const TextStyle(color: AppTheme.textMuted, height: 1.4),
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth >= 640;
                  final tiles = [
                    _MetricTile(
                      label: lang.t('totalPrescriptions'),
                      value: _prescriptionCount.toString(),
                      icon: Icons.receipt_long_outlined,
                      color: AppTheme.primary,
                    ),
                    _MetricTile(
                      label: lang.t('completedPrescriptions'),
                      value: _prescriptions.length.toString(),
                      icon: Icons.check_circle_outline,
                      color: AppTheme.success,
                    ),
                    _MetricTile(
                      label: lang.t('totalMedicines'),
                      value: _medicineCount.toString(),
                      icon: Icons.medication_outlined,
                      color: AppTheme.accent,
                    ),
                  ];

                  if (isWide) {
                    return Row(
                      children: [
                        for (int i = 0; i < tiles.length; i++) ...[
                          Expanded(child: tiles[i]),
                          if (i != tiles.length - 1) const SizedBox(width: 12),
                        ],
                      ],
                    );
                  }

                  return Column(
                    children: [
                      for (int i = 0; i < tiles.length; i++) ...[
                        tiles[i],
                        if (i != tiles.length - 1) const SizedBox(height: 10),
                      ],
                    ],
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          lang.t('uploadedPrescriptionGroups'),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1A202C),
          ),
        ),
        const SizedBox(height: 12),
        if (_prescriptions.isEmpty)
          _EmptySummary(lang: lang)
        else
          ..._prescriptions.map((prescription) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _PrescriptionMedicineCard(
                dateLabel: _formatDate(prescription['date']),
                medicines: _medicineList(prescription),
                fieldReader: _medicineField,
                lang: lang,
              ),
            );
          }),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.16)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1A202C),
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

class _PrescriptionMedicineCard extends StatelessWidget {
  const _PrescriptionMedicineCard({
    required this.dateLabel,
    required this.medicines,
    required this.fieldReader,
    required this.lang,
  });

  final String dateLabel;
  final List<dynamic> medicines;
  final String Function(dynamic medicine, List<String> keys) fieldReader;
  final LanguageProvider lang;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.calendar_month_outlined,
                  size: 20, color: AppTheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  dateLabel,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          if (medicines.isEmpty)
            Text(
              lang.t('noMedicinesFound'),
              style: const TextStyle(color: AppTheme.textMuted),
            )
          else
            ...medicines.map((medicine) {
              return _MedicineRow(
                name: fieldReader(medicine, const ['name', 'medicine']),
                dosage: fieldReader(medicine, const ['dosage', 'dose']),
                frequency: fieldReader(medicine, const ['frequency']),
                duration: fieldReader(
                  medicine,
                  const ['duration', 'instructions'],
                ),
                lang: lang,
              );
            }),
        ],
      ),
    );
  }
}

class _MedicineRow extends StatelessWidget {
  const _MedicineRow({
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.duration,
    required this.lang,
  });

  final String name;
  final String dosage;
  final String frequency;
  final String duration;
  final LanguageProvider lang;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 5),
            width: 9,
            height: 9,
            decoration: const BoxDecoration(
              color: AppTheme.success,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1A202C),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${lang.t('dosage')}: $dosage   ${lang.t('frequency')}: $frequency',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
                Text(
                  '${lang.t('duration')}: $duration',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
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

class _EmptySummary extends StatelessWidget {
  const _EmptySummary({required this.lang});

  final LanguageProvider lang;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.medication_liquid_outlined,
            size: 48,
            color: AppTheme.textMuted,
          ),
          const SizedBox(height: 12),
          Text(
            lang.t('noMedicineSummary'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.4),
          ),
        ],
      ),
    );
  }
}
