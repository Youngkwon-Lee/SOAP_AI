import { db, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { Template, TemplateFormData, SoapNote } from '../types';
import { createTemplate, getTemplates } from './templateService';
import { 
  storeUserStyleVector, 
  findSimilarPatterns, 
  isVectorDatabaseAvailable,
  storeTemplateVector 
} from './vectorDatabase';

// 개인화 패턴 카테고리 (유튜브 스크립트 아이디어 적용)
export interface PersonalizationPattern {
  id: string;
  userId: string;
  category: 'structure' | 'terminology' | 'detail_level' | 'focus_area' | 'sentence_style' | 'format_preference';
  pattern: string;
  examples: string[];
  weight: number; // 0-1 사이, 패턴의 중요도
  lastUsed: string;
  frequency: number; // 사용 빈도
  createdAt: string;
  updatedAt: string;
}

// 학습 데이터 인터페이스
export interface LearningData {
  soapNote: SoapNote;
  templateUsed?: string;
  specialty: string;
  timestamp: string;
}

const PATTERNS_COLLECTION = 'personalizationPatterns';
const LEARNING_DATA_COLLECTION = 'learningData';
const MAX_PATTERNS_PER_CATEGORY = 10; // 카테고리당 최대 패턴 수

/**
 * 사용자의 SOAP 노트 작성 패턴을 분석하고 저장 (Vector DB 통합)
 */
export const analyzeAndStorePattern = async (soapNote: SoapNote, specialty: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('로그인이 필요합니다.');

    // 1. 학습 데이터 저장
    await storeLearningData({
      soapNote,
      specialty,
      timestamp: new Date().toISOString()
    });

    // 2. 패턴 분석 및 저장
    const patterns = extractPatterns(soapNote, specialty);
    
    for (const pattern of patterns) {
      await updateOrCreatePattern(currentUser.uid, pattern);
      
      // 3. Vector DB에도 저장 (사용 가능한 경우)
      if (isVectorDatabaseAvailable() && pattern.pattern) {
        try {
          await storeUserStyleVector(
            currentUser.uid,
            pattern.category!,
            pattern.pattern,
            pattern.weight || 0.5
          );
        } catch (vectorError) {
          console.warn('⚠️ Vector DB 저장 실패 (계속 진행):', vectorError);
        }
      }
    }

    console.log('✅ 패턴 분석 및 저장 완료 (Vector DB 포함)');
  } catch (error) {
    console.error('패턴 분석 실패:', error);
    throw error;
  }
};

/**
 * SOAP 노트에서 개인화 패턴 추출
 */
const extractPatterns = (soapNote: SoapNote, specialty: string): Partial<PersonalizationPattern>[] => {
  const patterns: Partial<PersonalizationPattern>[] = [];

  // 1. 구조 패턴 분석
  const structurePattern = analyzeStructure(soapNote);
  if (structurePattern) {
    patterns.push({
      category: 'structure',
      pattern: structurePattern,
      examples: [JSON.stringify(soapNote)],
      weight: 0.8
    });
  }

  // 2. 용어 사용 패턴 분석
  const terminologyPattern = analyzeTerminology(soapNote, specialty);
  if (terminologyPattern) {
    patterns.push({
      category: 'terminology',
      pattern: terminologyPattern,
      examples: [soapNote.subjective, soapNote.objective, soapNote.assessment, soapNote.plan],
      weight: 0.7
    });
  }

  // 3. 상세도 레벨 분석
  const detailLevel = analyzeDetailLevel(soapNote);
  patterns.push({
    category: 'detail_level',
    pattern: detailLevel,
    examples: [soapNote.objective],
    weight: 0.6
  });

  // 4. 포커스 영역 분석
  const focusArea = analyzeFocusArea(soapNote, specialty);
  if (focusArea) {
    patterns.push({
      category: 'focus_area',
      pattern: focusArea,
      examples: [soapNote.assessment, soapNote.plan],
      weight: 0.9
    });
  }

  // 5. 문장 스타일 분석
  const sentenceStyle = analyzeSentenceStyle(soapNote);
  patterns.push({
    category: 'sentence_style',
    pattern: sentenceStyle,
    examples: [soapNote.subjective],
    weight: 0.5
  });

  // 6. 형식 선호도 분석
  const formatPreference = analyzeFormatPreference(soapNote);
  patterns.push({
    category: 'format_preference',
    pattern: formatPreference,
    examples: [JSON.stringify(soapNote)],
    weight: 0.4
  });

  return patterns;
};

