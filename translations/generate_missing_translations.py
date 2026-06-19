"""
Script to automatically translate and sync missing keys for all supported languages.
It compares the base English strings in LanguageProvider.dart against the static translation
JSON files, translates any missing strings using the deployed translation service, and merges them.

Usage:
  python translations/generate_missing_translations.py
"""
import os
import re
import json
import time
import urllib.request
import urllib.parse
import sys

# Set standard output encoding to UTF-8 to prevent charmap/console errors on Windows
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

TRANSLATE_URL = "https://translation-api-o0gb.onrender.com/translate"

# Paths in the workspace
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROVIDER_FILE = os.path.join(WORKSPACE_DIR, "lib", "screens", "patient", "language_provider.dart")
FLUTTER_TRANSLATIONS_DIR = os.path.join(WORKSPACE_DIR, "translations")
REACT_TRANSLATIONS_DIR = os.path.join(WORKSPACE_DIR, "src", "translations")

# Supported languages (excluding English)
ALL_LANGUAGES = [
    "hi", "ml", "bn", "mr", "ta", "te", "as", "bho", "doi",
    "gu", "kn", "kok", "mai", "mni-Mtei", "ne", "or", "pa",
    "sa", "sd", "ur", "fr", "es", "de", "zh", "ar", "ru", "ja", "pt"
]

def get_base_texts():
    """Extract default English strings from LanguageProvider._baseTexts."""
    print("Extracting base English texts from LanguageProvider.dart...")
    if not os.path.exists(PROVIDER_FILE):
        print(f"Error: LanguageProvider file not found at {PROVIDER_FILE}")
        sys.exit(1)

    with open(PROVIDER_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Locate the _baseTexts map block
    match = re.search(r'static const Map<String, String> _baseTexts = \{(.*?)\};', content, re.DOTALL)
    if not match:
        print("Error: Could not find _baseTexts map in LanguageProvider.dart")
        sys.exit(1)

    base_texts_block = match.group(1)
    base_texts = {}
    
    # Parse lines inside the _baseTexts block
    # Matches: 'key': 'value', or "key": "value"
    # Handles multi-line values concatenated with string literals
    lines = base_texts_block.split('\n')
    current_key = None
    current_val_parts = []
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//'):
            continue
            
        # Try to find key declaration
        decl_match = re.match(r"['\"]([^'\"]+)['\"]\s*:\s*(.*)", line)
        if decl_match:
            # Save previous if any
            if current_key:
                base_texts[current_key] = "".join(current_val_parts)
            
            current_key = decl_match.group(1)
            val_part = decl_match.group(2).strip()
            
            # Remove trailing comma if present on the same line
            if val_part.endswith(','):
                val_part = val_part[:-1].strip()
            
            # Extract string content from quotes
            q_match = re.findall(r"['\"](.*?)['\"]", val_part)
            current_val_parts = q_match if q_match else [val_part]
        elif current_key:
            # Continuing value for the current key
            q_match = re.findall(r"['\"](.*?)['\"]", line)
            if q_match:
                current_val_parts.extend(q_match)
                
    # Save the last key
    if current_key:
        base_texts[current_key] = "".join(current_val_parts)
        
    print(f"Successfully extracted {len(base_texts)} base English strings.")
    return base_texts

def translate_batch(texts, target_lang):
    """Call the deployed Render Python translation service."""
    data = json.dumps({"q": texts, "target": target_lang}).encode("utf-8")
    req = urllib.request.Request(
        TRANSLATE_URL,
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["translations"]

def translate_missing_keys(base_texts, lang_file, target_lang):
    """Identify missing keys and translate their English values."""
    if not os.path.exists(lang_file):
        print(f"  Translation file {lang_file} does not exist. Starting fresh.")
        existing_data = {}
    else:
        with open(lang_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

    # Determine which keys are missing or have placeholder empty/null/English key fallback values
    missing_keys = []
    missing_values = []
    for k, v in base_texts.items():
        if k not in existing_data or not existing_data[k] or existing_data[k] == k:
            missing_keys.append(k)
            missing_values.append(v)

    if not missing_keys:
        print(f"  All keys are already translated for '{target_lang}'.")
        return existing_data, 0

    print(f"  Translating {len(missing_keys)} missing strings to '{target_lang}'...")
    
    # Translate in batches of 25 to avoid HTTP request timeouts or rate-limiting
    BATCH_SIZE = 25
    translated_entries = {}
    
    for i in range(0, len(missing_keys), BATCH_SIZE):
        batch_keys = missing_keys[i:i+BATCH_SIZE]
        batch_vals = missing_values[i:i+BATCH_SIZE]
        
        print(f"    Batch {i//BATCH_SIZE + 1}/{(len(missing_keys) + BATCH_SIZE - 1)//BATCH_SIZE}...")
        try:
            results = translate_batch(batch_vals, target_lang)
            for k, trans in zip(batch_keys, results):
                translated_entries[k] = trans
        except Exception as e:
            print(f"    Warning: Batch {i//BATCH_SIZE + 1} failed: {e}. Retrying individually...")
            # If batch fails, try translating one-by-one to avoid losing the entire batch
            for k, val in zip(batch_keys, batch_vals):
                try:
                    res = translate_batch([val], target_lang)
                    translated_entries[k] = res[0]
                except Exception as ex:
                    print(f"      Failed to translate '{k}': {ex}")
                    translated_entries[k] = val # fallback to English original
                    
        time.sleep(1.0) # Graceful delay to respect rate limit

    # Merge translations
    merged_data = {**existing_data, **translated_entries}
    return merged_data, len(translated_entries)

def main():
    print(f"Workspace root directory: {WORKSPACE_DIR}")
    base_texts = get_base_texts()
    
    os.makedirs(FLUTTER_TRANSLATIONS_DIR, exist_ok=True)
    os.makedirs(REACT_TRANSLATIONS_DIR, exist_ok=True)

    # Process all supported languages
    for lang in ALL_LANGUAGES:
        print(f"\n==================================================")
        print(f"Processing language: {lang}")
        print(f"==================================================")
        
        flutter_file = os.path.join(FLUTTER_TRANSLATIONS_DIR, f"{lang}.json")
        react_file = os.path.join(REACT_TRANSLATIONS_DIR, f"{lang}.json")
        
        # Determine the best source file to compare against (either Flutter or React file)
        source_file = flutter_file if os.path.exists(flutter_file) else react_file
        
        try:
            # Get updated translations map
            updated_translations, count = translate_missing_keys(base_texts, source_file, lang)
            
            if count > 0:
                # Write to Flutter assets
                with open(flutter_file, 'w', encoding='utf-8') as f:
                    json.dump(updated_translations, f, ensure_ascii=False, indent=2)
                
                # Write to React assets
                with open(react_file, 'w', encoding='utf-8') as f:
                    json.dump(updated_translations, f, ensure_ascii=False, indent=2)
                    
                print(f"  Successfully synced {lang}: Added/Updated {count} strings.")
            else:
                # Even if no translations were updated, ensure both files are synchronized
                if not os.path.exists(react_file) and os.path.exists(flutter_file):
                    with open(flutter_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    with open(react_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    print(f"  Synced copy of translations to React path.")
                elif not os.path.exists(flutter_file) and os.path.exists(react_file):
                    with open(react_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    with open(flutter_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    print(f"  Synced copy of translations to Flutter path.")
                else:
                    print(f"  {lang} translation files are already perfectly synced.")
                    
        except Exception as e:
            print(f"Error processing language '{lang}': {e}")
            
    print("\nAll languages have been processed and synced successfully!")

if __name__ == "__main__":
    main()
