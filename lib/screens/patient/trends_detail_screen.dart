import 'package:flutter/material.dart';
import '../../app_theme.dart';
import '../../core/models/DailyReading.dart';
import '../../core/network/ApiService.dart';
import 'package:intl/intl.dart';

class TrendsDetailScreen extends StatefulWidget {
  final String patientId;

  const TrendsDetailScreen({
    super.key,
    required this.patientId,
  });

  @override
  State<TrendsDetailScreen> createState() => _TrendsDetailScreenState();
}

class _TrendsDetailScreenState extends State<TrendsDetailScreen> {
  final ApiService _apiService = ApiService();
  List<DailyReading> _readings = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchReadings();
  }

  Future<void> _fetchReadings() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      await _apiService.init();
      final data = await _apiService.getDailyReadings(widget.patientId);
      setState(() {
        _readings = data..sort((a, b) => b.date.compareTo(a.date));
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteReading(String readingId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Reading'),
        content: const Text('Are you sure you want to delete this vitals log?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppTheme.warning),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      setState(() {
        _isLoading = true;
      });
      await _apiService.deleteDailyReading(readingId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vitals reading deleted successfully.')),
      );
      await _fetchReadings();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete reading: $e')),
      );
    }
  }

  Future<void> _showEditReadingDialog(DailyReading reading) async {
    final systolicCtrl = TextEditingController(text: reading.bloodPressure.systolic.toString());
    final diastolicCtrl = TextEditingController(text: reading.bloodPressure.diastolic.toString());
    final weightCtrl = TextEditingController(text: reading.weightKg?.toString() ?? '');
    final pulseCtrl = TextEditingController(text: reading.pulseRate.toString());

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Vitals Log'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: systolicCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Systolic Blood Pressure (mmHg) *'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: diastolicCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Diastolic Blood Pressure (mmHg) *'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: weightCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Weight (kg)'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: pulseCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Pulse Rate (bpm)'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (systolicCtrl.text.trim().isEmpty || diastolicCtrl.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Systolic and Diastolic BP are required.')),
                );
                return;
              }
              Navigator.of(context).pop(true);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      setState(() {
        _isLoading = true;
      });

      final int sys = int.parse(systolicCtrl.text.trim());
      final int dia = int.parse(diastolicCtrl.text.trim());
      final double? weight = double.tryParse(weightCtrl.text.trim());
      final int pulse = int.tryParse(pulseCtrl.text.trim()) ?? 0;

      await _apiService.updateDailyReading(
        reading.id ?? '',
        {
          'systolic': sys,
          'diastolic': dia,
          'weightKg': weight,
          'pulseRate': pulse,
        },
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vitals reading updated successfully.')),
      );
      await _fetchReadings();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update reading: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detailed Vitals History'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchReadings,
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
              const Icon(Icons.error_outline, size: 48, color: AppTheme.warning),
              const SizedBox(height: 16),
              Text(
                'Failed to load vitals: $_errorMessage',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchReadings,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_readings.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.query_stats, size: 64, color: AppTheme.textMuted),
              const SizedBox(height: 16),
              Text(
                'No historical daily readings found.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _readings.length,
      itemBuilder: (context, index) {
        final reading = _readings[index];
        final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(reading.date);

        return Card(
          margin: const EdgeInsets.only(bottom: 12.0),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          elevation: 0,
          color: AppTheme.card,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 14, color: AppTheme.textMuted),
                          const SizedBox(width: 6),
                          Text(
                            formattedDate,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14.0,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildVitalIndicator(
                            icon: Icons.favorite,
                            label: 'BP',
                            value: '${reading.bloodPressure.systolic}/${reading.bloodPressure.diastolic}',
                            unit: 'mmHg',
                            color: AppTheme.primary,
                          ),
                          const SizedBox(width: 16),
                          _buildVitalIndicator(
                            icon: Icons.monitor_weight_outlined,
                            label: 'Weight',
                            value: reading.weightKg != null ? reading.weightKg!.toStringAsFixed(1) : 'N/A',
                            unit: 'kg',
                            color: AppTheme.success,
                          ),
                          const SizedBox(width: 16),
                          _buildVitalIndicator(
                            icon: Icons.heart_broken,
                            label: 'Pulse',
                            value: reading.pulseRate != 0 ? reading.pulseRate.toString() : 'N/A',
                            unit: 'bpm',
                            color: AppTheme.warning,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: AppTheme.primary),
                  onPressed: () => _showEditReadingDialog(reading),
                  tooltip: 'Edit Reading',
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppTheme.warning),
                  onPressed: () => _deleteReading(reading.id ?? ''),
                  tooltip: 'Delete Reading',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildVitalIndicator({
    required IconData icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 4),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                TextSpan(
                  text: ' $unit',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
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