/**
 * 구조 패턴 분석
 */
const analyzeStructure = (soapNote: SoapNote): string => {
  const lengths = {
    subjective: soapNote.subjective.length,
    objective: soapNote.objective.length,
    assessment: soapNote.assessment.length,
    plan: soapNote.plan.length
  };

  const total = Object.values(lengths).reduce((sum, len) => sum + len, 0);
  const ratios = Object.entries(lengths).map(([section, length]) => 
    `${section}:${Math.round((length / total) * 100)}%`
  ).join(',');

  return `section_balance:${ratios}`;
};

/**
 * 용어 사용 패턴 분석
 */
const analyzeTerminology = (soapNote: SoapNote, specialty: string): string => {
  const allText = `${soapNote.subjective} ${soapNote.objective} ${soapNote.assessment} ${soapNote.plan}`;
  
  // 전문 용어 빈도 분석
  const medicalTerms = extractMedicalTerms(allText);
  const commonTerms = medicalTerms.slice(0, 5); // 상위 5개 용어
  
  return `specialty:${specialty},terms:${commonTerms.join(',')}`;
};

/**
 * 상세도 레벨 분석
 */
const analyzeDetailLevel = (soapNote: SoapNote): string => {
  const objectiveText = soapNote.objective;
  const hasVitalSigns = /혈압|맥박|체온|호흡|산소포화도/i.test(objectiveText);
  const hasSpecificNumbers = /\d+(\.\d+)?/g.test(objectiveText);
  const hasDetailedExam = objectiveText.length > 200;

  if (hasVitalSigns && hasSpecificNumbers && hasDetailedExam) {
    return 'very_detailed';
  } else if (hasVitalSigns || hasSpecificNumbers) {
    return 'moderate';
  } else {
    return 'brief';
  }
};

/**
 * 포커스 영역 분석
 */
const analyzeFocusArea = (soapNote: SoapNote, specialty: string): string => {
  const assessmentText = soapNote.assessment.toLowerCase();
  const planText = soapNote.plan.toLowerCase();
  
  let focusAreas: string[] = [];
  
  // 전문과별 포커스 영역
  if (specialty === '내과') {
    if (assessmentText.includes('약물') || planText.includes('처방')) focusAreas.push('medication');
    if (assessmentText.includes('생활습관') || planText.includes('교육')) focusAreas.push('lifestyle');
    if (assessmentText.includes('추적') || planText.includes('관찰')) focusAreas.push('monitoring');
  } else if (specialty === '외과') {
    if (planText.includes('수술')) focusAreas.push('surgery');
    if (planText.includes('재활')) focusAreas.push('rehabilitation');
    if (assessmentText.includes('위험')) focusAreas.push('risk_assessment');
  }
  
  return focusAreas.length > 0 ? focusAreas.join(',') : 'general';
};

/**
 * 문장 스타일 분석
 */
const analyzeSentenceStyle = (soapNote: SoapNote): string => {
  const subjectiveText = soapNote.subjective;
  const sentences = subjectiveText.split(/[.!?]/).filter(s => s.trim().length > 0);
  
  const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  const usesLists = /[-•*]\s/.test(subjectiveText);
  const usesColons = /:/.test(subjectiveText);
  
  let style = '';
  if (avgLength > 50) style += 'long_sentences,';
  if (avgLength < 20) style += 'short_sentences,';
  if (usesLists) style += 'bullet_points,';
  if (usesColons) style += 'structured_format,';
  
  return style.slice(0, -1) || 'natural';
};

/**
 * 형식 선호도 분석
 */
const analyzeFormatPreference = (soapNote: SoapNote): string => {
  const allText = JSON.stringify(soapNote);
  
  let preferences: string[] = [];
  if (/\*\*/.test(allText)) preferences.push('bold_headers');
  if (/\n\s*-/.test(allText)) preferences.push('bullet_lists');
  if (/\d+\./.test(allText)) preferences.push('numbered_lists');
  if (/•/.test(allText)) preferences.push('unicode_bullets');
  
  return preferences.length > 0 ? preferences.join(',') : 'simple';
};

/**
 * 의료 용어 추출
 */
const extractMedicalTerms = (text: string): string[] => {
  const medicalTermRegex = /[가-힣]{2,}(증|병|염|경색|부전|고혈압|당뇨병|관절염)/g;
  const matches = text.match(medicalTermRegex) || [];
  
  // 빈도 계산
  const termCounts: { [key: string]: number } = {};
  matches.forEach(term => {
    termCounts[term] = (termCounts[term] || 0) + 1;
  });
  
  // 빈도순 정렬
  return Object.entries(termCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([term]) => term);
};

