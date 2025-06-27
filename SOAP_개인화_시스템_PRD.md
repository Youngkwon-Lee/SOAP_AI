# SOAP AI 개인화 시스템 PRD

## 🎯 프로젝트 개요

### 핵심 비전
**"각 의료진의 SOAP 노트 작성 스타일을 학습하여, 병원별 템플릿과 개인 선호도를 반영한 고품질 SOAP 노트를 자동 생성하는 AI 시스템"**

### 해결하고자 하는 문제
1. **병원별 상이한 SOAP 템플릿** - 표준화된 템플릿 부재
2. **템플릿 미보유 의료진** - 품질 일관성 부족  
3. **반복적 문서 작업** - 시간 낭비 및 피로도 증가
4. **개인 스타일 미반영** - 획일적인 문서 생성

---

## 🚀 핵심 기능

### 1. 적응형 템플릿 시스템
```
🏥 병원별 템플릿 관리
├── 대학병원: 상세형 템플릿 (연구/교육 중심)
├── 종합병원: 표준형 템플릿 (진료 효율 중심)  
├── 클리닉: 간소형 템플릿 (빠른 처리 중심)
└── 전문병원: 특화형 템플릿 (전문과 중심)

🔧 기본 템플릿 제공 (5개 전문과)
├── 내과: 만성질환 관리 중심
├── 외과: 수술 및 처치 중심
├── 가정의학과: 종합적 건강 관리
├── 물리치료: 기능 회복 중심
└── 응급의학과: 신속 진단 중심
```

### 2. 개인화 학습 엔진
```
📊 6개 카테고리 × 10개 패턴 학습
├── SOAP 구조 패턴: S:O:A:P 비율 선호도
├── 용어 사용 패턴: 전문용어 vs 일반용어
├── 상세도 패턴: 간결형 vs 상세형
├── 포커스 패턴: 증상/검사/치료 중심성
├── 문장 구조 패턴: 단문 vs 복문 선호
└── 형식 패턴: 문단형 vs 목록형

🔄 지속적 품질 향상
├── 사용자 저장 데이터 학습
├── 피드백 기반 모델 개선
├── 실시간 스타일 적응
└── Fine-tuning 자동 적용
```

### 3. 다중 입력 통합 시스템
```
🎙️ 음성 입력 (의료 특화)
├── 실시간 녹음 + 의료용어 최적화
├── 파일 업로드 + 노이즈 제거
└── 의료진/환자 음성 분리

📄 텍스트 입력
├── 직접 입력 + 자동완성
├── 기존 차트 가져오기
└── 복사/붙여넣기 + 구조화

📊 데이터 연동
├── 바이탈 사인 자동 입력
├── 검사 결과 통합
└── 과거 진료 기록 참조
```

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 19 + TypeScript 4.9
- **State**: Context API + Custom Hooks
- **Styling**: Tailwind CSS 4.1
- **Audio**: Web Audio API (음성 처리)

### Backend & AI
- **Runtime**: Node.js 18+ (Firebase Functions)
- **AI**: OpenAI GPT-4 + Whisper API
- **Personalization**: Fine-tuning API + Custom Models
- **Vector DB**: Pinecone (템플릿/스타일 벡터 저장)

### Database
- **Primary**: Firestore (사용자, SOAP 노트)
- **Vector**: Pinecone (스타일 패턴)
- **Storage**: Firebase Storage (음성, 템플릿)
- **Cache**: Redis (자주 사용 템플릿)

---

## 📱 UI/UX 설계

### 메인 대시보드
```
┌─────────────────────────────────────────┐
│ 🏥 SOAP AI                    👤 Profile │
├─────────────────────────────────────────┤
│ 📊 개인화 학습 현황                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ 학습률   │ │ 정확도   │ │ 시간절약  │    │
│ │  78%    │ │  94%    │ │  80%    │    │
│ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────┤
│ 🚀 빠른 SOAP 생성                       │
│ [🎙️ 음성녹음] [📝 텍스트] [📋 템플릿]   │
├─────────────────────────────────────────┤
│ 📋 나의 템플릿 (3개)                    │
│ • 고혈압 추적관찰 - 사용 24회 ⭐⭐⭐⭐⭐   │
│ • 당뇨 관리 - 사용 18회 ⭐⭐⭐⭐        │
│ • 물리치료 평가 - 사용 12회 ⭐⭐⭐⭐⭐   │
└─────────────────────────────────────────┘
```

