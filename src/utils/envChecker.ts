// 환경 변수 보안 체크 유틸리티
export const checkEnvSecurity = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const warnings: string[] = [];

  // OpenAI API 키 체크
  if (process.env.REACT_APP_OPENAI_API_KEY) {
    if (!isDevelopment) {
      warnings.push('⚠️ OpenAI API 키가 클라이언트에 노출되어 있습니다. 보안상 위험할 수 있습니다.');
    }
    
    if (!process.env.REACT_APP_OPENAI_API_KEY.startsWith('sk-')) {
      warnings.push('❌ OpenAI API 키 형식이 올바르지 않습니다.');
    }
  } else {
    warnings.push('❌ OpenAI API 키가 설정되지 않았습니다.');
  }

  // Firebase 설정 체크
  const firebaseKeys = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];

  const missingFirebaseKeys = firebaseKeys.filter(key => !process.env[key]);
  if (missingFirebaseKeys.length > 0) {
    warnings.push(`❌ Firebase 설정이 누락되었습니다: ${missingFirebaseKeys.join(', ')}`);
  }

  // Pinecone Vector DB 체크 (선택사항)
  const hasPineconeKey = Boolean(process.env.REACT_APP_PINECONE_API_KEY);
  if (!hasPineconeKey) {
    warnings.push('ℹ️ Pinecone Vector DB 키가 설정되지 않았습니다. (선택사항 - 기본 개인화 기능만 사용됩니다)');
  }

  return {
    isDevelopment,
    warnings,
    hasWarnings: warnings.length > 0,
    hasAPIKey: Boolean(process.env.REACT_APP_OPENAI_API_KEY),
    hasFirebaseConfig: missingFirebaseKeys.length === 0,
    hasVectorDB: hasPineconeKey
  };
};

export const logSecurityWarnings = () => {
  const check = checkEnvSecurity();
  
  if (check.hasWarnings) {
    console.group('🔒 보안 체크 결과');
    check.warnings.forEach(warning => console.warn(warning));
    
    if (!check.isDevelopment) {
      console.warn('🚨 프로덕션 환경에서는 반드시 서버 사이드에서 API 키를 처리해야 합니다!');
      console.warn('💡 Firebase Functions 또는 별도 백엔드 서버 사용을 권장합니다.');
    }
    
    console.groupEnd();
  }
};

// 개발 환경에서만 보안 경고 표시
if (process.env.NODE_ENV === 'development') {
  logSecurityWarnings();
} 