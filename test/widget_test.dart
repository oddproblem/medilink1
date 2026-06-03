import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:medilink1/core/network/ApiService.dart';
import 'package:medilink1/main.dart';
import 'package:medilink1/screens/patient/language_provider.dart';

void main() {
  testWidgets('welcome screen opens the sign-in landing page', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final apiService = ApiService();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider.value(value: apiService),
          ChangeNotifierProvider(
            create: (_) => LanguageProvider(apiService),
          ),
        ],
        child: const MediLinkApp(),
      ),
    );

    expect(find.text('SwiftMediLink'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);

    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    expect(find.text('Doctor Sign In'), findsOneWidget);
    expect(find.text('Patient Sign In'), findsOneWidget);
  });
}
