# SOAP AI 프로젝트 규칙 및 정보

## 프로젝트 기본 정보

### 주요 경로 및 위치
- **로컬 개발 경로**: `/mnt/c/Users/YK/SOAP_AI` (WSL 환경)
- **GitHub 저장소**: `git@github.com:Youngkwon-Lee/SOAP_AI.git`
- **도메인**: `soapai.shop`
- **Firebase 프로젝트 ID**: `soap-note-ai` (실제 프로젝트)
- **Firebase Hosting URL**: `https://soap-ai.web.app` 또는 `https://soap-ai.firebaseapp.com`

### EC2 서버 정보 (레거시, 현재 미사용)
- **EC2 IP**: `43.201.5.96`
- **사용자**: `ubuntu`
- **SSH 키 경로**: `/home/gun3856/.ssh/ec2-key.pem`
- **키 권한**: 400 (-r--------)
- **SSH 접근**: `ssh -i ~/.ssh/ec2-key.pem ubuntu@43.201.5.96`

### EC2 용량 및 폴더 구조 (2025-06-27 기준)
**디스크 사용량:**
- **전체 용량**: 19GB
- **사용량**: 6.7GB (37%)
- **남은 용량**: 12GB

**주요 디렉토리 크기:**
- `/home/ubuntu/soap-ai`: 170MB (정리 후)
  - `functions`: 144MB (Firebase Functions)
  - `src`: 632KB (소스 코드)
  - `package-lock.json`: 676KB
  - `deployment`: 112KB
  - `public`: 52KB
- `/home/ubuntu/coffee-crawler`: 84MB
- `/home/ubuntu/youtube_summerizer`: 41MB
- `/home/ubuntu/ai-soccer-platform`: 8.6MB

**정리 완료 항목:**
- ✅ `node_modules` (506MB) 삭제됨
- ✅ `soap-ai-backup.tar.gz` (45MB) 삭제됨

### 주요 서비스 및 계정
- **도메인 등록업체**: 한국 도메인 서비스 (DNS 관리)
- **호스팅**: Firebase Hosting (EC2에서 전환)
- **데이터베이스**: Firebase Firestore
- **인증**: Firebase Authentication
- **저장소**: Firebase Storage
- **배포**: GitHub Actions → Firebase Hosting

## 배포 및 개발 워크플로우

### ✅ 올바른 배포 프로세스 (확정)
1. **로컬 개발**: `/mnt/c/Users/YK/SOAP_AI`에서 코드 수정
2. **로컬 빌드 테스트**: `CI=false npm run build` (선택사항)
3. **Git 커밋**: 
   ```bash
   git add .
   git commit -m "commit message"
   git push origin master
   ```
4. **자동 배포**: GitHub Actions → Firebase Hosting (`soap-note-ai` 프로젝트)
5. **도메인 확인**: `https://soapai.shop` (5-10분 후 반영)

