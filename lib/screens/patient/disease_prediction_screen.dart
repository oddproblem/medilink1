import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import '../../app_theme.dart';
import '../../widgets/section_card.dart';

class DiseasePredictionScreen extends StatefulWidget {
  const DiseasePredictionScreen({super.key});

  @override
  State<DiseasePredictionScreen> createState() => _DiseasePredictionScreenState();
}

class _DiseasePredictionScreenState extends State<DiseasePredictionScreen> {
  final ImagePicker _picker = ImagePicker();
  String? _selectedImagePath;
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _predictionResult;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        setState(() {
          _selectedImagePath = image.path;
          _predictionResult = null;
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick image: $e';
      });
    }
  }

  Future<void> _predictCondition() async {
    if (_selectedImagePath == null) return;

    setState(() {
      _isLoading = true;
      _predictionResult = null;
      _error = null;
    });

    try {
      final url = Uri.parse('https://Raushan2709-Disease-Detection.hf.space/predict');
      final request = http.MultipartRequest('POST', url);
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          _selectedImagePath!,
          filename: 'skin_image.jpg',
        ),
      );

      final streamedResponse = await request.send().timeout(const Duration(seconds: 120));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        setState(() {
          _predictionResult = decoded;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Server returned error status: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Prediction failed: $e. Please verify your internet connection.';
        _isLoading = false;
      });
    }
  }

  void _clearImage() {
    setState(() {
      _selectedImagePath = null;
      _predictionResult = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900 dark theme background
      appBar: AppBar(
        title: const Text('AI Skin Disease Predictor'),
        backgroundColor: const Color(0xFF1E293B), // Slate 800
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 10),
            const Text(
              'Upload an image of a skin condition for instant AI analysis and precautions.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 24),
            
            // Image Preview / Upload Area
            Center(
              child: _selectedImagePath == null
                  ? GestureDetector(
                      onTap: () => _showPickerOptions(context),
                      child: Container(
                        width: double.infinity,
                        height: 220,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF334155), width: 2),
                        ),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_outlined, size: 54, color: Colors.cyan),
                            SizedBox(height: 16),
                            Text(
                              'Tap to Provide Skin Image',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Supports Camera or Photo Gallery',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.file(
                            File(_selectedImagePath!),
                            height: 240,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: CircleAvatar(
                            backgroundColor: Colors.black.withOpacity(0.7),
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.white),
                              onPressed: _clearImage,
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 20),
            
            if (_selectedImagePath != null && !_isLoading && _predictionResult == null) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _predictCondition,
                      icon: const Icon(Icons.analytics_outlined),
                      label: const Text('Predict Condition'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.cyan.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],

            if (_isLoading) ...[
              const SizedBox(height: 20),
              const CircularProgressIndicator(color: Colors.cyan),
              const SizedBox(height: 12),
              const Text(
                'Analyzing Image using AI...',
                style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 20),
            ],

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Prediction Results Display
            if (_predictionResult != null) ...[
              _buildResultCard(_predictionResult!),
              const SizedBox(height: 20),
            ],
            
            // Camera / Upload Action Bar when image is not selected
            if (_selectedImagePath == null) ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: const Icon(Icons.camera, color: Colors.cyan),
                      label: const Text('Use Camera', style: TextStyle(color: Colors.cyan)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF334155)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library, color: Colors.cyan),
                      label: const Text('Gallery', style: TextStyle(color: Colors.cyan)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF334155)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result) {
    final prediction = result['prediction'] ?? 'Unknown Condition';
    final double confidence = double.tryParse(result['confidence']?.toString() ?? '0.0') ?? 0.0;
    final description = result['description'] ?? 'No description provided.';
    final precautions = result['precautions'] as List<dynamic>? ?? [];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Slate 800
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.cyan.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  prediction,
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.cyan.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${confidence.toStringAsFixed(1)}% Match',
                  style: const TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Confidence progress bar
          LinearProgressIndicator(
            value: confidence / 100,
            color: Colors.cyan,
            backgroundColor: const Color(0xFF334155),
            minHeight: 6,
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(height: 16),

          Text(
            description,
            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: 20),

          if (precautions.isNotEmpty) ...[
            const Text(
              'Recommended Precautions:',
              style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),
            ...precautions.map((prec) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(color: Colors.cyan, fontSize: 16, fontWeight: FontWeight.bold)),
                    Expanded(
                      child: Text(
                        prec.toString(),
                        style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 13),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],

          const SizedBox(height: 20),
          const Divider(color: Color(0xFF334155)),
          const SizedBox(height: 8),
          const Text(
            'Disclaimer: This is an AI-based prediction and does not substitute a medical diagnosis. Always consult a certified healthcare professional for diagnosis and treatment.',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  void _showPickerOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt, color: Colors.cyan),
                title: const Text('Take a Photo', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.cyan),
                title: const Text('Choose from Gallery', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
