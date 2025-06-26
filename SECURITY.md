# 🔐 SOAP_AI 보안 가이드

## 보안 개선사항 (2025-01-26)

### ✅ 완료된 보안 강화
1. **인증 시스템 활성화**
   - PrivateRoute에서 실제 인증 체크 활성화
   - 미인증 사용자는 자동으로 로그인 페이지로 리다이렉트
   - 로딩 상태 처리 개선

2. **API 키 보안**
   - 클라이언트 사이드에서 모든 API 키 제거
   - Firebase Functions에서만 API 키 관리
   - 노출된 기존 키들은 무효화 필요

3. **Firebase Functions 보안**
   - 인증된 사용자만 API 호출 가능
   - 적절한 에러 처리 및 로깅
   - CORS 설정으로 도메인 제한

4. **데모 모드 제거**
   - 템플릿 초기화 로직 활성화
   - 실제 Firebase 연결 우선 시도

### ⚠️ 추가 필요한 조치

#### 1. API 키 교체 (중요!)
```bash
# 1. OpenAI 플랫폼에서 기존 키 무효화
# 2. 새로운 키 발급
# 3. Firebase Functions에 새 키 설정
firebase functions:config:set openai.key="NEW_OPENAI_KEY"
firebase functions:config:set pinecone.key="NEW_PINECONE_KEY"

# 4. Functions 재배포
firebase deploy --only functions
```

#### 2. 환경 변수 보안
- [x] .env 파일이 .gitignore에 포함됨
- [x] 클라이언트에서 민감한 키 제거됨
- [ ] 기존 커밋에서 키 히스토리 제거 (git-secrets 사용)

#### 3. Firebase 보안 규칙 강화
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 🛡️ 보안 모범 사례

#### 개발 시 주의사항
1. **절대 금지**
   - API 키를 클라이언트 코드에 하드코딩
   - 민감한 정보를 console.log로 출력
   - .env 파일을 Git에 커밋

2. **권장사항**
   - 모든 API 호출은 Firebase Functions 경유
   - 사용자 입력 검증 및 sanitization
   - 에러 메시지에서 민감한 정보 제외

#### 운영 시 모니터링
1. **Firebase Console 모니터링**
   - Functions 로그 정기 검토
   - 비정상적인 API 사용량 감지
   - 인증 실패 횟수 추적

2. **API 사용량 제한**
   - OpenAI API 월 사용량 제한 설정
   - Rate limiting 구현
   - 사용자별 쿼터 관리

### 🚨 보안 인시던트 대응

#### API 키 노출 시 대응방법
1. **즉시 조치**
   ```bash
   # 1. 노출된 키 무효화
   # 2. 새 키 발급 및 설정
   # 3. 애플리케이션 재배포
   # 4. 로그 모니터링
   ```

2. **사후 조치**
   - 노출 원인 분석
   - 보안 프로세스 개선
   - 팀 교육 실시

### 📋 보안 체크리스트

#### 배포 전 확인사항
- [ ] .env 파일이 Git에 포함되지 않음
- [ ] API 키가 클라이언트 코드에 없음
- [ ] Firebase Functions가 정상 동작함
- [ ] 인증 없이 보호된 페이지 접근 불가
- [ ] 에러 메시지에 민감한 정보 없음

#### 정기 보안 점검 (월 1회)
- [ ] Firebase Functions 로그 검토
- [ ] API 사용량 확인
- [ ] 의존성 보안 업데이트
- [ ] 액세스 로그 분석

### 🔧 보안 도구 추천

1. **개발 도구**
   - `git-secrets`: Git 커밋 시 비밀정보 검사
   - `eslint-plugin-security`: JavaScript 보안 린팅
   - `npm audit`: 의존성 보안 취약점 검사

2. **모니터링 도구**
   - Firebase Console: 실시간 로그 모니터링
   - Google Cloud Security Command Center
   - Sentry: 에러 추적 및 모니터링

### 📞 보안 문의
보안 관련 문제나 의심스러운 활동을 발견하면:
1. 즉시 해당 서비스 중단
2. 개발팀 보고
3. 인시던트 로그 작성