### 🚀 배포 순서 및 방법
**단계 1: 로컬 개발**
- 경로: `/mnt/c/Users/YK/SOAP_AI`
- 개발 서버: `npm start` (http://localhost:3000)
- 빌드 테스트: `CI=false npm run build`

**단계 2: Git 관리**
- Remote: `git@github.com:Youngkwon-Lee/SOAP_AI.git` (SSH)
- SSH 키: `/home/gun3856/.ssh/id_ed25519`
- 브랜치: `master`

**단계 3: 자동 배포 (GitHub Actions)**
- 트리거: `master` 브랜치 push
- 워크플로우: `.github/workflows/deploy.yml`
- 빌드: `CI=false npm run build`
- 배포: Firebase Hosting (`soap-note-ai`)
- 결과: https://soapai.shop

### Git 설정
- **Remote URL**: SSH 방식 사용 (`git@github.com:Youngkwon-Lee/SOAP_AI.git`)
- **SSH 키**: `/home/gun3856/.ssh/id_ed25519` (이미 GitHub에 등록됨)
- **SSH 키 권한**: 600 (-rw-------)
- **SSH 디렉토리 권한**: 700 (drwx------)
- **브랜치**: `master` 브랜치에 push 시 자동 배포

## 문제 해결 규칙

### 1. 배포 문제
**문제**: GitHub Actions 배포 실패
**해결**:
- CI=false 환경변수 사용으로 ESLint 경고 무시
- Firebase Service Account 키 확인 (`FIREBASE_SERVICE_ACCOUNT_SOAP_AI`)
- ⚠️ **중요**: Node.js 20 버전 필수 (Firebase CLI v14+ 요구사항)
- `npm ci` 사용 (npm install 대신)
- Firebase 프로젝트 ID 일치 확인 (`soap-note-ai`)

**문제**: Firebase Authentication `auth/api-key-not-valid` 오류
**해결**:
- ⚠️ **중요**: GitHub Secrets에 7개 Firebase 환경 변수 필수 추가
- 환경 변수가 빌드 시 GitHub Actions에서 주입되도록 워크플로우 수정
- Firebase Console → Authentication → Authorized domains에 `soapai.shop` 추가
- 필수 GitHub Secrets 목록:
  ```
  REACT_APP_FIREBASE_API_KEY
  REACT_APP_FIREBASE_AUTH_DOMAIN  
  REACT_APP_FIREBASE_PROJECT_ID
  REACT_APP_FIREBASE_STORAGE_BUCKET
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  REACT_APP_FIREBASE_APP_ID
  REACT_APP_FIREBASE_MEASUREMENT_ID
  ```

**문제**: EC2 배포 관련 오류
**해결**: 
- EC2 배포는 중단, Firebase Hosting만 사용
- t2.micro 인스턴스는 메모리 부족으로 React 빌드 실패

### 2. DNS 및 도메인 설정
**문제**: 도메인 연결 오류
**해결**:
- Firebase 제공 IP로 A 레코드 설정
- TXT 레코드로 도메인 소유권 확인
- DNS 전파 시간 고려 (5-30분)

**최종 성공한 DNS 설정**:
```
A 레코드: @ → 199.36.158.100  
TXT 레코드: @ → hosting-site=soap-note-ai
```

**문제**: 도메인 연결 후 "Site Not Found" 오류
**해결**:
- Firebase Console → Hosting → 도메인에서 `soapai.shop` 설정 확인
- "다른 도메인으로 리디렉션" → "이 사이트로 이 도메인 연결"로 변경
- DNS 전파 시간 대기 (5-30분)
- 브라우저 캐시 새로고침 (Ctrl+F5)

### 3. 빌드 문제
**문제**: 로컬 빌드 타임아웃
**해결**:
- `CI=false npm run build` 사용
- ESLint 경고 무시
- 타임아웃 5분으로 설정

**문제**: 의존성 설치 오류
**해결**:
- `npm ci` 사용 (package-lock.json 기반)
- `npm install` 대신 사용으로 일관성 보장

### 4. Git 인증 문제
**문제**: HTTPS 인증 실패
**해결**:
- SSH 키 방식으로 변경
- `git remote set-url origin git@github.com:Youngkwon-Lee/SOAP_AI.git`
- `ssh-keyscan github.com >> ~/.ssh/known_hosts`

### 5. Firebase 관련 설정
**GitHub Secrets 필요**:
- `FIREBASE_SERVICE_ACCOUNT_SOAP_AI`: Firebase Service Account JSON 키
- `GITHUB_TOKEN`: 자동 제공됨

**Firebase 설정 파일**:
- `firebase.json`: Hosting 설정 (build 폴더 사용)
- `.firebaserc`: 프로젝트 ID 설정

### 📁 로컬 프로젝트 구조
```
/mnt/c/Users/YK/SOAP_AI/
├── build/                    # 빌드 결과물 (Firebase Hosting 배포용)
├── src/                      # React 소스 코드
├── public/                   # 정적 파일
├── functions/                # Firebase Functions
├── .github/workflows/        # GitHub Actions 설정
│   └── deploy.yml           # 자동 배포 워크플로우
├── firebase.json            # Firebase 설정
├── .firebaserc              # Firebase 프로젝트 설정 (soap-note-ai)
├── package.json             # 의존성 관리
├── CLAUDE.md               # 프로젝트 규칙 및 정보 (이 파일)
└── README.md               # 프로젝트 설명
```

## 주요 명령어

### 개발 명령어
```bash
# 로컬 개발 서버
npm start

# 프로덕션 빌드
CI=false npm run build

# 의존성 설치
npm ci
```

### Git 명령어
```bash
# 변경사항 커밋
git add .
git commit -m "commit message"
git push origin master

# SSH 연결 테스트
ssh -T git@github.com
```

### Firebase 명령어
```bash
# 로컬 배포 (수동)
firebase deploy --only hosting

# 로그인 (CI 환경)
firebase login:ci
```

## 주의사항

### 절대 하지 말 것
1. **EC2 배포 시도**: 메모리 부족으로 실패
2. **HTTPS Git 사용**: 인증 문제 발생
3. **npm install 사용**: package-lock.json 무시됨
4. **빌드 시 ESLint 경고 방치**: CI=false 필수

### 항상 확인할 것
1. **DNS 전파 시간**: 변경 후 5-30분 대기
2. **GitHub Actions 로그**: 배포 실패 원인 확인
3. **Firebase Console**: 도메인 연결 상태 확인
4. **로컬 빌드 성공**: 배포 전 로컬에서 빌드 테스트

## 환경 변수

### 로컬 개발 (.env)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyCpF7...
REACT_APP_FIREBASE_AUTH_DOMAIN=soap-ai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=soap-ai
REACT_APP_FIREBASE_STORAGE_BUCKET=soap-ai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### Firebase Functions
- Functions 폴더: `/functions`
- Node.js 18 사용
- Firebase Admin SDK 사용

## 성공적인 배포 체크리스트

1. ✅ 로컬에서 `CI=false npm run build` 성공
2. ✅ Git SSH 연결 정상
3. ✅ GitHub Actions 워크플로우 성공
4. ✅ Firebase Hosting 배포 완료
5. ✅ DNS 설정 올바름 (A, TXT 레코드)
6. ✅ `https://soapai.shop` 접속 가능

## 트러블슈팅 우선순위

1. **GitHub Actions 실패**: 로그 확인 → Secret 키 확인 → 의존성 문제 해결
2. **도메인 접속 불가**: DNS 전파 확인 → Firebase 도메인 설정 확인
3. **빌드 실패**: ESLint 경고 확인 → CI=false 설정 → 의존성 업데이트
4. **Git 문제**: SSH 키 확인 → 원격 저장소 URL 확인

## 📅 2025-06-27 작업 요약

### ✅ 완료된 주요 작업들

#### 1. **EC2 서버 정리 및 최적화**
- **node_modules (506MB) 삭제** → 메모리 부족 해결
- **soap-ai-backup.tar.gz (45MB) 삭제** → 불필요한 백업 파일 제거
- **EC2 용량**: 19GB 중 6.7GB 사용 (37%) → 12GB 여유 공간 확보
- **SSH 키 설정**: WSL 환경에서 EC2 접근 가능 (`~/.ssh/ec2-key.pem`)

#### 2. **Firebase Hosting 배포 완전 전환**
- **EC2 nginx 배포 중단** → Firebase Hosting 자동 배포로 변경
- **GitHub Actions 워크플로우 수정**: `.github/workflows/deploy.yml`
- **Node.js 18 → 20 업그레이드**: Firebase CLI v14+ 호환성 요구사항
- **프로젝트 ID 수정**: `soap-ai` → `soap-note-ai` (실제 Firebase 프로젝트 매칭)

#### 3. **도메인 연결 성공**
- **DNS 설정**: `soapai.shop` → Firebase IP (199.36.158.100)
- **TXT 레코드**: `hosting-site=soap-note-ai` 소유권 인증
- **Firebase Console**: 도메인 연결 방식 "리디렉션" → "직접 연결"로 변경
- **최종 결과**: https://soapai.shop 정상 접속 가능

#### 4. **Firebase Authentication 문제 해결**
- **원인**: GitHub Secrets에 Firebase 환경 변수 누락 → `demo-api-key` 사용됨
- **해결**: 7개 Firebase 환경 변수를 GitHub Secrets에 추가
- **워크플로우 수정**: 빌드 시 환경 변수 주입 설정 추가
- **Firebase Console**: Authorized domains에 `soapai.shop` 추가
- **최종 결과**: 로그인/회원가입 정상 작동

#### 5. **백업 및 규칙 정리**
- **CLAUDE.md 4곳 백업 저장**:
  - 프로젝트 내: `/mnt/c/Users/YK/SOAP_AI/CLAUDE.md`
  - Windows 루트: `/mnt/c/Users/YK/CLAUDE-SOAP_AI-RULES.md`
  - WSL 홈: `/home/gun3856/CLAUDE-SOAP_AI-RULES.md`  
  - EC2 서버: `ubuntu@43.201.5.96:~/CLAUDE-SOAP_AI-RULES.md`

### 🔧 핵심 기술 설정

#### **GitHub Actions 환경 변수 (필수)**
```
REACT_APP_FIREBASE_API_KEY=AIzaSyAXZKivR30wveUw7YI-hy2SebNAqB5LBTU
REACT_APP_FIREBASE_AUTH_DOMAIN=soap-note-ai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=soap-note-ai
REACT_APP_FIREBASE_STORAGE_BUCKET=soap-note-ai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=535547123235
REACT_APP_FIREBASE_APP_ID=1:535547123235:web:bd37007412c6144fc00396
REACT_APP_FIREBASE_MEASUREMENT_ID=G-DWG02ZGLRR
FIREBASE_SERVICE_ACCOUNT_SOAP_AI=[JSON 키]
```

#### **최종 배포 플로우 (확정)**
1. **로컬 개발**: `/mnt/c/Users/YK/SOAP_AI`
2. **Git 푸시**: `git push origin master`  
3. **GitHub Actions**: Node.js 20 + Firebase 환경 변수 주입
4. **Firebase Hosting**: 자동 배포 (`soap-note-ai` 프로젝트)
5. **결과**: https://soapai.shop (2-3분 후 반영)

### 🚨 중요한 학습 포인트

1. **Node.js 20 필수**: Firebase CLI v14+는 Node.js 18 지원 중단
2. **환경 변수 누락 → demo-api-key**: GitHub Secrets 설정 필수 확인
3. **도메인 연결 방식**: Firebase Console에서 "직접 연결" 설정 중요  
4. **EC2 vs Firebase**: t2.micro 메모리 한계로 Firebase Hosting이 더 안정적
5. **SSH 키 권한**: WSL에서 Windows 파일시스템 권한 문제 → 복사 필요

---
📝 **마지막 업데이트**: 2025-06-27 (Firebase 배포 완전 성공)
🔄 **다음 업데이트**: 주요 설정 변경 시 즉시 반영
✅ **상태**: https://soapai.shop 정상 운영 중