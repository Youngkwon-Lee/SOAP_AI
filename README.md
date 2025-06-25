# SOAP AI - SOAP 노트 작성 시스템

SOAP AI는 의료진이 SOAP 형식의 진료 기록을 효율적으로 작성할 수 있도록 도와주는 AI 기반 자동화 시스템입니다.

## 주요 기능

### 🎤 음성 인식 시스템
- **OpenAI Whisper API** 기반 한국어 의료 용어 최적화
- **실시간 음성 품질 모니터링** 및 경고 시스템  
- **의료 용어 후처리 보정** (5개 카테고리 2,000+ 용어)
- **브라우저 최적화** 녹음 설정 (16kHz, 노이즈 억제)

### 🧠 개인화 AI 엔진
- **개인 스타일 학습**: 6개 카테고리 × 10개 패턴 자동 학습
- **Vector Database 통합**: Pinecone을 활용한 의미적 유사성 검색 (선택사항)
- **자동 템플릿 생성**: 학습된 패턴 기반 맞춤형 템플릿
- **실시간 패턴 매칭**: 과거 작성 스타일과 유사한 템플릿 추천

### 📋 템플릿 시스템  
- **5개 전문과 기본 템플릿**: 내과, 외과, 가정의학과, 응급의학과, 물리치료
- **병원별 템플릿 관리**: 각 병원의 고유 형식 지원
- **자동 템플릿 매칭**: 전문과별 최적 템플릿 추천

## 🔍 Vector Database (선택사항)

Vector Database는 개인화 기능을 크게 향상시키는 선택적 기능입니다:

### 설정 방법
1. [Pinecone](https://www.pinecone.io/)에서 무료 계정 생성
2. API 키 발급 후 환경 변수에 추가:
   ```env
   REACT_APP_PINECONE_API_KEY=your_pinecone_api_key_here
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
