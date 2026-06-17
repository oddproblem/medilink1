import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:medilink1/screens/patient_detail_screen.dart';
import 'package:medilink1/core/models/Patient.dart';
import 'package:medilink1/core/network/ApiService.dart';
import 'package:medilink1/widgets/stat_card.dart';
import 'package:medilink1/app_theme.dart';

import '../patient/language_provider.dart';

class DoctorDashboard extends StatefulWidget {
  const DoctorDashboard({super.key});

  @override
  State<DoctorDashboard> createState() => _DoctorDashboardState();
}

class _DoctorDashboardState extends State<DoctorDashboard> {
  final ApiService _apiService = ApiService();
  final SearchController _searchController = SearchController();

  List<Patient> _allPatients = [];
  bool isLoading = true;

  // Doctor stats
  int totalPatients = 0;
  int currentlyTreating = 0;
  int patientsDischarged = 0;

  @override
  void initState() {
    super.initState();
    _initializeDashboard(); // Fire and forget
  }

  void _initializeDashboard() async {
    try {
      // Fetch initial data in parallel
      await Future.wait([_fetchPatients(), _fetchStats()]);
    } catch (e) {
      debugPrint("Initialization failed: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to initialize dashboard: $e')),
        );
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchPatients() async {
    if (!mounted) return;
    await _apiService.init();
    try {
      final fetchedPatients = await _apiService.getPatientsByStatus(
        'under treatment',
      );
      setState(() {
        // The list now only contains patients under treatment
        _allPatients = fetchedPatients;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load patients: $e')));
      }
      debugPrint("Failed to fetch patients: $e");
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchStats() async {
    await _apiService.init();
    try {
      // This fetches general stats, same as the web dashboard.
      final stats = await _apiService.getPatientStatistics();
      if (mounted) {
        setState(() {
          // Keys from the backend: totalPatients, patientsBeingseen, patientsDischarged
          totalPatients = stats['totalPatients'] ?? 0;
          currentlyTreating = stats['patientsBeingCured'] ?? 0;
          patientsDischarged = stats['patientsDischarged'] ?? 0;
        });
      }
    } catch (e) {
      debugPrint("Failed to fetch stats: $e");
      // Optionally show a snackbar, but for stats, failing silently might be okay.
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text(langProvider.t('doctorDashboard', 'Doctor Dashboard')),
        automaticallyImplyLeading: false, // Remove back button
        actions: [
          IconButton(
            onPressed: () =>
                Navigator.of(context).pushNamed('/appointments/doctor'),
            icon: const Icon(Icons.calendar_month_outlined),
            tooltip: langProvider.t('myAppointments', 'Appointments'),
          ),
          // Language Dropdown
          if (langProvider.isTranslating)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
            )
          else
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: langProvider.selectedLanguage,
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    context.read<LanguageProvider>().setLanguage(newValue);
                  }
                },
                items: langProvider.supportedLanguages
                    .map<DropdownMenuItem<String>>((lang) {
                  return DropdownMenuItem<String>(
                    value: lang['value']!,
                    child: Text(
                      lang['label']!,
                      style: const TextStyle(color: Colors.black),
                    ),
                  );
                }).toList(),
                dropdownColor: Colors.white,
                icon: const Icon(Icons.language, color: Colors.white),
              ),
            ),
          IconButton(
            onPressed: () {
              _apiService.logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/landing',
                (Route<dynamic> route) => false,
              );
            },
            icon: const Icon(Icons.logout),
            tooltip: langProvider.t('logout', 'Log out'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // API-driven search bar, as seen in the web app.
            SearchAnchor(
              searchController: _searchController,
              builder: (BuildContext context, SearchController controller) {
                return SearchBar(
                  controller: controller,
                  padding: const WidgetStatePropertyAll<EdgeInsets>(
                    EdgeInsets.symmetric(horizontal: 16.0),
                  ),
                  onTap: () => controller.openView(),
                  onChanged: (_) => controller.openView(),
                  leading: const Icon(Icons.search),
                  hintText: langProvider.t('searchPatientPlaceholder', 'Search patients by name...'),
                );
              },
              suggestionsBuilder:
                  (BuildContext context, SearchController controller) async {
                if (controller.text.isEmpty) {
                  return []; // No suggestions if search is empty
                }
                // Fetch suggestions from the correct API endpoint
                final List<Patient> results =
                    await _apiService.searchPatients(controller.text);

                if (!mounted) return [];

                return List<ListTile>.generate(results.length, (int index) {
                  final Patient item = results[index];
                  return ListTile(
                    title: Text(item.name),
                    onTap: () {
                      controller.closeView(item.name);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PatientDetailScreen(patient: item),
                        ),
                      );
                    },
                  );
                });
              },
            ),
            const SizedBox(height: 20),

            // Doctor stats summary
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: StatCard(
                    title: langProvider.t('totalPatients', 'Total Patients'),
                    value: totalPatients.toString(),
                    icon: Icons.groups_outlined,
                    gradient: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    title: langProvider.t('currentlyTreating', 'Currently Treating'),
                    value: currentlyTreating.toString(),
                    icon: Icons.monitor_heart_outlined,
                    gradient: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Patient list
            Text(
              langProvider.t('patientsUnderTreatment'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _allPatients.isEmpty
                      ? Center(
                          child: Text(
                            _searchController.text.isEmpty
                                ? langProvider.t('noPatientsFound', 'No patients are currently under treatment.')
                                : langProvider.t('noPatientsFound', 'No patients match your search'),
                          ),
                        )
                      : ListView.builder(
                          itemCount: _allPatients.length,
                          itemBuilder: (context, index) {
                            final patient = _allPatients[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(
                                side: BorderSide(
                                  color: Colors.grey.shade200,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  child: Icon(Icons.person),
                                ),
                                title: Text(patient.name),
                                trailing: const Icon(Icons.arrow_forward_ios),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          PatientDetailScreen(patient: patient),
                                    ),
                                  );
                                },
                              ),
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
