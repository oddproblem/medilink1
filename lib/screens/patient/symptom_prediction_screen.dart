import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'language_provider.dart';

class SymptomPredictionScreen extends StatefulWidget {
  const SymptomPredictionScreen({super.key});

  @override
  State<SymptomPredictionScreen> createState() =>
      _SymptomPredictionScreenState();
}

class _SymptomPredictionScreenState extends State<SymptomPredictionScreen> {
  final List<String> _allSymptoms = const [
    "itching",
    "skin_rash",
    "nodal_skin_eruptions",
    "continuous_sneezing",
    "shivering",
    "chills",
    "joint_pain",
    "stomach_pain",
    "acidity",
    "ulcers_on_tongue",
    "muscle_wasting",
    "vomiting",
    "burning_micturition",
    "spotting_ urination",
    "fatigue",
    "weight_gain",
    "anxiety",
    "cold_hands_and_feets",
    "mood_swings",
    "weight_loss",
    "restlessness",
    "lethargy",
    "patches_in_throat",
    "irregular_sugar_level",
    "cough",
    "high_fever",
    "sunken_eyes",
    "breathlessness",
    "sweating",
    "dehydration",
    "indigestion",
    "headache",
    "yellowish_skin",
    "dark_urine",
    "nausea",
    "loss_of_appetite",
    "pain_behind_the_eyes",
    "back_pain",
    "constipation",
    "abdominal_pain",
    "diarrhoea",
    "mild_fever",
    "yellow_urine",
    "yellowing_of_eyes",
    "acute_liver_failure",
    "fluid_overload",
    "swelling_of_stomach",
    "swelled_lymph_nodes",
    "malaise",
    "blurred_and_distorted_vision",
    "phlegm",
    "throat_irritation",
    "redness_of_eyes",
    "sinus_pressure",
    "runny_nose",
    "congestion",
    "chest_pain",
    "weakness_in_limbs",
    "fast_heart_rate",
    "pain_during_bowel_movements",
    "pain_in_anal_region",
    "bloody_stool",
    "irritation_in_anus",
    "neck_pain",
    "dizziness",
    "cramps",
    "bruising",
    "obesity",
    "swollen_legs",
    "swollen_blood_vessels",
    "puffy_face_and_eyes",
    "enlarged_thyroid",
    "brittle_nails",
    "swollen_extremeties",
    "excessive_hunger",
    "extra_marital_contacts",
    "drying_and_tingling_lips",
    "slurred_speech",
    "knee_pain",
    "hip_joint_pain",
    "muscle_weakness",
    "stiff_neck",
    "swelling_joints",
    "movement_stiffness",
    "spinning_movements",
    "loss_of_balance",
    "unsteadiness",
    "weakness_of_one_body_side",
    "loss_of_smell",
    "bladder_discomfort",
    "foul_smell_of urine",
    "continuous_feel_of_urine",
    "passage_of_gases",
    "internal_itching",
    "toxic_look_(typhos)",
    "depression",
    "irritability",
    "muscle_pain",
    "altered_sensorium",
    "red_spots_over_body",
    "belly_pain",
    "abnormal_menstruation",
    "dischromic _patches",
    "watering_from_eyes",
    "increased_appetite",
    "polyuria",
    "family_history",
    "mucoid_sputum",
    "rusty_sputum",
    "lack_of_concentration",
    "visual_disturbances",
    "receiving_blood_transfusion",
    "receiving_unsterile_injections",
    "coma",
    "stomach_bleeding",
    "distention_of_abdomen",
    "history_of_alcohol_consumption",
    "fluid_overload.1",
    "blood_in_sputum",
    "prominent_veins_on_calf",
    "palpitations",
    "painful_walking",
    "pus_filled_pimples",
    "blackheads",
    "scurring",
    "skin_peeling",
    "silver_like_dusting",
    "small_dents_in_nails",
    "inflammatory_nails",
    "blister",
    "red_sore_around_nose",
    "yellow_crust_ooze"
  ];

  final Set<String> _selectedSymptoms = {};
  String _searchText = '';
  bool _isLoading = false;
  String? _error;
  String? _predictedDisease;

