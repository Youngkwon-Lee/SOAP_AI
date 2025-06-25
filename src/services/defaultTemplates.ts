import { TemplateFormData } from '../types';

// 전문과별 기본 템플릿 정의
export const DEFAULT_TEMPLATES: TemplateFormData[] = [
  // 1. 내과 템플릿 (만성질환 관리 중심)
  {
    name: '내과 기본 템플릿',
    profession: 'doctor',
    specialty: '내과',
    format: `**SUBJECTIVE (주관적 소견)**
- 주호소(Chief Complaint): 
- 현재 병력(Present Illness): 
- 과거 병력(Past Medical History): 
- 복용 약물(Current Medications): 
- 알레르기(Allergies): 
- 사회력(Social History): 
- 가족력(Family History): 

**OBJECTIVE (객관적 소견)**
- 활력 징후(Vital Signs): 
  • 혈압(BP): 
  • 맥박(HR): 
  • 호흡수(RR): 
  • 체온(BT): 
  • 산소포화도(SpO2): 
- 신체 검진(Physical Examination): 
  • 일반 상태: 
  • 심폐 청진: 
  • 복부 촉진: 
  • 사지 부종: 
- 검사 결과(Laboratory/Imaging): 

**ASSESSMENT (평가)**
- 진단(Diagnosis): 
- 감별 진단(Differential Diagnosis): 
- 중증도 평가: 
- 예후 판단: 

**PLAN (계획)**
- 치료 계획(Treatment Plan): 
- 처방(Medications): 
- 생활 습관 교정(Lifestyle Modifications): 
- 추적 관찰(Follow-up): 
- 환자 교육(Patient Education): `,
    example: `**SUBJECTIVE**
주호소: 3일간 지속되는 가슴 답답함과 호흡곤란
현재 병력: 3일 전부터 시작된 가슴 답답함, 계단 오를 때 호흡곤란 악화, 야간에 숨이 차서 깸
과거 병력: 고혈압 10년, 당뇨병 5년
복용 약물: 로사르탄 50mg, 메트포르민 500mg
알레르기: 페니실린 알레르기
사회력: 금연 2년 전, 음주 주 2회
가족력: 부모 모두 고혈압, 아버지 심근경색 병력

**OBJECTIVE**
활력 징후: BP 160/95, HR 88, RR 20, BT 36.5°C, SpO2 96%
신체 검진: 하지 함요 부종(+), 심음 규칙적, 폐하부 습성 음성(+)
검사 결과: 
- 흉부 X-ray: 심비대, 폐울혈 소견
- ECG: 좌심실 비대
- BNP: 450 pg/mL (상승)

**ASSESSMENT**
1. 급성 심부전 악화 (NYHA Class II-III)
2. 조절되지 않는 고혈압
3. 2형 당뇨병

**PLAN**
치료 계획: 이뇨제 투여, 혈압 조절 강화
처방: 푸로세마이드 40mg, ACE 억제제 증량
생활 습관: 염분 제한 (<2g/day), 수분 제한
추적 관찰: 1주 후 외래, 체중 일일 측정
환자 교육: 심부전 증상 인지 및 대처법`
  },

  // 2. 외과 템플릿 (수술 및 처치 중심)
  {
    name: '외과 기본 템플릿',
    profession: 'doctor',
    specialty: '외과',
    format: `**SUBJECTIVE (주관적 소견)**
- 주호소(Chief Complaint): 
- 현재 병력(Present Illness): 
- 통증 양상(Pain Assessment): 
  • 부위/강도(Location/Intensity): 
  • 악화/완화 요인: 
- 과거 수술력(Previous Surgery): 
- 복용 약물(Medications): 
- 알레르기(Allergies): 

**OBJECTIVE (객관적 소견)**
- 활력 징후(Vital Signs): 
- 국소 검진(Local Examination): 
  • 시진(Inspection): 
  • 촉진(Palpation): 
  • 타진(Percussion): 
  • 청진(Auscultation): 
- 상처/절개 부위 평가: 
- 영상 검사(Imaging Studies): 
- 혈액 검사(Lab Studies): 

**ASSESSMENT (평가)**
- 진단(Diagnosis): 
- 수술 적응증(Surgical Indication): 
- 수술 위험도 평가(Risk Assessment): 
- ASA 분류: 

**PLAN (계획)**
- 수술 계획(Surgical Plan): 
  • 수술 방법: 
  • 마취 방법: 
  • 예상 수술 시간: 
- 술전 준비(Preoperative Preparation): 
- 술후 관리(Postoperative Care): 
- 합병증 예방(Complication Prevention): 
- 추적 관찰(Follow-up): `,
    example: `**SUBJECTIVE**
주호소: 우하복부 통증 6시간 지속
현재 병력: 오늘 아침부터 시작된 우하복부 통증, 점차 악화됨, 구토 2회
통증 양상: McBurney point 압통, 걸을 때 통증 악화
과거 수술력: 없음
복용 약물: 없음
알레르기: 없음

**OBJECTIVE**
활력 징후: BP 120/80, HR 95, RR 18, BT 37.8°C
국소 검진: 
- 시진: 우하복부 팽만 없음
- 촉진: McBurney point 압통(+), 반발 압통(+)
- Rovsing sign (+), Psoas sign (+)
영상 검사: 복부 CT - 충수 비후, 주변 지방 침윤
혈액 검사: WBC 12,000/μL, CRP 15 mg/dL

**ASSESSMENT**
급성 충수염 (Acute Appendicitis)
ASA Class I

**PLAN**
수술 계획: 복강경 충수절제술
- 수술 방법: 3-port 복강경 수술
- 마취: 전신마취
- 예상 시간: 1시간
술전 준비: 금식, 항생제 예방요법, 동의서
술후 관리: 통증 조절, 조기 보행, 식이 진행
추적 관찰: 술후 1주, 1개월`
  },

  // 3. 가정의학과 템플릿 (종합적 건강 관리)
  {
    name: '가정의학과 기본 템플릿',
    profession: 'doctor',
    specialty: '가정의학과',
    format: `**SUBJECTIVE (주관적 소견)**
- 주호소(Chief Complaint): 
- 현재 병력(Present Illness): 
- 과거 병력(Past Medical History): 
- 복용 약물(Medications): 
- 예방접종력(Immunization History): 
- 사회력(Social History): 
  • 흡연/음주: 
  • 운동: 
  • 식습관: 
- 가족력(Family History): 
- 건강 검진력(Health Screening): 

**OBJECTIVE (객관적 소견)**
- 활력 징후(Vital Signs): 
- 신체 계측(Anthropometry): 
  • 키/체중/BMI: 
  • 허리둘레: 
- 신체 검진(Physical Examination): 
- 정신 상태 평가(Mental Status): 
- 검사 결과(Laboratory Results): 
- 건강 지표 평가: 

**ASSESSMENT (평가)**
- 진단(Diagnosis): 
- 건강 위험 요인(Risk Factors): 
- 예방 가능한 질병 평가: 
- 전반적 건강 상태: 

**PLAN (계획)**
- 치료 계획(Treatment Plan): 
- 생활 습관 상담(Lifestyle Counseling): 
- 예방 의학(Preventive Care): 
  • 필요한 검진: 
  • 예방접종: 
- 건강 증진 계획(Health Promotion): 
- 추적 관찰(Follow-up): 
- 의뢰 계획(Referral Plan): `,
    example: `**SUBJECTIVE**
주호소: 건강검진 및 고혈압 관리 상담
현재 병력: 최근 건강검진에서 고혈압 발견, 특별한 증상 없음
과거 병력: 고지혈증 3년, 위염
복용 약물: 아토르바스타틴 10mg
예방접종력: 독감 백신 작년, COVID-19 백신 완료
사회력: 금연 5년 전, 음주 주 3회, 운동 주 1회
가족력: 부모 고혈압, 당뇨병
건강 검진력: 작년 건강검진 정상

**OBJECTIVE**
활력 징후: BP 145/92, HR 72, RR 16, BT 36.4°C
신체 계측: 키 170cm, 체중 75kg, BMI 26, 허리둘레 88cm
신체 검진: 특이 소견 없음
검사 결과: 
- 공복혈당 105 mg/dL
- HbA1c 5.8%
- 총콜레스테롤 220 mg/dL

**ASSESSMENT**
1. 1기 고혈압 (Stage 1 Hypertension)
2. 이상지질혈증 조절 중
3. 과체중 (BMI 26)
4. 당뇨병 전단계

**PLAN**
치료 계획: 생활습관 개선 우선, 필요시 약물 치료
생활 습관 상담: 저염식, 체중 감량 목표 5kg
예방 의학: 
- 대장내시경 검사 (50세 이상)
- 유방촬영술 권고 (배우자)
건강 증진: 주 3회 유산소 운동, 금주
추적 관찰: 3개월 후 혈압 재측정`
  },

  // 4. 응급의학과 템플릿 (신속 진단 중심)
  {
    name: '응급의학과 기본 템플릿',
    profession: 'doctor',
    specialty: '응급의학과',
    format: `**SUBJECTIVE (주관적 소견)**
- 주호소(Chief Complaint): 
- 발병 시간(Time of Onset): 
- 증상 진행(Symptom Progression): 
- 동반 증상(Associated Symptoms): 
- 유발 요인(Precipitating Factors): 
- 응급처치력(First Aid Given): 
- 과거 병력(Past Medical History): 
- 복용 약물(Current Medications): 

**OBJECTIVE (객관적 소견)**
- 활력 징후(Vital Signs): 
- 의식 상태(Mental Status): 
  • GCS: 
  • AVPU: 
- 신속 신체 검진(Rapid Physical Exam): 
- 통증 점수(Pain Score): /10
- 응급 검사(Emergency Studies): 
- 심전도(ECG): 
- 영상 검사(Imaging): 

**ASSESSMENT (평가)**
- 응급 진단(Emergency Diagnosis): 
- 중증도 분류(Triage Category): 
- 즉시 위험 요인(Immediate Threats): 
- 감별 진단(Differential Diagnosis): 

**PLAN (계획)**
- 즉시 처치(Immediate Treatment): 
- 응급 의학적 처치: 
- 통증 관리(Pain Management): 
- 추가 검사(Further Studies): 
- 입원/퇴원 결정(Disposition): 
- 전원 필요성(Transfer Needs): 
- 추적 관찰(Follow-up Instructions): `,
    example: `**SUBJECTIVE**
주호소: 갑작스런 흉통과 호흡곤란
발병 시간: 1시간 전 갑작스럽게 시작
증상 진행: 지속적인 찢어지는 듯한 흉통, 등으로 방사
동반 증상: 식은땀, 어지럼증
유발 요인: 무거운 물건을 들다가 시작
응급처치력: 119 구급차 이송
과거 병력: 고혈압 조절 불량
복용 약물: 간헐적 혈압약 복용

**OBJECTIVE**
활력 징후: BP 170/100→110/70, HR 110, RR 24, BT 36.0°C, SpO2 92%
의식 상태: GCS 15, AVPU-Alert
신속 신체 검진: 창백, 식은땀, 좌우 혈압 차이 >20mmHg
통증 점수: 9/10 (찢어지는 듯한 통증)
응급 검사: 
- 혈액형: O형 Rh(+)
- CBC: Hgb 10.2 g/dL (감소)
심전도: 좌심실 비대, ST 변화 없음
영상 검사: 흉부 CT - 대동맥 박리 의심

**ASSESSMENT**
1. 급성 대동맥 박리 (Type A) 의심
2. 출혈성 쇼크 가능성
Triage: Emergency (즉시)

**PLAN**
즉시 처치: 
- 산소 공급, 정맥로 확보
- 혈압 조절 (수축기 100-120mmHg)
- 통증 조절: 모르핀 투여
추가 검사: 흉부 CT angiography 응급 시행
입원 결정: 흉부외과 응급 의뢰, 중환자실 입원
전원: 심장외과 수술 가능 병원으로 즉시 전원 준비`
  },

  // 5. 정형외과 템플릿 (근골격계 중심) - 추가
  {
    name: '정형외과 기본 템플릿',
    profession: 'doctor',
    specialty: '정형외과',
    format: `**SUBJECTIVE (주관적 소견)**
- 주호소(Chief Complaint): 
- 손상 기전(Mechanism of Injury): 
- 통증 양상(Pain Characteristics): 
  • 부위/방사 양상: 
  • 강도(NRS): /10
  • 악화/완화 요인: 
- 기능 장애(Functional Limitation): 
- 과거 손상력(Previous Injuries): 
- 직업/활동력(Occupation/Activities): 

**OBJECTIVE (객관적 소견)**
- 활력 징후(Vital Signs): 
- 국소 검진(Local Examination): 
  • Look (시진): 
  • Feel (촉진): 
  • Move (관절 가동범위): 
- 신경학적 검사(Neurological Exam): 
- 혈관 상태(Vascular Status): 
- 특수 검사(Special Tests): 
- 영상 검사(Imaging): 

**ASSESSMENT (평가)**
- 진단(Diagnosis): 
- 손상 분류(Classification): 
- 안정성 평가(Stability Assessment): 
- 수술 적응증 평가: 

**PLAN (계획)**
- 치료 방법(Treatment Method): 
- 고정/보조기(Immobilization/Bracing): 
- 물리치료(Physical Therapy): 
- 약물 치료(Medications): 
- 수술 계획(Surgical Plan): 
- 재활 계획(Rehabilitation): 
- 추적 관찰(Follow-up): `,
    example: `**SUBJECTIVE**
주호소: 우측 손목 통증 및 변형
손상 기전: 자전거 타다가 넘어지면서 손목 짚음
통증 양상: 우측 손목 배측, NRS 7/10, 움직일 때 악화
기능 장애: 손목 움직임 제한, 물건 잡기 어려움
과거 손상력: 없음
직업: 사무직

**OBJECTIVE**
활력 징후: 정상
국소 검진:
- Look: 우측 손목 배측 부종, 변형
- Feel: 압통(+), 계단 변형 촉지
- Move: 손목 굴곡/신전 제한
신경학적 검사: 정중신경 분포 감각 정상
혈관 상태: 요골동맥 맥박 촉지됨
영상 검사: 단순 X-ray - 원위 요골 골절

**ASSESSMENT**
우측 원위 요골 골절 (Colles' fracture)
AO 분류: 23-A2

**PLAN**
치료 방법: 도수 정복 후 석고 고정
고정: 단상지 석고 고정 6주
물리치료: 고정 제거 후 관절 가동범위 운동
약물: 진통소염제
추적 관찰: 1주, 3주, 6주 후 X-ray`
  }
];

// 전문과별 템플릿 검색 함수
export const getTemplateBySpecialty = (specialty: string): TemplateFormData | null => {
  return DEFAULT_TEMPLATES.find(template => template.specialty === specialty) || null;
};

// 모든 지원 전문과 목록
export const SUPPORTED_SPECIALTIES = [
  '내과',
  '외과', 
  '가정의학과',
  '응급의학과',
  '정형외과',
  '물리치료'
];

// 전문과별 설명
export const SPECIALTY_DESCRIPTIONS = {
  '내과': '만성질환 관리와 종합적 내과 진료에 최적화된 템플릿',
  '외과': '수술 전후 관리와 외과적 처치에 중점을 둔 템플릿',
  '가정의학과': '전인적 건강관리와 예방의학에 특화된 템플릿',
  '응급의학과': '신속한 진단과 응급처치에 최적화된 템플릿',
  '정형외과': '근골격계 질환과 외상 관리에 특화된 템플릿',
  '물리치료': '기능 회복과 재활에 중점을 둔 템플릿'
};

export default {
  DEFAULT_TEMPLATES,
  getTemplateBySpecialty,
  SUPPORTED_SPECIALTIES,
  SPECIALTY_DESCRIPTIONS
}; 