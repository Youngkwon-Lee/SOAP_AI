# SOAP AI Firebase Functions 설정 가이드

## 🚀 개요
이 문서는 SOAP AI 프로젝트의 Firebase Functions 설정 및 배포 방법을 안내합니다.

## 🔧 사전 요구사항

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인
```bash
firebase login
```

### 3. Firebase 프로젝트 초기화
```bash
firebase init functions
```

## 📦 의존성 설치

### Functions 폴더로 이동 후 의존성 설치
```bash
cd functions
npm install
```

## 🔑 환경 변수 설정

### 1. Firebase Functions 환경 변수 설정
```bash
firebase functions:config:set openai.key="your-openai-api-key-here"
```

### 2. 환경 변수 확인
```bash
firebase functions:config:get
```

### 3. 로컬 개발용 환경 변수 (선택사항)
```bash
# functions 폴더에 .env 파일 생성
echo "OPENAI_API_KEY=your-openai-api-key-here" > .env
```

## 🏗️ 빌드 및 배포

### 1. TypeScript 빌드
```bash
npm run build
```

### 2. 로컬 에뮬레이터 실행 (테스트용)
```bash
npm run serve
```

### 3. 프로덕션 배포
```bash
npm run deploy
```

## 🔒 보안 강화 요소

### ✅ 이미 구현된 보안 기능
- **API 키 서버 사이드 보관**: OpenAI API 키가 클라이언트에 노출되지 않음
- **Firebase 인증 필수**: 모든 요청에 Firebase 인증 토큰 필요
- **CORS 설정**: 허용된 도메인에서만 요청 가능
- **입력 데이터 검증**: 모든 입력 데이터 유효성 검사
- **에러 처리**: 상세한 에러 로깅 및 사용자 친화적 메시지
- **파일 크기 제한**: 음성 파일 25MB 제한
- **재시도 로직**: 네트워크 오류 시 자동 재시도

## 📋 사용 가능한 Functions

### 1. generateSoapNoteSecure
- **용도**: SOAP 노트 생성
- **인증**: Firebase 인증 필요
- **매개변수**:
  ```typescript
  {
    noteType: string,
    patientInfo: PatientInfo,
    shorthandNotes: string,
    language?: string,
    template?: string
  }
  ```

### 2. transcribeAudioSecure
- **용도**: 음성 전사
- **인증**: Firebase 인증 필요
- **매개변수**:
  ```typescript
  {
    audioData: string, // Base64 인코딩된 오디오 데이터
    fileName?: string,
    language?: string
  }
  ```

### 3. generateSoapNote & transcribeAudio
- **용도**: HTTP 요청 지원 (레거시)
- **인증**: 선택사항
- **사용법**: POST 요청

### 4. healthCheck
- **용도**: 서버 상태 확인
- **인증**: 불필요
- **사용법**: GET 요청

## 🏃‍♂️ 클라이언트 코드 업데이트

### 기존 코드 (보안 취약)
```typescript
// ❌ 클라이언트에서 직접 OpenAI API 호출
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` // 🚨 보안 위험
  }
});
```

### 새로운 코드 (보안 강화)
```typescript
// ✅ Firebase Functions 사용
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateSoapNote = httpsCallable(functions, 'generateSoapNoteSecure');
const result = await generateSoapNote(params);
```

## 🔧 문제 해결

### 1. 배포 오류
```bash
# 의존성 다시 설치
cd functions
rm -rf node_modules package-lock.json
npm install

# 다시 배포
npm run deploy
```

### 2. 환경 변수 오류
```bash
# 환경 변수 확인
firebase functions:config:get

# 환경 변수 재설정
firebase functions:config:set openai.key="your-new-api-key"
```

### 3. 권한 오류
```bash
# Firebase 재로그인
firebase logout
firebase login

# 프로젝트 재선택
firebase use --add
```

## 📊 모니터링

### 1. 함수 로그 확인
```bash
firebase functions:log
```

### 2. 특정 함수 로그 확인
```bash
firebase functions:log --only generateSoapNoteSecure
```

### 3. Firebase 콘솔에서 모니터링
- [Firebase Console](https://console.firebase.google.com/)
- Functions > 대시보드에서 실시간 모니터링 가능

## 🎯 다음 단계

1. **Firebase Functions 배포 완료 후**:
   - 클라이언트 코드에서 OpenAI API 키 제거
   - 환경 변수에서 `REACT_APP_OPENAI_API_KEY` 삭제
   - `.env` 파일 업데이트

2. **추가 보안 강화 (권장)**:
   - API 요청 빈도 제한 (Rate Limiting)
   - 사용자별 요청 할당량 설정
   - 보안 헤더 추가

3. **성능 최적화**:
   - 함수 콜드 스타트 최소화
   - 메모리 할당 최적화
   - 캐싱 전략 구현

---

**⚠️ 중요**: 배포 후 반드시 기존 클라이언트 코드에서 OpenAI API 키를 제거하고 .env 파일을 업데이트하세요. 