import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:medilink1/core/models/Patient.dart';
import 'package:medilink1/core/models/Prescription.dart';
import 'package:medilink1/core/models/disease_history.dart';
import 'package:medilink1/core/models/DailyReading.dart';
import 'package:medilink1/core/models/HealthSummary.dart';
import 'package:medilink1/core/models/Note.dart';
import 'package:medilink1/core/network/ApiService.dart';
import 'package:medilink1/widgets/section_card.dart';
import 'package:medilink1/app_theme.dart';
import 'patient/language_provider.dart';

class PatientDetailScreen extends StatefulWidget {
  final Patient patient;

  const PatientDetailScreen({super.key, required this.patient});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _ChatMessage {
  final String text;
  final bool isFromUser;

  _ChatMessage(this.text, this.isFromUser);
}

class _MedicineInfo {
  final Medicine medicine;
  final String prescriptionId;
  _MedicineInfo(this.medicine, this.prescriptionId);
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _chatController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  List<Prescription> prescriptions = [];
  List<DiseaseHistory> history = [];
  List<DailyReading> dailyReadings = [];
  HealthSummary? healthSummary;
  List<Note> notes = [];
  bool isLoading = true;
  bool _isSummaryExpanded = false;
  bool _isAiLoading = false;
  bool _isRegeneratingSummary = false;
  List<_ChatMessage> _chatMessages = [];