### SOAP 생성 페이지
```
┌─────────────────────────────────────────┐
│ 📝 SOAP 노트 생성                       │
├─────────────────────────────────────────┤
│ 👤 환자정보                             │
│ 이름: [김○○] 나이: [45] 성별: [남]      │
│ 진료과: [내과▼] 템플릿: [고혈압▼]       │
├─────────────────────────────────────────┤
│ 🎙️ 입력방식                            │
│ ● 실시간 녹음  ○ 파일업로드  ○ 텍스트   │
│                                         │
│ 🔴 녹음중 [████████░░] 65% - 03:42      │
│ 💡 더 가까이 말씀해주세요                │
├─────────────────────────────────────────┤
│ 🤖 AI 처리상태                          │
│ ✅ 음성 전사완료                        │
│ 🔄 개인스타일 적용중... 85%              │
│ ⏳ SOAP 생성중...                       │
└─────────────────────────────────────────┘
```

---

## 📁 프로젝트 구조

### Frontend 핵심 구조
```
src/
├── components/
│   ├── personalization/     # 개인화 관련
│   │   ├── LearningDashboard.tsx
│   │   ├── StyleAnalyzer.tsx
│   │   └── PersonalizationSettings.tsx
│   ├── templates/           # 템플릿 관리
│   │   ├── TemplateManager.tsx
│   │   ├── HospitalTemplates.tsx
│   │   └── DefaultTemplates.tsx
│   └── soap/               # SOAP 생성
│       ├── PersonalizedGenerator.tsx
│       ├── StyleApplicator.tsx
│       └── QualityValidator.tsx
│
├── services/
│   ├── personalization/
│   │   ├── styleAnalyzer.ts
│   │   ├── patternMatcher.ts
│   │   └── learningEngine.ts
│   ├── templates/
│   │   ├── templateManager.ts
│   │   ├── hospitalTemplates.ts
│   │   └── autoMatcher.ts
│   └── ai/
│       ├── personalizedAI.ts
│       ├── fineTuningService.ts
│       └── qualityAssurance.ts
```

### Backend Functions 구조
```
functions/src/
├── personalization/
│   ├── styleAnalyzer.ts      # 개인 스타일 분석
│   ├── patternExtractor.ts   # 패턴 추출
│   ├── learningEngine.ts     # 학습 엔진
│   └── fineTuningManager.ts  # Fine-tuning 관리
│
├── templates/
│   ├── hospitalManager.ts    # 병원별 템플릿
│   ├── defaultTemplates.ts   # 기본 템플릿
│   ├── autoGenerator.ts      # 자동 템플릿 생성
│   └── qualityAssurance.ts   # 템플릿 품질 검증
│
└── soap/
    ├── personalizedGenerator.ts  # 개인화 생성기
    ├── styleApplicator.ts        # 스타일 적용기
    └── adaptiveFormatter.ts      # 적응형 포맷터
```

---

## 🗄️ 데이터베이스 설계

### Firestore 핵심 컬렉션

#### Users - 개인화 프로필
```typescript
users/{userId}/personalization {
  learningStatus: {
    totalSoapCount: number;
    templateCount: number;
    styleAccuracy: number;        // 0.0 ~ 1.0
    lastUpdated: Timestamp;
  },
  
  styleProfile: {
    soapStructureRatio: {         // S:O:A:P 선호 비율
      subjective: 0.25,
      objective: 0.30,
      assessment: 0.25,
      plan: 0.20
    },
    
    patterns: {
      structurePatterns: Pattern[10],    // 최신 10개 패턴
      terminologyPatterns: Pattern[10],
      detailPatterns: Pattern[10],
      focusPatterns: Pattern[10],
      sentencePatterns: Pattern[10],
      formatPatterns: Pattern[10]
    }
  }
}
```