/**
 * 패턴 업데이트 또는 생성
 */
const updateOrCreatePattern = async (userId: string, patternData: Partial<PersonalizationPattern>): Promise<void> => {
  try {
    // 기존 패턴 검색
    const q = query(
      collection(db, PATTERNS_COLLECTION),
      where('userId', '==', userId),
      where('category', '==', patternData.category),
      where('pattern', '==', patternData.pattern)
    );
    
    const existingPatterns = await getDocs(q);
    
    if (!existingPatterns.empty) {
      // 기존 패턴 업데이트
      const existingPattern = existingPatterns.docs[0];
      const data = existingPattern.data() as PersonalizationPattern;
      
      await updateDoc(existingPattern.ref, {
        frequency: data.frequency + 1,
        weight: Math.min(data.weight + 0.1, 1.0), // 최대 1.0
        lastUsed: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        examples: [...new Set([...data.examples, ...(patternData.examples || [])])].slice(0, 5) // 최대 5개 예시
      });
    } else {
      // 새 패턴 생성
      const newPattern: Omit<PersonalizationPattern, 'id'> = {
        userId,
        category: patternData.category!,
        pattern: patternData.pattern!,
        examples: patternData.examples || [],
        weight: patternData.weight || 0.5,
        lastUsed: new Date().toISOString(),
        frequency: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, PATTERNS_COLLECTION), newPattern);
      
      // 카테고리당 패턴 수 제한
      await limitPatternsPerCategory(userId, patternData.category!);
    }
  } catch (error) {
    console.error('패턴 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 카테고리당 패턴 수 제한
 */
const limitPatternsPerCategory = async (userId: string, category: string): Promise<void> => {
  const q = query(
    collection(db, PATTERNS_COLLECTION),
    where('userId', '==', userId),
    where('category', '==', category),
    orderBy('weight', 'desc'),
    orderBy('frequency', 'desc')
  );
  
  const patterns = await getDocs(q);
  
  if (patterns.size > MAX_PATTERNS_PER_CATEGORY) {
    // 가장 낮은 가중치의 패턴들 삭제
    const toDelete = patterns.docs.slice(MAX_PATTERNS_PER_CATEGORY);
    for (const doc of toDelete) {
      await deleteDoc(doc.ref);
    }
  }
};

/**
 * 학습 데이터 저장
 */
const storeLearningData = async (data: LearningData): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인이 필요합니다.');
  
  await addDoc(collection(db, LEARNING_DATA_COLLECTION), {
    ...data,
    userId: currentUser.uid,
    createdAt: new Date().toISOString()
  });
};

/**
 * 사용자 개인화 패턴 조회
 */
export const getUserPatterns = async (category?: string): Promise<PersonalizationPattern[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('로그인이 필요합니다.');
    
    let q = query(
      collection(db, PATTERNS_COLLECTION),
      where('userId', '==', currentUser.uid),
      orderBy('weight', 'desc')
    );
    
    if (category) {
      q = query(
        collection(db, PATTERNS_COLLECTION),
        where('userId', '==', currentUser.uid),
        where('category', '==', category),
        orderBy('weight', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersonalizationPattern));
  } catch (error) {
    console.error('패턴 조회 실패:', error);
    throw error;
  }
};

/**
 * 개인화된 템플릿 생성
 */
export const generatePersonalizedTemplate = async (specialty: string): Promise<Template | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('로그인이 필요합니다.');
    
    // 사용자 패턴 조회
    const patterns = await getUserPatterns();
    
    if (patterns.length < 5) {
      console.log('충분한 패턴이 없어 개인화 템플릿 생성을 건너뜁니다.');
      return null;
    }
    
    // 전문과별 기본 템플릿 조회
    const baseTemplates = await getTemplates('doctor', specialty);
    const systemTemplate = baseTemplates.find(t => t.isSystemTemplate);
    
    if (!systemTemplate) {
      throw new Error('기본 템플릿을 찾을 수 없습니다.');
    }
    
    // 패턴을 적용하여 개인화된 템플릿 생성
    const personalizedFormat = applyPatternsToTemplate(systemTemplate.format, patterns);
    
    const personalizedTemplate: TemplateFormData = {
      name: `${specialty} 개인 맞춤 템플릿`,
      profession: 'doctor',
      specialty,
      format: personalizedFormat,
      example: generatePersonalizedExample(systemTemplate.example, patterns)
    };
    
    // 개인 템플릿 저장
    const createdTemplate = await createTemplate(personalizedTemplate, false);
    console.log('✅ 개인화된 템플릿 생성 완료');
    
    return createdTemplate;
  } catch (error) {
    console.error('개인화 템플릿 생성 실패:', error);
    throw error;
  }
};

