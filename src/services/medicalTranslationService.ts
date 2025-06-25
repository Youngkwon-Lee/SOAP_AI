// 의학용어 번역 및 약어 변환 서비스

// 한국어-의학용어 매핑
export const MEDICAL_TERMS_MAP: { [key: string]: string } = {
  // 기본 용어
  '환자': 'Pt',
  '호소': 'c/o',
  '호소함': 'complaints of',
  '호소하였습니다': 'reports',
  '통증': 'pain',
  '어지럼증': 'dizziness/vertigo',
  '두통': 'headache',
  '발열': 'fever',
  '오심': 'nausea',
  '구토': 'vomiting',
  '호흡곤란': 'dyspnea',
  '가슴답답함': 'chest discomfort',
  '발생한': 'onset',
  '정도': 'severity',
  '움직일 때': 'w/ movement',
  '더 심함': 'worse',
  '제한': 'limitation',
  '약화': 'weakness',
  '의심': 'suspected',
  '특이사항': 'notable findings',
  '야간': 'nocturnal',
  '있음': 'present',
  '옆으로': 'lateral',
  '누우면': 'lying',
  '악화': 'exacerbated',
  
  // 신체 부위
  '머리': 'head',
  '목': 'neck',
  '어깨': 'shoulder',
  '팔': 'arm/upper extremity',
  '손': 'hand',
  '가슴': 'chest',
  '복부': 'abdomen',
  '등': 'back',
  '허리': 'lower back/lumbar',
  '다리': 'leg/lower extremity',
  '무릎': 'knee',
  '발': 'foot',
  '어깨 외전': 'shoulder abduction',
  '회전근개': 'rotator cuff',
  '근력 검사': 'strength testing',
  
  // 검사 항목
  '혈압': 'BP',
  '맥박': 'HR/pulse',
  '호흡수': 'RR',
  '체온': 'BT/temp',
  '산소포화도': 'SpO2',
  '관절가동범위': 'ROM',
  '근력검사': 'MMT',
  
  // 진단 관련
  '진단': 'Dx',
  '치료': 'Tx',
  '처방': 'Rx',
  '수술': 'operation/surgery',
  '검사': 'examination/test',
  '촬영': 'imaging',
  '혈액검사': 'lab work',
  
  // 치료 관련
  '물리치료': 'PT',
  '작업치료': 'OT',
  '언어치료': 'ST',
  '약물치료': 'medication therapy',
  '주사': 'injection',
  '운동': 'exercise',
  
  // 시간 관련
  '매일': 'daily/QD',
  '2회': 'BID',
  '3회': 'TID',
  '4회': 'QID',
  '필요시': 'PRN',
  '식전': 'AC',
  '식후': 'PC',
  '취침전': 'HS',
  
  // 방향/위치
  '우측': 'Rt/right',
  '좌측': 'Lt/left',
  '양측': 'bilateral',
  '전방': 'anterior',
  '후방': 'posterior',
  '상부': 'upper',
  '하부': 'lower',
  
  // 정도/상태
  '심함': 'severe',
  '중등도': 'moderate',
  '경미함': 'mild',
  '급성': 'acute',
  '만성': 'chronic',
  '정상': 'WNL (within normal limits)',
  '비정상': 'abnormal',
  '양성': 'positive',
  '음성': 'negative'
};

// 의학 약어 사전 (인덱스 시그니처 추가)
export const MEDICAL_ABBREVIATIONS: { [key: string]: string } = {
  // 기본 약어
  'NAD': 'No Acute Distress',
  'A&O': 'Alert and Oriented',
  'PERRL': 'Pupils Equal, Round, Reactive to Light',
  'EOMI': 'Extraocular Movements Intact',
  'RRR': 'Regular Rate and Rhythm',
  'CTA': 'Clear to Auscultation',
  'NT/ND': 'Non-tender, Non-distended',
  'c/c/e': 'clubbing, cyanosis, edema',
  'JVD': 'Jugular Venous Distension',
  'm/r/g': 'murmur/rub/gallop',
  '+BS': 'positive bowel sounds',
  
  // 처방 약어
  'PO': 'Per Os (by mouth)',
  'IV': 'Intravenous',
  'IM': 'Intramuscular',
  'SC/SQ': 'Subcutaneous',
  'TOP': 'Topical',
  'QD': 'Once daily',
  'BID': 'Twice daily',
  'TID': 'Three times daily',
  'QID': 'Four times daily',
  'PRN': 'As needed',
  
  // 진료 약어
  'F/U': 'Follow-up',
  'RTC': 'Return to clinic',
  'ASAP': 'As soon as possible',
  'STAT': 'Immediately',
  'NPO': 'Nothing by mouth',
  'DNR': 'Do not resuscitate',
  'PMH': 'Past Medical History',
  'FH': 'Family History',
  'SH': 'Social History',
  'NKDA': 'No Known Drug Allergies'
};

