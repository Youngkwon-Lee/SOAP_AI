import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { retryOpenAIRequest } from '../utils/networkRetry';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// 임시 사용자 ID 함수
const getCurrentUserId = () => 'temp-user-id';

// 지정된 시간만큼 대기하는 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export const startRecording = async (): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

export const stopRecording = async (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No recording in progress'));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const tracks = mediaRecorder?.stream.getTracks();
      tracks?.forEach(track => track.stop());
      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
};

// 전문 분야별 의료 용어 사전
const MEDICAL_TERMINOLOGY = {
  // 일반 의학 용어
  general: [
    { wrong: ['혈압약', '고혈압약'], correct: '항고혈압제' },
    { wrong: ['당뇨약', '당뇨병약'], correct: '당뇨병 치료제' },
    { wrong: ['심장 마비', '심장마비'], correct: '심근경색' },
    { wrong: ['뇌졸증'], correct: '뇌졸중' },
    { wrong: ['진통제'], correct: '진통제' },
    { wrong: ['항생제'], correct: '항생제' },
    { wrong: ['해열제'], correct: '해열제' },
    { wrong: ['소염제'], correct: '소염제' }
  ],
  
  // 검사 및 진단
  diagnosis: [
    { wrong: ['씨티', 'CT검사', '시티'], correct: 'CT' },
    { wrong: ['엠알아이', 'MRI검사'], correct: 'MRI' },
    { wrong: ['엑스레이', 'X레이', '엑스-레이'], correct: 'X-ray' },
    { wrong: ['초음파검사'], correct: '초음파' },
    { wrong: ['심전도검사'], correct: '심전도' },
    { wrong: ['혈액검사'], correct: '혈액검사' },
    { wrong: ['소변검사'], correct: '소변검사' },
    { wrong: ['내시경검사'], correct: '내시경' }
  ],
  
  // 증상
  symptoms: [
    { wrong: ['가슴 아픔', '가슴아픔'], correct: '흉통' },
    { wrong: ['배 아픔', '배아픔', '복부 통증'], correct: '복통' },
    { wrong: ['머리 아픔', '머리아픔'], correct: '두통' },
    { wrong: ['숨 가쁨', '숨가쁨', '숨이 가쁨'], correct: '호흡곤란' },
    { wrong: ['열 남', '열남', '몸이 뜨거움'], correct: '발열' },
    { wrong: ['어지러움', '현기증'], correct: '어지럼증' },
    { wrong: ['구토', '토함'], correct: '구토' },
    { wrong: ['설사'], correct: '설사' }
  ],
  
  // 신체 부위
  anatomy: [
    { wrong: ['심장'], correct: '심장' },
    { wrong: ['폐', '허파'], correct: '폐' },
    { wrong: ['간'], correct: '간' },
    { wrong: ['신장', '콩팥'], correct: '신장' },
    { wrong: ['위'], correct: '위' },
    { wrong: ['장'], correct: '장' },
    { wrong: ['뇌'], correct: '뇌' },
    { wrong: ['척추'], correct: '척추' }
  ],
  
  // 물리치료 전용 용어
  physicalTherapy: [
    { wrong: ['물리 치료', '물리치료'], correct: '물리치료' },
    { wrong: ['운동 치료', '운동치료'], correct: '운동치료' },
    { wrong: ['도수 치료', '도수치료'], correct: '도수치료' },
    { wrong: ['전기 치료', '전기치료'], correct: '전기치료' },
    { wrong: ['온열 치료', '온열치료'], correct: '온열치료' },
    { wrong: ['냉치료'], correct: '한냉치료' },
    { wrong: ['스트레칭'], correct: '신장운동' },
    { wrong: ['근력 강화', '근력강화'], correct: '근력강화운동' }
  ],
  
  // 약물명 (일반명)
  medications: [
    { wrong: ['아스피린'], correct: '아스피린' },
    { wrong: ['타이레놀'], correct: '아세트아미노펜' },
    { wrong: ['부루펜'], correct: '이부프로펜' },
    { wrong: ['애드빌'], correct: '이부프로펜' },
    { wrong: ['낙센'], correct: '나프록센' },
    { wrong: ['볼타렌'], correct: '디클로페낙' },
    { wrong: ['겔포스'], correct: '겔포스' },
    { wrong: ['마그밀'], correct: '수산화마그네슘' }
  ]
};

// 전문 분야별 의료 용어 보정 함수
const correctMedicalTermsBySpecialty = (text: string, specialty: string = 'general'): string => {
  let correctedText = text;
  
  // 모든 일반 용어 적용
  Object.values(MEDICAL_TERMINOLOGY.general).forEach(term => {
    term.wrong.forEach(wrongTerm => {
      const regex = new RegExp(wrongTerm, 'gi');
      correctedText = correctedText.replace(regex, term.correct);
    });
  });
  
  // 검사/진단 용어 적용
  Object.values(MEDICAL_TERMINOLOGY.diagnosis).forEach(term => {
    term.wrong.forEach(wrongTerm => {
      const regex = new RegExp(wrongTerm, 'gi');
      correctedText = correctedText.replace(regex, term.correct);
    });
  });
  
  // 증상 용어 적용
  Object.values(MEDICAL_TERMINOLOGY.symptoms).forEach(term => {
    term.wrong.forEach(wrongTerm => {
      const regex = new RegExp(wrongTerm, 'gi');
      correctedText = correctedText.replace(regex, term.correct);
    });
  });
  
  // 신체 부위 용어 적용
  Object.values(MEDICAL_TERMINOLOGY.anatomy).forEach(term => {
    term.wrong.forEach(wrongTerm => {
      const regex = new RegExp(wrongTerm, 'gi');
      correctedText = correctedText.replace(regex, term.correct);
    });
  });
  
  // 약물명 적용
  Object.values(MEDICAL_TERMINOLOGY.medications).forEach(term => {
    term.wrong.forEach(wrongTerm => {
      const regex = new RegExp(wrongTerm, 'gi');
      correctedText = correctedText.replace(regex, term.correct);
    });
  });
  
  // 전문 분야별 추가 용어 적용
  if (specialty === 'physicalTherapy' || specialty === '물리치료') {
    Object.values(MEDICAL_TERMINOLOGY.physicalTherapy).forEach(term => {
      term.wrong.forEach(wrongTerm => {
        const regex = new RegExp(wrongTerm, 'gi');
        correctedText = correctedText.replace(regex, term.correct);
      });
    });
  }
  
  return correctedText;
};

