import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app_theme.dart';
import '../../core/network/ApiService.dart';
import '../../widgets/section_card.dart';
import 'language_provider.dart';

class EmergencyDashboardScreen extends StatefulWidget {
  const EmergencyDashboardScreen({super.key});

  @override
  State<EmergencyDashboardScreen> createState() =>
      _EmergencyDashboardScreenState();
}

class _EmergencyDashboardScreenState extends State<EmergencyDashboardScreen> {
  final ApiService _apiService = ApiService();

  bool _isLoadingContacts = true;
  bool _isLoadingDoctors = true;
  bool _isLoadingHospitals = true;
  bool _isDispatchingAlert = false;

  List<dynamic> _contacts = [];
  List<dynamic> _doctors = [];
  List<dynamic> _hospitals = [];

  // Controllers for adding emergency contacts
  final _nameCtrl = TextEditingController();
  final _relationCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _relationCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    await _apiService.init();
    _fetchContacts();
    _fetchDoctors();
    _fetchHospitals();
  }

  Future<void> _fetchContacts() async {
    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) return;

      final results = await _apiService.getEmergencyContacts(currentUser.id);
      if (mounted) {
        setState(() {
          _contacts = results;
          _isLoadingContacts = false;
        });
      }
    } catch (e) {
      debugPrint("Failed to load emergency contacts: $e");
      if (mounted) setState(() => _isLoadingContacts = false);
    }
  }

  Future<void> _fetchDoctors() async {
    try {
      final results = await _apiService.getEmergencyDoctors();
      if (mounted) {
        setState(() {
          _doctors = results;
          _isLoadingDoctors = false;
        });
      }
    } catch (e) {
      debugPrint("Failed to load emergency doctors: $e");
      if (mounted) setState(() => _isLoadingDoctors = false);
    }
  }

  Future<void> _fetchHospitals() async {
    try {
      final results = await _apiService.getEmergencyHospitals();
      if (mounted) {
        setState(() {
          _hospitals = results;
          _isLoadingHospitals = false;
        });
      }
    } catch (e) {
      debugPrint("Failed to load emergency hospitals: $e");
      if (mounted) setState(() => _isLoadingHospitals = false);
    }
  }

  Future<void> _triggerAlert() async {
    final langProvider = context.read<LanguageProvider>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: Colors.red, size: 28),
            const SizedBox(width: 8),
            Text(langProvider.t('confirmEmergency', 'Confirm Emergency')),
          ],
        ),
        content: Text(
          langProvider.t(
            'sosConfirmDesc',
            'Are you sure you want to trigger a medical emergency alert?\n\nThis will instantly dispatch alerts to your emergency contacts, nearby physicians, and hospital authorities.',
          ),
          style: const TextStyle(height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(langProvider.t('cancel', 'Cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: Text(
              langProvider.t('sosEmergency', 'SOS Emergency'),
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isDispatchingAlert = true);

    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) throw Exception('User not logged in');

      final response = await _apiService.triggerEmergencyAlert(currentUser.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade800,
            content: Text(
              response['message'] ??
                  langProvider.t('emergencyAlertSuccess', 'Emergency Alerts Dispatched Successfully!'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${langProvider.t('failedToTriggerAlert', 'Failed to trigger alert')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDispatchingAlert = false);
    }
  }

  Future<void> _addContact() async {
    final langProvider = context.read<LanguageProvider>();
    final name = _nameCtrl.text.trim();
    final relation = _relationCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();

    if (name.isEmpty || relation.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(langProvider.t('fillAllFields', 'Please fill out all fields.'))),
      );
      return;
    }

    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) return;

      final contactData = {
        'patientId': currentUser.id,
        'name': name,
        'relationship': relation,
        'phone': phone,
      };

      await _apiService.createEmergencyContact(contactData);

      _nameCtrl.clear();
      _relationCtrl.clear();
      _phoneCtrl.clear();

      if (mounted) {
        Navigator.of(context).pop(); // Close sheet/dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(langProvider.t('contactAddedSuccess', 'Emergency Contact Added Successfully.')),
          ),
        );
      }

      _fetchContacts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add contact: $e')),
        );
      }
    }
  }

  Future<void> _deleteContact(String contactId) async {
    final langProvider = context.read<LanguageProvider>();
    try {
      await _apiService.deleteEmergencyContact(contactId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(langProvider.t('contactRemoved', 'Emergency Contact Removed.'))),
        );
      }
      _fetchContacts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete contact: $e')),
        );
      }
    }
  }

  void _showAddContactDialog() {
    final langProvider = context.read<LanguageProvider>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                langProvider.t('addContact', 'Add Emergency Contact'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _nameCtrl,
                decoration: InputDecoration(labelText: langProvider.t('name', 'Name')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _relationCtrl,
                decoration: InputDecoration(
                  labelText: langProvider.t('relationship', 'Relationship (e.g. Spouse, Friend)'),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: langProvider.t('phoneNumber', 'Phone Number')),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _addContact,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: Text(
                  langProvider.t('save', 'Save'),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text(langProvider.t('Emergency', 'Emergency Assistance')),
        backgroundColor: Colors.red.shade800,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Red alert hub panel
            Row(
              children: [
                Expanded(
                  child: Card(
                    color: Colors.red.shade50,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: Colors.red.shade200, width: 1),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          const Icon(Icons.error_outline_rounded,
                              color: Colors.red, size: 54),
                          const SizedBox(height: 12),
                          Text(
                            langProvider.t('Emergency', 'SOS Emergency Trigger'),
                            style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.red),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            langProvider.t(
                              'sosEmergencyDesc',
                              'Click the button below in case of medical crisis to dispatch location coordinates and notify medical emergency responders.',
                            ),
                            style: TextStyle(
                                color: Colors.red.shade900,
                                fontSize: 13,
                                height: 1.4),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),
                          Center(
                            child: GestureDetector(
                              onTap: _isDispatchingAlert ? null : _triggerAlert,
                              child: Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.red.shade800,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.red.withOpacity(0.3),
                                      blurRadius: 15,
                                      spreadRadius: 5,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                  border:
                                      Border.all(color: Colors.white, width: 4),
                                ),
                                alignment: Alignment.center,
                                child: _isDispatchingAlert
                                    ? const SizedBox(
                                        width: 32,
                                        height: 32,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 3,
                                            color: Colors.white),
                                      )
                                    : Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          const Icon(Icons.health_and_safety,
                                              color: Colors.white, size: 28),
                                          const SizedBox(height: 4),
                                          Text(
                                            langProvider.t('sosEmergency', 'SOS'),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.w900,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Emergency Contacts Section
            SectionCard(
              title: langProvider.t('patientsContacts', 'Emergency Contacts'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _isLoadingContacts
                      ? const Center(child: CircularProgressIndicator())
                      : _contacts.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12.0),
                              child: Text(
                                langProvider.t(
                                  'noContactsFound',
                                  'No emergency contacts added yet. Add close friends or family members to receive notifications.',
                                ),
                                style: const TextStyle(color: AppTheme.textMuted),
                              ),
                            )
                          : ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _contacts.length,
                              separatorBuilder: (_, __) => const Divider(),
                              itemBuilder: (context, index) {
                                final contact = _contacts[index];
                                return ListTile(
                                  leading: const CircleAvatar(
                                    backgroundColor: Colors.red,
                                    child:
                                        Icon(Icons.person, color: Colors.white),
                                  ),
                                  title: Text(
                                    contact['name'] ?? 'Unknown Name',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                    '${contact['relationship']} • ${contact['phone']}',
                                    style: const TextStyle(
                                        color: AppTheme.textMuted),
                                  ),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete_outline,
                                        color: Colors.red),
                                    onPressed: () =>
                                        _deleteContact(contact['_id']),
                                  ),
                                );
                              },
                            ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _showAddContactDialog,
                    icon: const Icon(Icons.add, color: Colors.red),
                    label: Text(langProvider.t('addContact', 'Add Contact')),
                    style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade900,
                        side: BorderSide(color: Colors.red.shade200)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Emergency Doctors List
            SectionCard(
              title: langProvider.t('systemDoctors', 'Emergency Doctors On Duty'),
              child: _isLoadingDoctors
                  ? const Center(child: CircularProgressIndicator())
                  : _doctors.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                              langProvider.t('noDoctorsFound', 'No emergency doctors registered on duty currently.'),
                              style: const TextStyle(color: AppTheme.textMuted)),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _doctors.length,
                          separatorBuilder: (_, __) => const Divider(),
                          itemBuilder: (context, index) {
                            final doc = _doctors[index];
                            return ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: AppTheme.primary,
                                child: Icon(Icons.local_hospital,
                                    color: Colors.white),
                              ),
                              title: Text(doc['name'] ?? 'Doctor',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold)),
                              subtitle:
                                  Text('${doc['specialty']} • ${doc['phone']}'),
                              trailing: doc['hospitalAffiliation'] != null
                                  ? Chip(
                                      label: Text(doc['hospitalAffiliation']))
                                  : null,
                            );
                          },
                        ),
            ),
            const SizedBox(height: 16),

            // Emergency Hospitals List
            SectionCard(
              title: langProvider.t('systemHospitals', 'Emergency Trauma Centers'),
              child: _isLoadingHospitals
                  ? const Center(child: CircularProgressIndicator())
                  : _hospitals.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                              langProvider.t('noHospitalsFound', 'No emergency hospital centers registered.'),
                              style: const TextStyle(color: AppTheme.textMuted)),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _hospitals.length,
                          separatorBuilder: (_, __) => const Divider(),
                          itemBuilder: (context, index) {
                            final hosp = _hospitals[index];
                            final loc = hosp['location'];
                            String coordsStr = '';
                            if (loc != null &&
                                loc['coordinates'] is List &&
                                (loc['coordinates'] as List).length >= 2) {
                              coordsStr =
                                  'Coords: [${loc['coordinates'][0]}, ${loc['coordinates'][1]}]';
                            }
                            return ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  shape: BoxShape.circle,
                                ),
                                child:
                                    const Icon(Icons.domain, color: Colors.red),
                              ),
                              title: Text(hosp['name'] ?? 'Hospital',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(hosp['address'] ??
                                      'No address registered'),
                                  Text('${langProvider.t('phoneNumber', 'Phone')}: ${hosp['phone']}'),
                                  if (coordsStr.isNotEmpty)
                                    Text(coordsStr,
                                        style: const TextStyle(
                                            fontFamily: 'monospace',
                                            fontSize: 11)),
                                ],
                              ),
                              isThreeLine: true,
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
