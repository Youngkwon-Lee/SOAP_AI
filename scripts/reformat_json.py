import json
import sys

file_path = 'C:/Users/YK/SOAP_AI/src/data/fewShotExamples.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    reformatted_json = json.dumps(data, ensure_ascii=False, indent=2)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(reformatted_json)
    print(f"Successfully reformatted {file_path}")

except json.JSONDecodeError as e:
    print(f"JSON decoding error in {file_path}: {e}", file=sys.stderr)
    sys.exit(1)
except FileNotFoundError:
    print(f"File not found: {file_path}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}", file=sys.stderr)
    sys.exit(1)