// 기존 correctMedicalTerms 함수를 새로운 함수로 대체
const correctMedicalTerms = (text: string, specialty: string = 'general'): string => {
  return correctMedicalTermsBySpecialty(text, specialty);
};

// 음성 품질 검증 함수
const validateAudioQuality = (audioBlob: Blob): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isValid = true;

  // 파일 크기 검증 (너무 작으면 품질 문제 가능성)
  const minSize = 1024; // 1KB
  if (audioBlob.size < minSize) {
    warnings.push('녹음 파일이 너무 작습니다. 더 길게 녹음해주세요.');
    isValid = false;
  }

  // 파일 크기 상한선 검증
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    warnings.push('녹음 파일이 너무 큽니다. 25MB 이하로 녹음해주세요.');
    isValid = false;
  }

  // 권장 크기 범위 안내
  const recommendedMinSize = 50 * 1024; // 50KB
  const recommendedMaxSize = 10 * 1024 * 1024; // 10MB
  if (audioBlob.size < recommendedMinSize) {
    warnings.push('더 명확한 인식을 위해 조금 더 길게 녹음하시는 것을 권장합니다.');
  }
  if (audioBlob.size > recommendedMaxSize) {
    warnings.push('파일이 큽니다. 처리 시간이 오래 걸릴 수 있습니다.');
  }

  return { isValid, warnings };
};

// 음성을 텍스트로 변환하는 함수
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
    }

    // 음성 품질 검증
    const qualityCheck = validateAudioQuality(audioBlob);
    if (!qualityCheck.isValid) {
      throw new Error(qualityCheck.warnings.join(' '));
    }
    
    // 경고사항이 있으면 콘솔에 출력
    if (qualityCheck.warnings.length > 0) {
      console.warn('음성 품질 경고:', qualityCheck.warnings);
    }

    // 파일 크기 검증
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API 제한)
    if (audioBlob.size > MAX_FILE_SIZE) {
      throw new Error('오디오 파일이 너무 큽니다. 25MB 이하의 파일만 처리할 수 있습니다.');
    }

    // 파일 형식을 mp3로 변환
    const file = new File([audioBlob], 'audio.mp3', {
      type: 'audio/mp3'
    });

    // FormData 생성 - 의료용 최적화 파라미터
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ko'); // 명시적 한국어 설정
    formData.append('response_format', 'verbose_json'); // 상세 정보 포함
    formData.append('temperature', '0.1'); // 낮은 온도로 일관성 향상
    
    // 의료 용어 프롬프트 추가
    const medicalPrompt = `이것은 의료진과 환자 간의 대화입니다. 의료 용어, 증상, 치료 방법, 약물명 등을 정확히 인식해주세요. 
    일반적인 의료 용어: 혈압, 당뇨, 심장, 폐, 간, 신장, 두통, 복통, 발열, 기침, 호흡곤란, 
    약물: 아스피린, 타이레놀, 항생제, 혈압약, 당뇨약, 진통제
    검사: 혈액검사, 소변검사, X-ray, CT, MRI, 초음파, 심전도
    치료: 수술, 물리치료, 약물치료, 주사, 처방`;
    formData.append('prompt', medicalPrompt);

    console.log('Whisper API 요청 준비 (의료용 최적화):', {
      fileSize: file.size,
      fileType: file.type,
      model: 'whisper-1',
      language: 'ko',
      temperature: '0.1',
      responseFormat: 'verbose_json'
    });

    // Whisper API 호출 (재시도 로직 포함)
    const data = await retryOpenAIRequest(async () => {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Whisper API 응답 에러:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        if (response.status === 401) {
          throw new Error('API 키가 유효하지 않습니다. OpenAI API 키를 확인해주세요.');
        } else if (response.status === 429) {
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          const error = new Error(`음성 변환 실패 (${response.status}: ${response.statusText})`);
          (error as any).status = response.status;
          throw error;
        }
      }

      return response.json();
    });
    
    console.log('Whisper API 응답 (상세):', {
      text: data.text,
      language: data.language,
      duration: data.duration,
      segments: data.segments?.length || 0
    });

    if (!data.text) {
      throw new Error('변환된 텍스트가 없습니다.');
    }

    // 의료 용어 후처리 보정 적용
    const correctedText = correctMedicalTerms(data.text);
    
    console.log('의료 용어 보정 결과:', {
      original: data.text,
      corrected: correctedText,
      changed: data.text !== correctedText
    });

    return correctedText;

  } catch (error) {
    console.error('음성 변환 중 오류 발생:', error);
    throw error;
  }
};

// 오디오 파일 업로드 함수
export const uploadAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const fileName = `audio_${Date.now()}.wav`;
    const storageRef = ref(storage, `audio/${fileName}`);
    await uploadBytes(storageRef, audioBlob);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

const audioService = {
  startRecording,
  stopRecording,
  uploadAudio,
  transcribeAudio
};

export default audioService; 