  Future<void> _regenerateSummary() async {
    setState(() {
      _isRegeneratingSummary = true;
    });
    try {
      final summary = await _apiService.generateSummary({
        'patientId': widget.patient.id,
      });
      setState(() {
        healthSummary = summary;
        _isRegeneratingSummary = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('AI Health Summary regenerated successfully!')),
      );
    } catch (e) {
      setState(() {
        _isRegeneratingSummary = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to regenerate summary: $e')),
      );
    }
  }

  Future<void> _showAddMedicineDialog() async {
    final nameCtrl = TextEditingController();
    final dosageCtrl = TextEditingController();
    final freqCtrl = TextEditingController();
    final durationCtrl = TextEditingController();

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add Detailed Medicine'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Medicine Name *',
                    hintText: 'e.g. Paracetamol',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: dosageCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Dosage',
                    hintText: 'e.g. 500mg',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: freqCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Frequency',
                    hintText: 'e.g. Twice a day',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: durationCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Duration',
                    hintText: 'e.g. 5 days',
                  ),
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
                if (nameCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Medicine name is required')),
                  );
                  return;
                }
                Navigator.of(context).pop(true);
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    try {
      final doctor = _apiService.currentUser;
      if (doctor == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not identify logged-in doctor.')),
        );
        return;
      }
      setState(() => isLoading = true);
      await _apiService.createPrescription({
        "patientId": widget.patient.id,
        "doctorId": doctor.id,
        "medicines": [
          {
            "name": nameCtrl.text.trim(),
            "dosage": dosageCtrl.text.trim(),
            "frequency": freqCtrl.text.trim(),
            "duration": durationCtrl.text.trim(),
            "status": "current"
          },
        ],
      });
      await _fetchPatientData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prescription added successfully')),
      );
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add prescription: $e')),
      );
    }
  }

  Future<void> _showAddDiseaseDialog() async {
    final illnessNameCtrl = TextEditingController();
    final remarksCtrl = TextEditingController();
    final hospitalCtrl = TextEditingController();
    final addressSearchCtrl = TextEditingController();
    
    String status = 'ongoing';
    DateTime selectedDate = DateTime.now();
    
    String? selectedAddress;
    List<double>? selectedCoordinates;
    
    List<dynamic> suggestions = [];
    bool isSearchingLocation = false;
    String locationStatus = '';

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            
            Future<void> searchLocation() async {
              final query = addressSearchCtrl.text.trim();
              if (query.isEmpty) return;
              
              setDialogState(() {
                isSearchingLocation = true;
                locationStatus = 'Searching addresses...';
                suggestions = [];
              });
              
              try {
                final encodedQuery = Uri.encodeComponent(query);
                final url = Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=$encodedQuery');
                final response = await http.get(url, headers: {
                  'User-Agent': 'SwiftMediLinkMobileApp/1.0.2 (medilink-project-support@gmail.com)'
                });
                
                if (response.statusCode == 200) {
                  final List<dynamic> data = jsonDecode(response.body);
                  setDialogState(() {
                    suggestions = data;
                    isSearchingLocation = false;
                    locationStatus = data.isEmpty ? 'No address results found.' : '';
                  });
                } else {
                  setDialogState(() {
                    isSearchingLocation = false;
                    locationStatus = 'API Error: ${response.statusCode}';
                  });
                }
              } catch (e) {
                setDialogState(() {
                  isSearchingLocation = false;
                  locationStatus = 'Connection error: $e';
                });
              }
            }

            return AlertDialog(
              title: const Text('Add Disease History'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: illnessNameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Illness / Condition Name *',
                        hintText: 'e.g. Chickenpox',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'ongoing', child: Text('Ongoing')),
                        DropdownMenuItem(value: 'resolved', child: Text('Resolved')),
                      ],
                      onChanged: (val) {
                        if (val != null) status = val;
                      },
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Diagnosis Date: ${DateFormat.yMd().format(selectedDate)}',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedDate,
                              firstDate: DateTime(1900),
                              lastDate: DateTime.now(),
                            );
                            if (picked != null) {
                              setDialogState(() => selectedDate = picked);
                            }
                          },
                          child: const Text('Change'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    TextField(
                      controller: hospitalCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Hospital Name',
                        hintText: 'e.g. General Hospital',
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    TextField(
                      controller: remarksCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Remarks',
                        hintText: 'Any specific instructions/notes',
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    const Divider(),
                    const SizedBox(height: 8),
                    const Text(
                      'Geospatial Location (Required for Hotspots) *',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary),
                    ),
                    const SizedBox(height: 8),
                    
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: addressSearchCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Search City / Address *',
                              hintText: 'e.g. Vijayawada, Andhra Pradesh',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: isSearchingLocation
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.search),
                          onPressed: isSearchingLocation ? null : searchLocation,
                          style: IconButton.styleFrom(
                            backgroundColor: AppTheme.primary.withOpacity(0.1),
                          ),
                        ),
                      ],
                    ),
                    
                    if (locationStatus.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        locationStatus,
                        style: const TextStyle(fontSize: 12, color: AppTheme.warning),
                      ),
                    ],

                    if (suggestions.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 150),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ListView.builder(
                          shrinkWrap: true,
                          itemCount: suggestions.length,
                          itemBuilder: (context, idx) {
                            final item = suggestions[idx];
                            final displayName = item['display_name'] ?? 'Unknown location';
                            return ListTile(
                              title: Text(
                                displayName,
                                style: const TextStyle(fontSize: 12),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              dense: true,
                              onTap: () {
                                final double lon = double.parse(item['lon']);
                                final double lat = double.parse(item['lat']);
                                setDialogState(() {
                                  selectedAddress = displayName;
                                  selectedCoordinates = [lon, lat];
                                  addressSearchCtrl.text = displayName;
                                  suggestions = [];
                                  locationStatus = 'Selected: $displayName\nCoords: [$lon, $lat]';
                                });
                              },
                            );
                          },
                        ),
                      ),
                    ],

                    if (selectedCoordinates != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.location_on, color: AppTheme.success, size: 16),
                            SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Location verified successfully.',
                                style: TextStyle(color: AppTheme.success, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final illness = illnessNameCtrl.text.trim();
                    if (illness.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Illness Name is required')),
                      );
                      return;
                    }
                    if (selectedCoordinates == null || selectedAddress == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('You must search and select a verified address from the location API')),
                      );
                      return;
                    }

                    Navigator.of(context).pop();
                    
                    try {
                      setState(() {
                        isLoading = true;
                      });

                      final doctorId = _apiService.currentUser?.id ?? '';
                      
                      await _apiService.createDiseaseHistory({
                        'patientId': widget.patient.id,
                        'illnessName': illness,
                        'diagnosisDate': selectedDate.toIso8601String(),
                        'remarks': remarksCtrl.text.trim(),
                        'hospital': hospitalCtrl.text.trim(),
                        'status': status,
                        'address': selectedAddress,
                        'prescribedBy': doctorId,
                        'location': {
                          'type': 'Point',
                          'coordinates': selectedCoordinates,
                        }
                      });

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Disease History entry created successfully.')),
                      );

                      await _fetchPatientData();
                    } catch (e) {
                      setState(() {
                        isLoading = false;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to add disease history: $e')),
                      );
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _apiService
        .init()
        .then((_) {
          _fetchPatientData();
        })
        .catchError((e) {
          debugPrint("ApiService init failed: $e");
        });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _chatMessages = [
      _ChatMessage(
        context.read<LanguageProvider>().t('Ask History, Medicines etc'),
        false,
      ),
    ];
  }

  Future<void> _fetchPatientData() async {
    try {
      final results = await Future.wait([
        _apiService.getPrescriptions(widget.patient.id),
        _apiService.getPatientHistory(widget.patient.id),
        _apiService.getDailyReadings(widget.patient.id),
        // The backend provides a POST endpoint to generate a summary, not GET.
        _apiService.generateSummary({'patientId': widget.patient.id}),
        _apiService.getNotesByPatient(widget.patient.id),
      ]);

      if (mounted) {
        setState(() {
          // ApiService methods already return typed lists. We just need to cast them.
          prescriptions = results[0] as List<Prescription>;
          history = results[1] as List<DiseaseHistory>;
          dailyReadings = results[2] as List<DailyReading>;
          healthSummary = results[3] as HealthSummary?;
          notes = results[4] as List<Note>;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load patient data: $e')),
        );
      }
    }
  }

  Future<void> _saveNote() async {
    final note = _noteController.text.trim();
    if (note.isEmpty) return;

    try {
      await _apiService.createNote({
        "noteText": note,
        "patientId": widget.patient.id,
      });
      _noteController.clear();
      _fetchPatientData(); // Refresh notes
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Note saved successfully')));
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to save note: $e')));
    }
  }

  Future<void> _deleteNote(String noteId) async {
    final langProvider = context.read<LanguageProvider>();
    // Show confirmation dialog
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(langProvider.t('deleteNoteTitle')),
        content: Text(langProvider.t('deleteNoteConfirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(langProvider.t('cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(
              langProvider.t('delete'),
              style: const TextStyle(color: AppTheme.warning),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _apiService.deleteNote(noteId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Note deleted successfully')),
      );
      _fetchPatientData(); // Refresh list
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to delete note: $e')));
    }
  }



  Future<void> _updateMedicineStatus(
    String prescriptionId,
    String medicineId,
    String newStatus,
  ) async {
    try {
      await _apiService.updateMedicineStatus(prescriptionId, medicineId, {
        "status": newStatus,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Medicine status updated to "$newStatus".')),
      );
      _fetchPatientData(); // Refresh the lists
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update medicine status: $e')),
        );
      }
      debugPrint("Failed to update medicine status: $e");
    }
  }

  Future<void> _askAi() async {
    final question = _chatController.text.trim();
    if (question.isEmpty) return;

    // Add user message to chat and clear input
    setState(() {
      _chatMessages.add(_ChatMessage(question, true));
      _isAiLoading = true;
    });
    _chatController.clear();

    try {
      // We expect a Map, but receive it as dynamic to handle different response structures.
      final dynamic response = await _apiService.queryHealthData({
        "patientId": widget.patient.id,
        "userQuery": question,
      });

      if (mounted) {
        String summaryText = '';
        // Manually parse the response to find the AI's answer.
        // This makes the function robust against backend inconsistencies.
        if (response is Map<String, dynamic>) {
          // The response might be nested under a 'data' key.
          final data = response.containsKey('data')
              ? response['data']
              : response;
          // The AI's text could be under 'summary' or 'answer'.
          summaryText =
              (data['response'] ?? data['summary'] ?? data['answer'] ?? '')
                  .toString()
                  .trim();
        }

        setState(() {
          _chatMessages.add(
            _ChatMessage(
              summaryText.isNotEmpty
                  ? summaryText
                  : "AI returned an empty response.",
              false,
            ),
          );
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _chatMessages.add(_ChatMessage("AI query failed: $e", false));
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isAiLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _chatController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Widget _buildChatBubble(_ChatMessage message) {
    return Align(
      alignment: message.isFromUser
          ? Alignment.centerRight
          : Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        decoration: BoxDecoration(
          color: message.isFromUser
              ? Theme.of(context)
                    .colorScheme
                    .primary // User message bubble
              : Theme.of(context).colorScheme.surface, // AI message bubble
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: message.isFromUser
                ? Colors
                      .white // User message text
                : Theme.of(context).colorScheme.onSurface,
          ), // AI message text
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();

    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text("Patient: ${widget.patient.name}")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text("Patient: ${widget.patient.name}"),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.logout, color: Colors.white),
            label: Text(
              langProvider.t('logout'),
              style: const TextStyle(color: Colors.white),
            ),
            onPressed: () {
              _apiService.logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/landing',
                (Route<dynamic> route) => false,
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Health Summary
            SectionCard(
              title: langProvider.t('healthSummary'),
              trailing: _isRegeneratingSummary
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.primary,
                      ),
                    )
                  : IconButton(
                      icon: const Icon(Icons.refresh, color: AppTheme.primary),
                      onPressed: _regenerateSummary,
                      tooltip: 'Regenerate Summary',
                    ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    healthSummary?.summary ?? langProvider.t('noSummary'),
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      height: 1.5,
                    ),
                    maxLines: _isSummaryExpanded ? null : 3,
                    overflow: _isSummaryExpanded
                        ? TextOverflow.visible
                        : TextOverflow.ellipsis,
                  ),
                  if ((healthSummary?.summary.length ?? 0) > 150)
                    TextButton(
                      onPressed: () => setState(
                        () => _isSummaryExpanded = !_isSummaryExpanded,
                      ),
                      child: Text(
                        _isSummaryExpanded
                            ? langProvider.t('seeLess')
                            : langProvider.t('seeMore'),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Prescriptions
            SectionCard(
              title: langProvider.t('prescribedMedicines'),
              child: Column(
                children: [
                  if (prescriptions.isEmpty)
                    Text(
                      langProvider.t('noPrescribed'),
                      style: const TextStyle(color: AppTheme.textMuted),
                    )
                  else
                    ...prescriptions.expand((p) {
                      return p.medicines.map((m) {
                        final medInfo = _MedicineInfo(m, p.id);
                        return Card(
                          child: ListTile(
                            leading: const Icon(
                              Icons.medication_outlined,
                              color: AppTheme.primary,
                            ),
                            title: Text(m.name),
                            subtitle: Text(
                              "Status: ${m.status} • Prescribed: ${DateFormat.yMd().format(p.date)}" +
                              ((m.dosage != null && m.dosage!.isNotEmpty) || (m.frequency != null && m.frequency!.isNotEmpty) || (m.duration != null && m.duration!.isNotEmpty)
                                  ? "\nDosage: ${m.dosage ?? 'N/A'} • Freq: ${m.frequency ?? 'N/A'} • Duration: ${m.duration ?? 'N/A'}"
                                  : ""),
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (String newStatus) {
                                _updateMedicineStatus(
                                  medInfo.prescriptionId,
                                  medInfo.medicine.id,
                                  newStatus,
                                );
                              },
                              itemBuilder: (BuildContext context) =>
                                  <PopupMenuEntry<String>>[
                                    PopupMenuItem<String>(
                                      value: 'current',
                                      child: Text(
                                        langProvider.t('markAsCurrent'),
                                      ),
                                    ),
                                    PopupMenuItem<String>(
                                      value: 'past',
                                      child: Text(langProvider.t('markAsPast')),
                                    ),
                                  ],
                            ),
                          ),
                        );
                      });
                    }).toList(),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _showAddMedicineDialog,
                    icon: const Icon(Icons.add_circle_outline),
                    label: const Text('Add Detailed Medicine'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),

            // Disease History
            SectionCard(
              title: langProvider.t('diseaseHistory'),
              trailing: IconButton(
                icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
                onPressed: _showAddDiseaseDialog,
                tooltip: 'Add Disease History',
              ),
              child: Column(
                children: history.isEmpty
                    ? [
                        Text(
                          langProvider.t('noHistoryDetails'),
                          style: const TextStyle(color: AppTheme.textMuted),
                        ),
                      ]
                    : history
                          .map(
                            (h) => Card(
                              child: ListTile(
                                leading: const Icon(
                                  Icons.history_edu_outlined,
                                  color: AppTheme.primary,
                                ),
                                title: Text(
                                  h.illnessName.isNotEmpty
                                      ? h.illnessName
                                      : langProvider.t('noIllnessName'),
                                ),
                                subtitle: Text(
                                  'Status: ${h.status}' + (h.remarks != null && h.remarks!.isNotEmpty ? ' | Remarks: ${h.remarks}' : ''),
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            ),
                          )
                          .toList(),
              ),
            ),
            const SizedBox(height: 20),

            // Daily Readings
            SectionCard(
              title: langProvider.t('healthTrends'),
              child: Column(
                children: dailyReadings.isEmpty
                    ? [
                        Text(
                          langProvider.t('noReadingsForChart'),
                          style: const TextStyle(color: AppTheme.textMuted),
                        ),
                      ]
                    : dailyReadings
                          .map(
                            (r) => Card(
                              child: ListTile(
                                leading: const Icon(
                                  Icons.monitor_heart_outlined,
                                  color: AppTheme.primary,
                                ),
                                // Use the correct fields from the updated DailyReading model
                                title: Text(
                                  "BP: ${r.bloodPressure.systolic}/${r.bloodPressure.diastolic}, Pulse: ${r.pulseRate}",
                                ),
                                subtitle: Text(
                                  "Date: ${DateFormat.yMd().add_jm().format(r.date)}",
                                ),
                              ),
                            ),
                          )
                          .toList(),
              ),
            ),
            const SizedBox(height: 20),

            // Patient Notes
            SectionCard(
              title: langProvider.t('patientNotes'),
              child: Column(
                children: [
                  ...notes.map(
                    (n) => Card(
                      child: ListTile(
                        leading: const Icon(
                          Icons.note_alt_outlined,
                          color: AppTheme.primary,
                        ),
                        title: Text(
                          n.noteText.isNotEmpty
                              ? n.noteText
                              : langProvider.t('noNoteContent'),
                        ),
                        subtitle: Text(
                          'By: ${n.createdByName ?? 'Unknown'} on ${DateFormat.yMd().format(n.createdAt)}',
                        ),
                        trailing: IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            color: AppTheme.warning,
                          ),
                          onPressed: () => _deleteNote(n.id),
                          tooltip: langProvider.t('deleteNoteTooltip'),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _noteController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: langProvider.t('doctorNotesHint'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      onPressed: _saveNote,
                      child: Text(langProvider.t('saveNote')),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // AI Chat Section
            SectionCard(
              title: langProvider.t('Ask Ai'),
              child: Column(
                children: [
                  Container(
                    height: 350, // Constrain the height of the chat view
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: _chatMessages.length,
                      itemBuilder: (context, index) {
                        return _buildChatBubble(_chatMessages[index]);
                      },
                    ),
                  ),
                  if (_isAiLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: LinearProgressIndicator(),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _chatController,
                          decoration: InputDecoration(
                            hintText: langProvider.t('Type your query here...'),
                            border: const OutlineInputBorder(),
                          ),
                          onSubmitted: _isAiLoading ? null : (_) => _askAi(),
                        ),
                      ),
                      const SizedBox(width: 10),
                      IconButton(
                        icon: const Icon(Icons.send),
                        onPressed: _isAiLoading ? null : _askAi,
                        style: IconButton.styleFrom(
                          backgroundColor: Theme.of(
                            context,
                          ).colorScheme.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
