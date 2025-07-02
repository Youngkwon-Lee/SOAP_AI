# SOAP AI - SOAP 노트 작성 시스템 ✅

SOAP AI는 의료진이 SOAP 형식의 진료 기록을 효율적으로 작성할 수 있도록 도와주는 AI 기반 자동화 시스템입니다.

---

## ⚙️ 환경 변수(.env) 예시

아래와 같이 `.env` 또는 `.env.local` 파일을 프로젝트 루트에 생성하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_PINECONE_API_KEY=your_pinecone_api_key
```

---

## 🚀 배포 및 CI/CD 안내

### Firebase Functions/Hosting 배포
```bash
npx firebase deploy --only functions   # Functions만 배포
npx firebase deploy --only hosting     # Hosting만 배포
npx firebase deploy                    # 전체 배포
```

### OpenAI API 키 설정 (Functions)
```bash
npx firebase functions:config:set openai.key="sk-..."
npx firebase deploy --only functions
```

---

## 주요 기능

### 🎤 음성 인식 시스템 (STT)
- **OpenAI Whisper API** 기반 한국어 의료 용어 최적화
- **실시간 음성 품질 모니터링** 및 경고 시스템  
- **의료 용어 후처리 보정** (5개 카테고리 2,000+ 용어)
- **브라우저 최적화** 녹음 설정 (16kHz, 노이즈 억제)
- **Fine-tuning 데이터 준비**: 사용자 맞춤형 STT 모델 고도화를 위한 웹 기반 전사/수정 도구 개발 중.

### 🧠 개인화 AI 엔진
- **개인 스타일 학습**: 6개 카테고리 × 10개 패턴 자동 학습
- **Vector Database 통합**: Pinecone을 활용한 의미적 유사성 검색 (선택사항)
- **자동 템플릿 생성**: 학습된 패턴 기반 맞춤형 템플릿
- **실시간 패턴 매칭**: 과거 작성 스타일과 유사한 템플릿 추천

### 📋 템플릿 시스템  
- **5개 전문과 기본 템플릿**: 내과, 외과, 가정의학과, 응급의학과, 물리치료
- **병원별 템플릿 관리**: 각 병원의 고유 형식 지원
- **자동 템플릿 매칭**: 전문과별 최적 템플릿 추천

## 🚀 Fine-tuning 모델 고도화 (진행 중)

SOAP AI는 STT 모델의 정확도를 더욱 높이기 위해 Fine-tuning 기능을 개발하고 있습니다. 현재 **사용자 맞춤형 STT 데이터셋 구축**에 집중하고 있으며, 이를 위한 **웹 기반 전사/수정 도구**를 개발 중입니다.

### 웹 기반 전사/수정 도구 (Transcription Editor)
사용자 녹음 파일의 초벌 STT 결과를 웹 인터페이스에서 편리하게 수정하고, 화자(의료진/환자)를 분리하여 라벨링할 수 있도록 돕는 도구입니다. 이 도구를 통해 수집된 고품질 데이터는 STT 모델의 Fine-tuning에 활용될 예정입니다.

**주요 기능:**
- 오디오 파일 목록 조회 및 재생
- 초벌 전사 텍스트 로드 및 편집
- `[의료진]:`, `[환자]:` 등 화자 태그 간편 삽입
- 수정된 텍스트 저장

**접근 방법:**
1.  **데이터 준비:** 사용자 녹음 파일(`finetuning_data/user_audio`)을 OpenAI Whisper API로 초벌 전사하여 `finetuning_data/transcription_draft.txt` 파일을 생성합니다.
2.  **수동 수정 및 라벨링:** 웹 기반 도구를 사용하여 `transcription_draft.txt` 파일의 내용을 수정하고, 화자 정보를 추가합니다.
3.  **Fine-tuning 데이터셋 생성:** 수정된 텍스트를 기반으로 OpenAI Fine-tuning API가 요구하는 JSONL 형식의 데이터셋을 생성합니다.

## 🔍 Vector Database (선택사항)

Vector Database는 개인화 기능을 크게 향상시키는 선택적 기능입니다:

### 설정 방법
1. [Pinecone](https://www.pinecone.io/)에서 무료 계정 생성
2. API 키 발급 후 환경 변수에 추가:
   ```env
   REACT_APP_PINECONE_API_KEY=your_pinecone_api_key
   ```

### Vector DB 활성화 시 추가 기능
- **의미적 패턴 검색**: 비슷한 의미의 과거 작성 패턴 자동 검색
- **고급 개인화**: 더 정교한 개인 스타일 학습 및 적용
- **향상된 템플릿 추천**: 의미적 유사성 기반 정확한 추천

### Vector DB 없이도 가능한 기능
- 모든 핵심 SOAP 노트 작성 기능
- 기본 개인화 학습 (Firestore 기반)
- 전문과별 템플릿 사용
- 음성 인식 및 의료 용어 보정

> **참고**: Vector Database는 완전히 선택사항입니다. API 키 없이도 모든 핵심 기능을 사용할 수 있습니다!

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).