  Future<void> _predictDisease() async {
    final lang = context.read<LanguageProvider>();
    if (_selectedSymptoms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(lang.t('pleaseSelectSymptom', 'Please select at least one symptom'))),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _predictedDisease = null;
      _error = null;
    });

    try {
      // Step 1: POST request to initiate Gradio prediction
      final postUrl = Uri.parse(
          'https://raushan2709-disease-prediction-workers.hf.space/gradio_api/call/predict_disease');
      final postPayload = {
        "data": [_selectedSymptoms.toList()]
      };

      final postResponse = await http
          .post(
            postUrl,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(postPayload),
          )
          .timeout(const Duration(seconds: 40));

      if (postResponse.statusCode != 200) {
        throw Exception(
            'Failed to initiate prediction (Status: ${postResponse.statusCode})');
      }

      final postData = jsonDecode(postResponse.body);
      final eventId = postData['event_id'];

      if (eventId == null) {
        throw Exception('Server did not return an event ID');
      }

      // Step 2: GET request to retrieve SSE result
      final getUrl = Uri.parse(
          'https://raushan2709-disease-prediction-workers.hf.space/gradio_api/call/predict_disease/$eventId');
      final getResponse =
          await http.get(getUrl).timeout(const Duration(seconds: 40));

      if (getResponse.statusCode == 200) {
        final lines = getResponse.body.split('\n');
        String? prediction;
        for (var line in lines) {
          if (line.startsWith('data:')) {
            final dataStr = line.substring(5).trim();
            final dataJson = jsonDecode(dataStr);
            if (dataJson is List && dataJson.isNotEmpty) {
              prediction = dataJson[0].toString();
              break;
            }
          }
        }

        if (prediction != null) {
          setState(() {
            _predictedDisease = prediction;
            _isLoading = false;
          });
        } else {
          throw Exception(
              'Failed to parse prediction result from server output');
        }
      } else {
        throw Exception(
            'Failed to retrieve prediction result (Status: ${getResponse.statusCode})');
      }
    } catch (e) {
      setState(() {
        _error =
            '${lang.t('predictionFailed', 'Prediction failed')}: $e. ${lang.t('serverError', 'Please verify connection.')}';
        _isLoading = false;
      });
    }
  }

  void _clearSelections() {
    setState(() {
      _selectedSymptoms.clear();
      _predictedDisease = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    // Filter symptoms based on search text, matching against localized name or raw ID
    final filteredSymptoms = _allSymptoms.where((symptom) {
      final readableRaw = symptom.replaceAll('_', ' ').toLowerCase();
      final localized = lang.t(symptom).toLowerCase();
      final query = _searchText.toLowerCase();
      return readableRaw.contains(query) || localized.contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      appBar: AppBar(
        title: Text(lang.t('aiAnalyzer2', 'AI Symptom Predictor')),
        backgroundColor: const Color(0xFF1E293B), // Slate 800
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        actions: [
          if (_selectedSymptoms.isNotEmpty)
            TextButton(
              onPressed: _clearSelections,
              child:
                  Text(lang.t('clearAll', 'Clear All'), style: const TextStyle(color: Colors.cyan)),
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(
              lang.t('selectSymptoms', 'Select all symptoms you are experiencing to predict potential illnesses.'),
              style: const TextStyle(
                  color: Color(0xFF94A3B8), fontSize: 13, height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),

            // Search Input
            TextField(
              onChanged: (text) {
                setState(() {
                  _searchText = text;
                });
              },
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: lang.t('searchSymptoms', 'Search symptoms...'),
                hintStyle: const TextStyle(color: Color(0xFF64748B)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.cyan),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Selected symptoms pill list
            if (_selectedSymptoms.isNotEmpty) ...[
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: _selectedSymptoms.map((symptom) {
                    final displayName = lang.t(symptom);
                    return Container(
                      margin: const EdgeInsets.only(right: 8),
                      child: Chip(
                        label: Text(
                          displayName,
                          style: const TextStyle(
                              color: Colors.black,
                              fontSize: 12,
                              fontWeight: FontWeight.bold),
                        ),
                        backgroundColor: Colors.cyan,
                        deleteIcon: const Icon(Icons.cancel,
                            size: 16, color: Colors.black),
                        onDeleted: () {
                          setState(() {
                            _selectedSymptoms.remove(symptom);
                          });
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Symptom Checklist
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: filteredSymptoms.isEmpty
                    ? Center(
                        child: Text(
                          lang.t('noSymptomsError', 'No matching symptoms found.'),
                          style: const TextStyle(color: Color(0xFF64748B)),
                        ),
                      )
                    : ListView.separated(
                        itemCount: filteredSymptoms.length,
                        separatorBuilder: (context, index) =>
                            const Divider(color: Color(0xFF334155), height: 1),
                        itemBuilder: (context, index) {
                          final symptom = filteredSymptoms[index];
                          final displayName = lang.t(symptom);
                          final isSelected =
                              _selectedSymptoms.contains(symptom);

                          return CheckboxListTile(
                            title: Text(
                              displayName,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 14),
                            ),
                            value: isSelected,
                            activeColor: Colors.cyan,
                            checkColor: Colors.black,
                            onChanged: (bool? checked) {
                              setState(() {
                                if (checked == true) {
                                  _selectedSymptoms.add(symptom);
                                } else {
                                  _selectedSymptoms.remove(symptom);
                                }
                              });
                            },
                          );
                        },
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Loading / Results Area
            if (_isLoading) ...[
              const CircularProgressIndicator(color: Colors.cyan),
              const SizedBox(height: 8),
              Text(
                lang.t('processing', 'Running ML Prediction...'),
                style:
                    const TextStyle(color: Colors.cyan, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 16),
            ] else if (_error != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
            ] else if (_predictedDisease != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.cyan),
                ),
                child: Column(
                  children: [
                    Text(
                      lang.t('predictionResult', 'PREDICTED ILLNESS / CONDITION:'),
                      style: const TextStyle(
                          color: Colors.cyan,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lang.t(_predictedDisease!, _predictedDisease),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      lang.t('disclaimerText', 'Disclaimer: This prediction is based on statistical correlation models and should not replace clinical diagnosis. Please consult a doctor.'),
                      style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 10,
                          fontStyle: FontStyle.italic),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Submit Button
            if (!_isLoading)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed:
                          _selectedSymptoms.isEmpty ? null : _predictDisease,
                      icon: const Icon(Icons.psychology_outlined),
                      label: Text(lang.t('predictButton', 'Predict Disease')),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.cyan.shade600,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFF334155),
                        disabledForegroundColor: const Color(0xFF64748B),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
