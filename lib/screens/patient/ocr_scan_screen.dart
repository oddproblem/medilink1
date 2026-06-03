import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../app_theme.dart';
import '../../core/network/ApiService.dart';
import '../../core/config/AppConfig.dart';
import '../../widgets/section_card.dart';

class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});

  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  String? _selectedImagePath;
  
  bool _isSubmitting = false;
  bool _isPolling = false;
  String _statusMessage = '';
  Map<String, dynamic>? _scanResult;
  List<dynamic> _pastScans = [];
  bool _isLoadingHistory = true;

  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _apiService.init().then((_) {
      _fetchHistory();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) return;
      final scans = await _apiService.getOcrPrescriptionsForPatient(currentUser.id);
      if (mounted) {
        setState(() {
          _pastScans = scans;
          _isLoadingHistory = false;
        });
      }
    } catch (e) {
      debugPrint("Failed to load OCR scan history: $e");
      if (mounted) {
        setState(() => _isLoadingHistory = false);
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        setState(() {
          _selectedImagePath = image.path;
          _statusMessage = 'Image selected successfully.';
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  Future<void> _startOcrProcess() async {
    if (_selectedImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or capture a prescription image first.')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _statusMessage = 'Submitting prescription file...';
      _scanResult = null;
    });

    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      final response = await _apiService.uploadOcrPrescription(currentUser.id, _selectedImagePath!);
      final recordId = response['recordId'];

      if (recordId == null) {
        throw Exception('Server did not return a record ID');
      }

      setState(() {
        _isSubmitting = false;
        _isPolling = true;
        _statusMessage = 'OCR Processing started. Extracting text...';
      });

      _startPolling(recordId);
    } catch (e) {
      setState(() {
        _isSubmitting = false;
        _statusMessage = '';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to initiate OCR: $e')),
      );
    }
  }

  void _startPolling(String recordId) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final result = await _apiService.getOcrPrescriptionResult(recordId);
        final status = result['status'];

        if (status == 'completed') {
          timer.cancel();
          setState(() {
            _isPolling = false;
            _scanResult = result;
            _statusMessage = 'Prescription successfully analyzed!';
          });
          _fetchHistory(); // Refresh the history list
        } else if (status == 'error') {
          timer.cancel();
          setState(() {
            _isPolling = false;
            _statusMessage = 'Error during extraction: ${result['errorMessage'] ?? 'Unknown error'}';
          });
        } else {
          setState(() {
            _statusMessage = 'Background processing... Status: $status';
          });
        }
      } catch (e) {
        timer.cancel();
        setState(() {
          _isPolling = false;
          _statusMessage = 'Error fetching processing status: $e';
        });
      }
    });
  }

  void _viewPastResult(Map<String, dynamic> record) {
    setState(() {
      _scanResult = record;
      _statusMessage = 'Viewing past prescription scan';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prescription OCR Scanner'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionCard(
              title: 'New Prescription Scan',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Upload or capture a prescription image to automatically extract and register medicines.',
                    style: TextStyle(color: AppTheme.textMuted, height: 1.4),
                  ),
                  const SizedBox(height: 16),

                  if (_selectedImagePath == null)
                    Container(
                      width: double.infinity,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade200, width: 2),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text(
                            'No prescription selected',
                            style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Take a photo or upload from gallery',
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                          ),
                        ],
                      ),
                    )
                  else
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.file(
                            File(_selectedImagePath!),
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: CircleAvatar(
                            backgroundColor: Colors.black.withOpacity(0.6),
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.white),
                              onPressed: () {
                                setState(() {
                                  _selectedImagePath = null;
                                  _statusMessage = '';
                                });
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: (_isSubmitting || _isPolling) ? null : () => _pickImage(ImageSource.camera),
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('Take Photo'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: (_isSubmitting || _isPolling) ? null : () => _pickImage(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library),
                          label: const Text('Upload Image'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: (_isSubmitting || _isPolling || _selectedImagePath == null)
                              ? null
                              : _startOcrProcess,
                          icon: const Icon(Icons.document_scanner),
                          label: const Text('Scan & Extract'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      if (_isSubmitting || _isPolling) ...[
                        const SizedBox(width: 16),
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ],
                    ],
                  ),
                  if (_statusMessage.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      _statusMessage,
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: _isPolling ? AppTheme.accent : AppTheme.primary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // OCR Extraction Result display
            if (_scanResult != null) ...[
              SectionCard(
                title: 'Extraction Results',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Source File: ${_scanResult!['fileUrl']}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                    if (_scanResult!['fileUrl'] != null && _scanResult!['fileUrl'].toString().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Builder(
                        builder: (context) {
                          String imageUrl = _scanResult!['fileUrl'].toString();
                          if (!imageUrl.startsWith('http')) {
                            final uri = Uri.parse(AppConfig.baseUrl);
                            imageUrl = '${uri.scheme}://${uri.host}${uri.hasPort ? ":${uri.port}" : ""}$imageUrl';
                          }
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              imageUrl,
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  height: 100,
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Text('Image Preview Unavailable', style: TextStyle(color: AppTheme.textMuted)),
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ],
                    const SizedBox(height: 16),

                    const Text(
                      'Extracted Medicines:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 8),

                    // Render structured medicines table
                    if (_scanResult!['structuredMedicines'] != null &&
                        _scanResult!['structuredMedicines']['medicines'] != null) ...[
                      Table(
                        border: TableBorder.all(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(8)),
                        columnWidths: const {
                          0: FlexColumnWidth(2),
                          1: FlexColumnWidth(1),
                          2: FlexColumnWidth(1),
                          3: FlexColumnWidth(2),
                        },
                        children: [
                          TableRow(
                            decoration: BoxDecoration(color: Colors.grey.shade100),
                            children: const [
                              TableCell(child: Padding(padding: EdgeInsets.all(8), child: Text('Name', style: TextStyle(fontWeight: FontWeight.bold)))),
                              TableCell(child: Padding(padding: EdgeInsets.all(8), child: Text('Dosage', style: TextStyle(fontWeight: FontWeight.bold)))),
                              TableCell(child: Padding(padding: EdgeInsets.all(8), child: Text('Freq', style: TextStyle(fontWeight: FontWeight.bold)))),
                              TableCell(child: Padding(padding: EdgeInsets.all(8), child: Text('Instructions', style: TextStyle(fontWeight: FontWeight.bold)))),
                            ],
                          ),
                          ...(_scanResult!['structuredMedicines']['medicines'] as List).map((med) {
                            return TableRow(
                              children: [
                                TableCell(child: Padding(padding: const EdgeInsets.all(8), child: Text(med['name']?.toString() ?? 'N/A'))),
                                TableCell(child: Padding(padding: const EdgeInsets.all(8), child: Text(med['dosage']?.toString() ?? 'N/A'))),
                                TableCell(child: Padding(padding: const EdgeInsets.all(8), child: Text(med['frequency']?.toString() ?? 'N/A'))),
                                TableCell(child: Padding(padding: const EdgeInsets.all(8), child: Text(med['instructions']?.toString() ?? 'N/A'))),
                              ],
                            );
                          }).toList(),
                        ],
                      ),
                    ] else
                      const Text('No structured medicine data found.'),
                    
                    const SizedBox(height: 16),
                    Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        title: const Text('View Raw Extracted Text'),
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Text(
                              _scanResult!['ocrText']?.toString() ?? 'No text extracted.',
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // History of past scans
            SectionCard(
              title: 'OCR Scan History',
              child: _isLoadingHistory
                  ? const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()))
                  : _pastScans.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Center(child: Text('No previous prescription scans found.', style: TextStyle(color: AppTheme.textMuted))),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _pastScans.length,
                          separatorBuilder: (_, __) => const Divider(),
                          itemBuilder: (context, index) {
                            final scan = _pastScans[index];
                            final dateStr = scan['createdAt'] != null
                                ? DateFormat('yMMMd').add_jm().format(DateTime.parse(scan['createdAt']))
                                : 'Unknown Date';
                            final isCompleted = scan['status'] == 'completed';

                            return ListTile(
                              leading: Icon(
                                isCompleted ? Icons.check_circle : Icons.error,
                                color: isCompleted ? AppTheme.success : Colors.red,
                              ),
                              title: Text(
                                isCompleted ? 'Scan Successful' : 'Scan Failed',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text('$dateStr\nFile: ${scan['fileUrl']}'),
                              isThreeLine: true,
                              trailing: isCompleted
                                  ? OutlinedButton(
                                      onPressed: () => _viewPastResult(scan),
                                      child: const Text('View'),
                                    )
                                  : null,
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