/**
 * 패턴을 템플릿에 적용
 */
const applyPatternsToTemplate = (baseFormat: string, patterns: PersonalizationPattern[]): string => {
  let modifiedFormat = baseFormat;
  
  patterns.forEach(pattern => {
    switch (pattern.category) {
      case 'format_preference':
        if (pattern.pattern.includes('bullet_lists')) {
          modifiedFormat = modifiedFormat.replace(/- /g, '• ');
        }
        break;
      case 'detail_level':
        if (pattern.pattern === 'very_detailed') {
          modifiedFormat = modifiedFormat.replace(
            '활력 징후(Vital Signs):',
            '활력 징후(Vital Signs) - 상세 기록 권장:\n  • 혈압(BP): \n  • 맥박(HR): \n  • 호흡수(RR): \n  • 체온(BT): \n  • 산소포화도(SpO2): \n  • 통증 점수: '
          );
        }
        break;
      case 'sentence_style':
        if (pattern.pattern.includes('structured_format')) {
          // 구조화된 형식 적용
          modifiedFormat = modifiedFormat.replace(/: $/gm, ': \n  - ');
        }
        break;
    }
  });
  
  return modifiedFormat;
};

/**
 * 개인화된 예시 생성
 */
const generatePersonalizedExample = (baseExample: string, patterns: PersonalizationPattern[]): string => {
  let modifiedExample = baseExample;
  
  // 용어 사용 패턴 적용
  const terminologyPattern = patterns.find(p => p.category === 'terminology');
  if (terminologyPattern && terminologyPattern.pattern.includes('terms:')) {
    const terms = terminologyPattern.pattern.split('terms:')[1].split(',');
    // 예시에 선호하는 용어들 반영 (간단한 구현)
    terms.forEach(term => {
      if (term && modifiedExample.includes('진단')) {
        modifiedExample = modifiedExample.replace('진단', `${term} 관련 진단`);
        return;
      }
    });
  }
  
  return modifiedExample;
};

/**
 * 개인화 상태 확인 (Vector DB 정보 포함)
 */
export const getPersonalizationStatus = async (): Promise<{
  totalPatterns: number;
  categoryCounts: { [key: string]: number };
  isReady: boolean;
  lastUpdate: string;
  vectorDbStatus: {
    available: boolean;
    totalVectors: number;
  };
}> => {
  try {
    const patterns = await getUserPatterns();
    
    const categoryCounts: { [key: string]: number } = {};
    patterns.forEach(pattern => {
      categoryCounts[pattern.category] = (categoryCounts[pattern.category] || 0) + 1;
    });
    
    const isReady = patterns.length >= 5 && Object.keys(categoryCounts).length >= 3;
    const lastUpdate = patterns.length > 0 ? 
      Math.max(...patterns.map(p => new Date(p.updatedAt).getTime())) : 0;
    
    // Vector DB 상태 확인
    let vectorDbStatus = {
      available: false,
      totalVectors: 0
    };
    
    if (isVectorDatabaseAvailable()) {
      try {
        const { getVectorDatabaseStats } = await import('./vectorDatabase');
        const stats = await getVectorDatabaseStats();
        vectorDbStatus = {
          available: stats.indexReady,
          totalVectors: stats.totalVectors
        };
      } catch (vectorError) {
        console.warn('⚠️ Vector DB 상태 확인 실패:', vectorError);
      }
    }
    
    return {
      totalPatterns: patterns.length,
      categoryCounts,
      isReady,
      lastUpdate: new Date(lastUpdate).toISOString(),
      vectorDbStatus
    };
  } catch (error) {
    console.error('개인화 상태 확인 실패:', error);
    return {
      totalPatterns: 0,
      categoryCounts: {},
      isReady: false,
      lastUpdate: new Date().toISOString(),
      vectorDbStatus: {
        available: false,
        totalVectors: 0
      }
    };
  }
};

export default {
  analyzeAndStorePattern,
  getUserPatterns,
  generatePersonalizedTemplate,
  getPersonalizationStatus
}; 