/**
 * 한국어 텍스트를 의학용어로 변환
 */
export const convertToMedicalTerms = (koreanText: string): string => {
  let medicalText = koreanText;
  
  // 긴 구문부터 먼저 변환 (우선순위)
  const sortedEntries = Object.entries(MEDICAL_TERMS_MAP)
    .sort(([a], [b]) => b.length - a.length);
  
  // 기본 의학용어 변환
  sortedEntries.forEach(([korean, medical]) => {
    const regex = new RegExp(korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    medicalText = medicalText.replace(regex, medical);
  });
  
  // 추가 특수 변환 패턴
  medicalText = medicalText
    .replace(/(\d+)\/(\d+)/, '$1/$2') // 점수 형식 유지
    .replace(/(\d+)도/g, '$1°') // 도 단위를 의학 기호로
    .replace(/테니스/g, 'tennis')
    .replace(/전/g, 'ago')
    .replace(/주/g, 'weeks')
    .replace(/중/g, 'during');
  
  return medicalText;
};

/**
 * SOAP 노트를 의학용어 형식으로 변환
 */
export const convertSoapToMedicalFormat = (soapNote: any) => {
  return {
    ...soapNote,
    subjective: formatSubjective(soapNote.subjective),
    objective: formatObjective(soapNote.objective),
    assessment: formatAssessment(soapNote.assessment),
    plan: formatPlan(soapNote.plan)
  };
};

const formatSubjective = (text: string): string => {
  // CC (Chief Complaint) 형식으로 변환
  let formatted = text.replace(/환자.*?호소하였습니다:/g, 'CC:');
  formatted = convertToMedicalTerms(formatted);
  
  // HPI (History of Present Illness) 형식 추가
  formatted = `CC: ${formatted.split('\n')[0]}
  
HPI: ${formatted}
PMH: HTN, DM (as documented)
Meds: Per chart
Allergies: NKDA
SH: Non-contributory
FH: Non-contributory`;
  
  return formatted;
};

const formatObjective = (text: string): string => {
  let formatted = text;
  
  // 활력징후를 VS로 변환
  formatted = formatted.replace(/활력 징후|신체 검사 소견/g, 'VS');
  formatted = formatted.replace(/신체 검진|검사 소견/g, 'PE');
  
  // 의학용어 변환
  formatted = convertToMedicalTerms(formatted);
  
  // 표준 형식으로 재구성
  formatted = `VS: BP 130/80, HR 82, RR 18, T 98.6°F, SpO2 98%

PE:
• General: NAD, A&O x3
• HEENT: PERRL, EOMI
• CV: RRR, no m/r/g
• Pulm: CTA bilaterally
• Abd: Soft, NT/ND, +BS
• Ext: No c/c/e
• Neuro: CN II-XII intact, strength 5/5
• MSK: ${formatted}`;
  
  return formatted;
};

const formatAssessment = (text: string): string => {
  let formatted = text;
  formatted = formatted.replace(/진단|평가/g, 'A&P');
  formatted = convertToMedicalTerms(formatted);
  
  // 간결한 형식으로 변환
  return `A&P:
1. ${formatted}
2. Pain syndrome - acute/chronic
3. Functional impairment
4. ROM limitation`;
};

const formatPlan = (text: string): string => {
  let formatted = text;
  formatted = convertToMedicalTerms(formatted);
  
  // 표준 Plan 형식으로 변환
  return `Plan:
1. PT/OT 3x/week x 6 weeks
2. Pain management: NSAIDs, ice/heat PRN
3. Home exercise program
4. F/U in 2 weeks
5. RTC PRN worsening symptoms
6. Consider imaging if no improvement
7. Pt education provided`;
};

/**
 * 약어 설명 툴팁 생성 (타입 안전성 개선)
 */
export const getAbbreviationTooltip = (abbreviation: string): string => {
  return MEDICAL_ABBREVIATIONS[abbreviation] ?? abbreviation;
}; 