#### Templates - 병원별 템플릿
```typescript
templates/{templateId} {
  metadata: {
    name: string;
    hospital: string;             // "서울대병원", "삼성병원" 등
    specialty: string;
    type: "hospital" | "default" | "personal";
    quality: {
      usageCount: number;
      averageRating: number;
      successRate: number;        // AI 생성 성공률
    }
  },
  
  structure: {
    subjective: TemplateSection,
    objective: TemplateSection,
    assessment: TemplateSection,
    plan: TemplateSection
  },
  
  personalization: {
    adaptable: boolean;           // 개인화 적용 가능 여부
    learningData: LearningData[]; // 학습용 데이터
  }
}
```

### Pinecone Vector Database
```typescript
// 개인 스타일 벡터
userStyleVectors: {
  id: userId,
  vector: number[1536],          // 스타일 임베딩
  metadata: {
    specialty: string,
    soapCount: number,
    lastUpdated: string,
    qualityScore: number
  }
}

// 템플릿 벡터
templateVectors: {
  id: templateId,
  vector: number[1536],          // 템플릿 구조 임베딩
  metadata: {
    hospital: string,
    specialty: string,
    complexity: number,
    styleFeatures: object
  }
}
```

---

## 🚀 개발 로드맵

### Phase 1: 기반 시스템 (3개월)
```
Month 1: 템플릿 시스템
- 5개 기본 템플릿 개발
- 병원별 템플릿 관리
- 템플릿 매칭 알고리즘

Month 2: 개인화 엔진  
- 스타일 분석 로직
- 패턴 추출 시스템
- 기본 학습 알고리즘

Month 3: 통합 및 테스트
- AI 생성 품질 향상
- 의료진 베타 테스트
- 성능 최적화
```

### Phase 2: 고도화 (3개월)
```
Month 4-5: 고급 개인화
- Fine-tuning 모델 구축
- 실시간 스타일 적응
- 품질 자동 평가

Month 6: 확장 기능
- 병원간 템플릿 공유
- 협업 기능
- 분석 대시보드
```

### Phase 3: 엔터프라이즈 (6개월+)
```
- EMR 시스템 연동
- 대용량 병원 지원
- 모바일 앱 개발
- 다국어 지원
```

---

## 📊 예상 성과

### 정량적 목표
- **시간 절약**: 기존 대비 80% 단축 (20분 → 4분)
- **정확도**: AI 생성 정확도 95% 이상
- **만족도**: 의료진 만족도 4.5/5.0 이상
- **학습률**: 개인 스타일 학습 완성도 90% (3개월 사용)

### 비즈니스 가치
- **의료진 생산성 향상**: 1일 30분 절약 × 연 250일 = 125시간/년
- **문서 품질 표준화**: 병원별 일관성 있는 SOAP 노트
- **개인화 서비스**: 각 의료진에 특화된 AI 어시스턴트
- **확장성**: 템플릿 축적을 통한 지속적 품질 향상

---

## 🔒 보안 및 규정

### 의료 데이터 보안
- **HIPAA 준수**: 환자 데이터 암호화 및 접근 제어
- **개인정보 보호**: 최소 데이터 수집 및 자동 삭제
- **감사 추적**: 모든 접근 및 수정 이력 기록

### 품질 보증
- **의료 가이드라인 준수**: 임상 가이드라인 자동 검증
- **오류 방지**: AI 생성 결과 품질 검증 시스템
- **의료진 검토**: 최종 승인은 항상 의료진이 수행

---

이 설계를 통해 **병원별 다양성을 수용하면서 개인화된 고품질 SOAP 노트 자동 생성**이 가능한 혁신적인 의료 AI 시스템을 구축할 수 있습니다! 🚀 