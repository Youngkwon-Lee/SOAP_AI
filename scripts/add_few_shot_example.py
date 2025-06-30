import json
import sys

file_path = 'C:/Users/YK/SOAP_AI/functions/src/fewShotExamples.json'

new_example = {
  "specialty": "Physical Therapy",
  "input": "환자: 양쪽 무릎 관절 가동 범위 제한. 근골격계 이상 진단. 원위 햄스트링 연장술 예정.",
  "output_ko": "Subjective: 환자 양측 슬관절 가동 범위 제한 호소.\nObjective: 양측 슬관절 가동 범위 제한 관찰됨.\nAssessment: 근골격계 이상. 양측 원위 햄스트링 연장술 후 재활 필요.\nPlan: 햄스트링 스트레칭, 호흡 운동 (Air stacking ex.), 스테퍼 운동 시행.",
  "output_en": "Subjective: Pt c/o LOM of both knee joints.\nObjective: LOM observed in both knee joints.\nAssessment: Musculoskeletal anomaly. Post-op rehabilitation needed after distal hamstring lengthening (both).\nPlan: Hamstring stretching, Breathing ex. (Air stacking ex.), Stepper exercise.",
  "output_medical": "S: Pt c/o LOM B/L knee jt.\nO: LOM B/L knee jt.\nA: MSK anomaly. Post-op rehab for B/L distal hamstring lengthening.\nP: Hamstring stretch. Breathing ex. (Air stacking ex.). Stepper."
}

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    data.append(new_example)

    reformatted_json = json.dumps(data, ensure_ascii=False, indent=2)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(reformatted_json)
    print(f"Successfully added new example to {file_path}")

except json.JSONDecodeError as e:
    print(f"JSON decoding error in {file_path}: {e}", file=sys.stderr)
    sys.exit(1)
except FileNotFoundError:
    print(f"File not found: {file_path}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}", file=sys.stderr)
    sys.exit(1)