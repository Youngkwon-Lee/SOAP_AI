// 임시로 Pinecone import 비활성화 (브라우저 호환성 문제 해결)
// import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone 설정
const PINECONE_API_KEY = process.env.REACT_APP_PINECONE_API_KEY || '';
const INDEX_NAME = 'soap-ai-personalization';

let pineconeClient: any = null;

/**
 * Pinecone 클라이언트 초기화 (임시 비활성화)
 */
const initializePinecone = async (): Promise<any> => {
  console.warn('⚠️ Vector DB 기능이 임시로 비활성화되었습니다 (브라우저 호환성 문제 해결 중)');
  console.info('🔧 Firebase 기반 개인화 기능은 정상 작동합니다.');
  throw new Error('Vector DB 기능이 임시로 비활성화되었습니다.');
};

/**
 * OpenAI Embedding API를 사용하여 텍스트를 벡터로 변환 (임시 비활성화)
 */
const textToVector = async (text: string): Promise<number[]> => {
  console.warn('⚠️ 벡터 변환 기능이 임시로 비활성화되었습니다.');
  return [];
};

/**
 * 개인화 패턴을 벡터로 저장 (임시 비활성화)
 */
export const storeUserStyleVector = async (
  userId: string,
  category: string,
  pattern: string,
  weight: number = 0.5
): Promise<void> => {
  console.info('ℹ️ Vector DB 기능이 임시로 비활성화되었습니다. Firebase 기반 개인화 기능을 사용합니다.');
  // Vector DB 오류시에도 계속 진행 (Firebase 개인화 엔진 사용)
};

/**
 * 템플릿을 벡터로 저장 (임시 비활성화)
 */
export const storeTemplateVector = async (
  templateId: string,
  templateData: any,
  specialty: string,
  hospital: string = 'default'
): Promise<void> => {
  console.info('ℹ️ Vector DB 템플릿 저장이 임시로 비활성화되었습니다. Firebase 템플릿 시스템을 사용합니다.');
  // Vector DB 오류시에도 계속 진행
};

/**
 * 유사한 스타일 패턴 검색 (임시 비활성화)
 */
export const findSimilarPatterns = async (
  userId: string,
  queryText: string,
  category?: string,
  topK: number = 5
): Promise<any[]> => {
  console.info('ℹ️ Vector DB 패턴 검색이 임시로 비활성화되었습니다. Firebase 기반 패턴 매칭을 사용합니다.');
  return [];
};

/**
 * 유사한 템플릿 검색 (임시 비활성화)
 */
export const findSimilarTemplates = async (
  queryText: string,
  specialty?: string,
  topK: number = 3
): Promise<any[]> => {
  console.info('ℹ️ Vector DB 템플릿 검색이 임시로 비활성화되었습니다. Firebase 템플릿 필터링을 사용합니다.');
  return [];
};

/**
 * 벡터 데이터베이스 상태 확인 (임시 비활성화)
 */
export const getVectorDatabaseStats = async (): Promise<{
  totalVectors: number;
  indexReady: boolean;
}> => {
  console.info('ℹ️ Vector DB 상태 확인이 임시로 비활성화되었습니다.');
  return {
    totalVectors: 0,
    indexReady: false
  };
};

/**
 * Vector DB가 사용 가능한지 확인 (임시 비활성화)
 */
export const isVectorDatabaseAvailable = (): boolean => {
  return false;  // 임시로 false 반환 (브라우저 호환성 문제로 비활성화)
};

// 콘솔에 상태 알림
console.group('🚀 SOAP AI Vector DB 상태');
console.warn('⚠️ Vector DB 기능이 임시로 비활성화되었습니다.');
console.info('✅ Firebase 기반 개인화 기능은 정상 작동합니다.');
console.info('💡 완전한 Vector DB 기능이 필요하시면 CRACO 설정을 추가하세요.');
console.groupEnd();

export default {
  storeUserStyleVector,
  storeTemplateVector,
  findSimilarPatterns,
  findSimilarTemplates,
  getVectorDatabaseStats,
  isVectorDatabaseAvailable
}; 