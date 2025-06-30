import { TemplateFormData } from '../types';
import fewShotExamples from '../data/fewShotExamples.json';

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
- 환자 교육(Patient Education): `
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
- 추적 관찰(Follow-up): `
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
- 의뢰 계획(Referral Plan): `
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
- 추적 관찰(Follow-up Instructions): `
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
- 추적 관찰(Follow-up): `
  }
];

// 전문과별 템플릿 검색 함수
export const getTemplateBySpecialty = (specialty: string): TemplateFormData | null => {
  const template = DEFAULT_TEMPLATES.find(template => template.specialty === specialty);
  if (template) {
    return {
      ...template,
      example: fewShotExamples[specialty] || '' // fewShotExamples에서 예시 가져오기
    };
  }
  return null;
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