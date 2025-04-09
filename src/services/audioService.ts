import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// 음성을 텍스트로 변환하는 함수
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
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

    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ko');
    formData.append('response_format', 'json');

    console.log('Whisper API 요청 준비:', {
      fileSize: file.size,
      fileType: file.type,
      model: 'whisper-1',
      language: 'ko'
    });

    // Whisper API 호출
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
        throw new Error(`음성 변환 실패 (${response.status}: ${response.statusText})`);
      }
    }

    const data = await response.json();
    console.log('Whisper API 응답:', data);

    if (!data.text) {
      throw new Error('변환된 텍스트가 없습니다.');
    }

    return data.text;

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