import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { soapNoteFunction } from './soapNote';
import { audioTranscriptionFunction } from './audioTranscription';

// Firebase Admin 초기화
admin.initializeApp();

// CORS 설정
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-app-domain.com', // 실제 도메인으로 변경
    /\.firebaseapp\.com$/,
    /\.web\.app$/
  ],
  credentials: true
};

const corsHandler = cors(corsOptions);

// SOAP 노트 생성 함수
export const generateSoapNote = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    await soapNoteFunction(req, res);
  });
});

// 음성 전사 함수
export const transcribeAudio = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    await audioTranscriptionFunction(req, res);
  });
});

// 헬스 체크 함수
export const healthCheck = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
});

// 인증된 사용자를 위한 SOAP 노트 생성 (보안 강화)
export const generateSoapNoteSecure = functions.https.onCall(async (data, context) => {
  // 사용자 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '이 기능을 사용하려면 로그인이 필요합니다.'
    );
  }

  const { generateSoapNoteSecure } = await import('./soapNote');
  return await generateSoapNoteSecure(data, context);
});

// 인증된 사용자를 위한 음성 전사 (보안 강화)
export const transcribeAudioSecure = functions.https.onCall(async (data, context) => {
  // 사용자 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '이 기능을 사용하려면 로그인이 필요합니다.'
    );
  }

  const { transcribeAudioSecure } = await import('./audioTranscription');
  return await transcribeAudioSecure(data, context);
}); 