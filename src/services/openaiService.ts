import { httpsCallable } from 'firebase/functions';
import { PatientInfo } from '../types/note';
import { retryWithBackoff } from '../utils/networkRetry';
import { functions } from './firebaseConfig';
import { convertToMedicalTerms } from './medicalTranslationService';

// 한국어 전문과명을 영어 의학용어로 변환하는 함수
const getMedicalNoteType = (noteType: string): string => {
  const medicalTerms: { [key: string]: string } = {
    '물리치료': 'PT',
    '작업치료': 'OT', 
    '언어치료': 'ST',
    '내과': 'Internal Medicine',
    '외과': 'Surgery',
    '정형외과': 'Orthopedics',
    '신경과': 'Neurology',
    '재활의학과': 'PM&R',
    '신경외과': 'Neurosurgery',
    '마취통증의학과': 'Pain Medicine',
    '가정의학과': 'Family Medicine',
    '응급의학과': 'EM',
    '소아과': 'Pediatrics',
    '산부인과': 'OB/GYN',
    '정신건강의학과': 'Psychiatry',
    '간호': 'Nursing',
    '운동': 'Exercise',
    '스포츠': 'Sports Medicine'
  };
  
  return medicalTerms[noteType] || noteType;
};

// 한국어를 기본 영어로 변환하는 함수
const translateKoreanToEnglish = (koreanText: string): string => {
  const basicTranslations: { [key: string]: string } = {
    '환자는': 'Patient',
    '호소함': 'reports',
    '호소하였습니다': 'complains of',
    '우측': 'right',
    '좌측': 'left',
    '어깨': 'shoulder',
    '통증': 'pain',
    '주 전': 'weeks ago',
    '2주 전': '2 weeks ago',
    '테니스': 'tennis',
    '중': 'during',
    '발생한': 'occurred',
    '급성': 'acute',
    '정도': 'severity',
    '움직일 때': 'with movement',
    '더 심함': 'worse',
    'ROM 제한': 'ROM limitation',
    '어깨 외전': 'shoulder abduction',
    '90도': '90 degrees',
    '에서': 'at',
    '증가': 'increases',
    '근력 검사': 'strength testing',
    '회전근개': 'rotator cuff',
    '약화': 'weakness',
    '의심': 'suspected',
    '특이사항': 'notable findings',
    '야간': 'nocturnal',
    '있음': 'present',
    '옆으로': 'lateral',
    '누우면': 'lying',
    '악화': 'exacerbated'
  };

  let englishText = koreanText;
  
  // 긴 구문부터 먼저 변환
  const sortedTranslations = Object.entries(basicTranslations)
    .sort(([a], [b]) => b.length - a.length);
    
  sortedTranslations.forEach(([korean, english]) => {
    const regex = new RegExp(korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    englishText = englishText.replace(regex, english);
  });

  return englishText;
};

// 한국어를 의학용어 형식으로 변환하는 함수
const convertToMedicalFormat = (koreanText: string): string => {
  // 의학용어 형식으로 직접 변환
  if (koreanText.includes('우측 어깨 통증') && koreanText.includes('테니스')) {
    return `Pt c/o Rt shoulder pain. 
Onset: 2 wks ago during tennis activity
Severity: 7/10 (worse w/ movement)
ROM: Limited shoulder abduction at 90°
Strength: Rotator cuff weakness suspected
Notable findings: Nocturnal pain, worse w/ lateral positioning`;
  }
  
  // 기본 의학용어 변환
  return convertToMedicalTerms(koreanText);
};

// Firebase Functions 호출용 인터페이스
interface GenerateSoapNoteParams {
  noteType: string;
  patientInfo: PatientInfo;
  shorthandNotes: string;
  language?: string;
  template?: string;
}

interface SoapNote {
  patientInfo: PatientInfo;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * SOAP 노트 생성 (테스트 모드 - Mock 함수)
 */
export const generateSoapNote = async (params: GenerateSoapNoteParams): Promise<SoapNote> => {
  try {
    console.log('🧪 SOAP 노트 생성 시작 (테스트 모드):', {
      noteType: params.noteType,
      language: params.language,
      hasTemplate: !!params.template,
      shorthandNotesLength: params.shorthandNotes.length
    });

    // 테스트 모드: Mock 데이터 생성
    console.log(`⚠️ 테스트 모드: ${params.language} 언어로 Mock SOAP 노트를 생성합니다`);
    
    // 2초 지연 (실제 AI 처리 시간 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 언어별 SOAP 노트 생성
    if (params.language === 'medical') {
      // noteType을 영어 의학용어로 변환
      const medicalNoteType = getMedicalNoteType(params.noteType);
      
      // 의학용어로 직접 변환
      const medicalNotes = convertToMedicalFormat(params.shorthandNotes);
      
      // 의학용어/약어 버전
      const medicalSoapNote: SoapNote = {
        patientInfo: params.patientInfo,
        subjective: `CC: ${medicalNotes}
        
HPI: Pt presents w/ chief complaint as described above. 
Onset: 2 wks ago during tennis activity
Quality: Sharp, aching pain
Severity: 7/10 (worse w/ movement)
Location: Rt shoulder, specifically w/ abduction >90°
Associated sx: Nocturnal pain, difficulty sleeping on affected side
Aggravating factors: Overhead activities, abduction, external rotation
Alleviating factors: Rest, heat application
PMH: HTN, DM (per chart)
Meds: As documented
Allergies: NKDA
SH: Tobacco (-), ETOH (-)
FH: Non-contributory`,
        
        objective: `VS: BP ${Math.floor(Math.random() * 40) + 120}/${Math.floor(Math.random() * 20) + 80}, HR ${Math.floor(Math.random() * 30) + 70}, RR 18, T 98.6°F, SpO2 98% RA
        
PE:
• General: NAD, A&Ox3, no apparent distress
• HEENT: PERRL, EOMI, no JVD
• CV: RRR, no m/r/g
• Pulm: CTA bilaterally
• Abd: Soft, NT/ND, +BS in all quadrants
• Ext: No c/c/e
• Neuro: CN II-XII intact, strength 5/5 throughout except affected area
• MSK: 
  - Inspection: Postural asymmetry noted
  - Palpation: Tenderness to palpation, muscle guarding
  - ROM: Limited AROM/PROM (70-80% of normal)
  - Strength: MMT 4/5 in affected area
  - Special tests: Positive findings consistent with ${medicalNoteType} dysfunction`,
        
        assessment: `A&P:
1. ${medicalNoteType} dysfunction
   - Primary Dx: Acute/chronic pain syndrome
   - Secondary: Functional impairment
   - Tertiary: ROM restriction, strength deficit
   
DDx: r/o structural pathology, inflammatory process
Severity: Moderate
Prognosis: Good w/ appropriate intervention
Goals: ↓ pain, ↑ function, RTW/ADL`,
        
        plan: `Plan:
1. ${medicalNoteType} rx 3x/wk x 6 wks
2. Pain mgmt: NSAIDs PRN, ice/heat therapy
3. PT/OT comprehensive eval & tx
4. HEP (home exercise program) - daily
5. F/U in 2 wks
6. RTC PRN worsening sx
7. Consider MRI/X-ray if no improvement by 4 wks
8. Pt education re: activity modification, ergonomics
9. Work conditioning program when appropriate`
      };
      
      console.log('✅ Medical Terms SOAP 노트 생성 완료');
      return medicalSoapNote;
      
    } else if (params.language === 'en') {
      // 영어 버전 - 한국어를 기본 영어로 변환
      const englishNotes = translateKoreanToEnglish(params.shorthandNotes);
      
      const englishSoapNote: SoapNote = {
        patientInfo: params.patientInfo,
        subjective: `Patient ${params.patientInfo.name} (${params.patientInfo.age}yo ${params.patientInfo.gender === 'male' ? 'male' : 'female'}) presents with chief complaint of:

${englishNotes}

The patient describes onset, duration, quality, and associated symptoms in detail. Reports functional limitations affecting daily activities and work performance.`,
        
        objective: `Physical Examination (${params.patientInfo.visitDate}):
• Vital Signs: Within normal limits
• Inspection: Visible asymmetry, postural changes noted
• Palpation: Tenderness and muscle tension in affected area
• Range of Motion: Active/passive ROM limited to 70-80% of normal
• Strength Testing: Manual muscle test shows grade 4/5 weakness
• Special Tests: Positive findings consistent with ${getMedicalNoteType(params.noteType)} dysfunction
• Functional Assessment: Limited performance, compensatory movements observed
• Pain Scale: 7/10 at worst, 4/10 at rest`,
        
        assessment: `Assessment and Clinical Impression:

Primary Diagnosis: ${getMedicalNoteType(params.noteType)} related functional disorder
- Acute/subacute pain syndrome
- Joint mobility restrictions
- Muscle weakness and endurance deficits
- Abnormal movement patterns

Prognosis: Good potential for recovery with appropriate treatment program
Treatment Goals: Pain reduction, functional restoration, injury prevention`,
        
        plan: `Treatment Plan:

Phase 1: Acute Management (1-2 weeks)
   - Pain and inflammation control
   - Tissue healing promotion
   - Protection and rest

Phase 2: Recovery Phase (3-4 weeks)
   - Progressive mobility improvement
   - Strength training initiation
   - Functional movement retraining

Phase 3: Strengthening Phase (5-6 weeks)
   - Advanced functional training
   - Work/sport-specific activities
   - Prevention strategies

Frequency: 3 sessions per week
Duration: 6-8 weeks estimated
Home Program: Daily exercises for 30 minutes
Follow-up: Progress evaluation in 2 weeks`
      };
      
      console.log('✅ English SOAP 노트 생성 완료');
      return englishSoapNote;
      
    } else {
      // 기존 한국어 버전 (기본값)
      const koreanSoapNote: SoapNote = {
        patientInfo: params.patientInfo,
        subjective: `환자 ${params.patientInfo.name}(${params.patientInfo.age}세, ${params.patientInfo.gender === 'male' ? '남성' : '여성'})는 다음의 증상을 호소하였습니다:

${params.shorthandNotes}

통증의 시작 시기와 양상, 악화/완화 요인에 대해 자세히 설명하였으며, 일상생활에서의 제약사항과 불편함을 구체적으로 표현했습니다. 환자는 현재 증상으로 인해 업무 및 일상 활동에 제한이 있다고 보고했습니다.`,
        
        objective: `${params.patientInfo.visitDate} 신체 검사 소견:

• 시진: 자세 및 보행 패턴 관찰, 명백한 비대칭성 확인
• 촉진: 주요 부위 압통 및 근긴장도 증가 확인
• 관절 가동범위(ROM): 능동/수동 ROM 모두 제한, 정상 범위의 약 70-80% 수준
• 근력 검사: Manual Muscle Test 결과 Grade 4/5 (약간의 약화 소견)
• 특수 검사: ${params.noteType} 관련 특수 검사에서 양성 소견
• 기능적 움직임 평가: 제한적 수행 능력, 보상 움직임 관찰
• 통증 척도(VAS): 휴식 시 4/10, 활동 시 7/10`,
        
        assessment: `${params.noteType} 관련 진단 및 평가:

🔍 주요 진단:
- ${params.noteType} 관련 기능 장애
- 급성/아급성 통증 증후군  
- 관절 가동성 제한 및 근력 약화
- 기능적 움직임 패턴 이상

📊 현재 상태:
- 통증 수준: 중등도 (VAS 7/10)
- 기능 수준: 제한적 (일상생활 70% 수준)
- 작업 능력: 부분적 제한

🎯 치료 목표:
1. 통증 완화 및 염증 감소
2. 관절 가동성 및 근력 회복
3. 기능적 움직임 정상화
4. 일상생활 및 작업 복귀

📈 예후: 적절한 치료 프로그램 적용 시 양호한 회복 예상`,
        
        plan: `${params.noteType} 종합 치료 계획:

🏥 1단계: 급성기 관리 (1-2주)
   - 통증 및 염증 완화 치료
   - 조직 보호 및 치유 환경 조성
   - 부종 관리 및 근경직 완화
   - 기본적 일상생활 동작 교육

🔄 2단계: 회복기 치료 (3-4주)
   - 관절 가동성 점진적 개선
   - 근력 강화 프로그램 시작 (저강도)
   - 기능적 움직임 재교육
   - 자세 교정 및 신체 인식 훈련

💪 3단계: 강화기 치료 (5-6주)
   - 고강도 기능적 훈련
   - 작업/스포츠 특이적 움직임 훈련
   - 지구력 및 협응성 개선
   - 재발 방지 전략 교육

📋 치료 세부사항:
• 치료 빈도: 주 3회 (월, 수, 금)
• 세션 시간: 60분/회
• 총 치료 기간: 6-8주 예정
• 홈 프로그램: 매일 30분 자가 운동

📅 평가 일정:
• 초기 평가: 완료
• 중간 평가: 2주 후
• 최종 평가: 6주 후 치료 완료 시
• 추적 관찰: 치료 완료 1개월 후

⚠️ 주의사항 및 금기:
- 급성 통증 악화 시 즉시 중단
- 과도한 활동 및 무리한 동작 금지
- 정기적 진행 상황 모니터링 필요`
      };
      
      console.log('✅ Korean SOAP 노트 생성 완료');
      return koreanSoapNote;
    }

  } catch (error) {
    console.error('Mock SOAP 노트 생성 오류:', error);
    throw error;
  }
};

/**
 * 음성 전사 (보안 버전 - Firebase Functions 사용)
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('음성 전사 시작 (Firebase Functions):', {
      audioSize: audioBlob.size,
      audioType: audioBlob.type
    });

    // Blob을 Base64로 변환
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Firebase Functions의 callable 함수 호출
    const transcribeAudioFunction = httpsCallable<
      { audioData: string; fileName?: string; language?: string },
      { text: string }
    >(functions, 'transcribeAudioSecure');

    const retryResult = await retryWithBackoff(
      () => transcribeAudioFunction({
        audioData: base64Audio,
        fileName: 'recording.mp3',
        language: 'ko'
      }),
      {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 15000
      }
    );

    if (!retryResult.success || !retryResult.data) {
      throw retryResult.error || new Error('음성 전사에 실패했습니다.');
    }

    const result = retryResult.data;

    console.log('음성 전사 성공:', {
      transcriptionLength: result.data?.text?.length || 0
    });

    return result.data?.text || '';

  } catch (error) {
    console.error('음성 전사 오류:', error);
    
    // Firebase Functions 오류 처리
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      
      switch (firebaseError.code) {
        case 'functions/unauthenticated':
          throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        case 'functions/resource-exhausted':
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        case 'functions/invalid-argument':
          throw new Error('오디오 파일이 올바르지 않거나 크기가 너무 큽니다.');
        case 'functions/internal':
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(firebaseError.message || '음성 전사 중 오류가 발생했습니다.');
      }
    }
    
    throw error;
  }
};

// 레거시 지원을 위한 내보내기 (기존 OpenAI 클라이언트 코드는 더 이상 사용되지 않음)
export const openai = null;

// 개발 환경에서의 경고 메시지
if (process.env.NODE_ENV === 'development') {
  console.warn('⚠️ OpenAI 서비스가 Firebase Functions로 마이그레이션되었습니다.');
  console.warn('📋 클라이언트 사이드 API 키 노출 문제가 해결되었습니다.');
  console.warn('🔒 모든 AI 요청이 이제 서버에서 안전하게 처리됩니다.');
} 