import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../app_theme.dart';
import '../../core/network/ApiService.dart';
import '../../widgets/section_card.dart';

class DiseaseHotspotsScreen extends StatefulWidget {
  const DiseaseHotspotsScreen({super.key});

  @override
  State<DiseaseHotspotsScreen> createState() => _DiseaseHotspotsScreenState();
}

class _DiseaseHotspotsScreenState extends State<DiseaseHotspotsScreen> {
  final ApiService _apiService = ApiService();
  final _searchController = TextEditingController();
  
  bool _isLoading = false;
  List<dynamic> _hotspots = [];
  bool _hasSearched = false;

  // Preset common diseases for easy selection
  final List<String> _commonDiseases = [
    'Chickenpox',
    'Flu',
    'Covid-19',
    'Malaria',
    'Cholera',
  ];

  @override
  void initState() {
    super.initState();
    _apiService.init();
    // Default search term
    _searchController.text = _commonDiseases[0];
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchHotspots() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an illness name')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });

    try {
      final results = await _apiService.getDiseaseHotspots(query);
      setState(() {
        _hotspots = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load hotspots: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Disease Outbreak Hotspots'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Control Card
            SectionCard(
              title: 'Search Hotspots',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Query the central database for active outbreaks. Enter a disease name to inspect case distribution and locations.',
                    style: TextStyle(color: AppTheme.textMuted, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  
                  // Common presets list
                  const Text(
                    'Quick Selection:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: _commonDiseases.map((disease) {
                      final isSelected = _searchController.text.toLowerCase() == disease.toLowerCase();
                      return ChoiceChip(
                        label: Text(disease),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _searchController.text = disease;
                            });
                            _fetchHotspots();
                          }
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Custom text search field
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      labelText: 'Illness Name',
                      hintText: 'e.g. Chickenpox, Flu, Cholera',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.search),
                        onPressed: _fetchHotspots,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  ElevatedButton(
                    onPressed: _isLoading ? null : _fetchHotspots,
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Search Active Cases'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Results Section
            if (_hasSearched) ...[
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else ...[
                // Case Count Summary Card
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primary, AppTheme.accent],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ACTIVE OUTBREAK CASES: ${_searchController.text.toUpperCase()}',
                              style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${_hotspots.length}',
                              style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Simulated Interactive Map HUD
                SectionCard(
                  title: 'Active Hotspots Map HUD',
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                    ),
                    child: Stack(
                      children: [
                        // Futuristic Radar Circles
                        Center(
                          child: Container(
                            width: 150,
                            height: 150,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.primary.withOpacity(0.08), width: 1.5),
                            ),
                          ),
                        ),
                        Center(
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.primary.withOpacity(0.12), width: 1.5),
                            ),
                          ),
                        ),
                        // Stylized Grid Overlay for map feeling
                        Positioned.fill(
                          child: Opacity(
                            opacity: 0.1,
                            child: GridPaper(
                              color: AppTheme.primary,
                              divisions: 2,
                              subdivisions: 1,
                              interval: 100,
                            ),
                          ),
                        ),
                        
                        // Render simulated markers for each hotspot
                        if (_hotspots.isEmpty)
                          const Center(
                            child: Text(
                              'No Active Case Clusters Found',
                              style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold),
                            ),
                          )
                        else
                          ..._hotspots.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final spot = entry.value;
                            // Calculate simple mock offsets inside grid using coordinates
                            final loc = spot['location'];
                            double lat = 0.0;
                            double lng = 0.0;
                            if (loc != null && loc['coordinates'] is List && (loc['coordinates'] as List).length >= 2) {
                              lng = (loc['coordinates'][0] as num).toDouble();
                              lat = (loc['coordinates'][1] as num).toDouble();
                            }
                            
                            // Map coords into simple screen space offsets [0.1 to 0.9]
                            final xOffset = 0.1 + ((lng.abs() * 17) % 0.8);
                            final yOffset = 0.1 + ((lat.abs() * 13) % 0.8);

                            return Align(
                              alignment: FractionalOffset(xOffset, yOffset),
                              child: Tooltip(
                                message: 'Case ${idx + 1}: ${spot['hospital'] ?? 'Unknown location'}',
                                child: Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.3),
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Detailed Cases Card List
                const Text(
                  'Case Registry Details:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),

                if (_hotspots.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Text(
                        'No ongoing cases found for this illness in the system database.',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _hotspots.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final spot = _hotspots[index];
                      final dateStr = spot['diagnosisDate'] != null
                          ? DateFormat('yMMMMd').format(DateTime.parse(spot['diagnosisDate']))
                          : 'Unknown Date';
                      
                      final loc = spot['location'];
                      String coordsStr = 'No Coordinates';
                      if (loc != null && loc['coordinates'] is List && (loc['coordinates'] as List).length >= 2) {
                        coordsStr = 'Long: ${loc['coordinates'][0]}, Lat: ${loc['coordinates'][1]}';
                      }

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade50,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 18),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      spot['hospital'] ?? 'Anonymous Treatment Center',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Diagnosis Date:', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  Text(dateStr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Geolocation Coords:', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  Text(coordsStr, style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
                                ],
                              ),
                              if (spot['remarks'] != null && spot['remarks'].toString().isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Remarks: ${spot['remarks']}',
                                  style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
