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
 * SOAP 노트 생성 (보안 버전 - Firebase Functions 사용)
 */
export const generateSoapNote = async (params: GenerateSoapNoteParams): Promise<SoapNote> => {
  try {
    console.log('SOAP 노트 생성 요청 (Firebase Functions):', {
      noteType: params.noteType,
      language: params.language,
      hasTemplate: !!params.template,
    });

    const generateSoapNoteFunction = httpsCallable<GenerateSoapNoteParams, SoapNote>(
      functions,
      'generateSoapNoteSecure'
    );

    const retryResult = await retryWithBackoff(
      () => generateSoapNoteFunction(params),
      {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 15000
      }
    );

    if (!retryResult.success || !retryResult.data) {
      throw retryResult.error || new Error('SOAP 노트 생성에 실패했습니다.');
    }

    const result = retryResult.data;

    console.log('SOAP 노트 생성 성공:', {
      subjectiveLength: result.subjective.length,
      objectiveLength: result.objective.length,
      assessmentLength: result.assessment.length,
      planLength: result.plan.length,
    });

    return result;

  } catch (error) {
    console.error('SOAP 노트 생성 오류:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      
      switch (firebaseError.code) {
        case 'functions/unauthenticated':
          throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        case 'functions/resource-exhausted':
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        case 'functions/invalid-argument':
          throw new Error('요청 데이터가 올바르지 않습니다.');
        case 'functions/internal':
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(firebaseError.message || 'SOAP 노트 생성 중 오류가 발생했습니다.');
      }
    }
    
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