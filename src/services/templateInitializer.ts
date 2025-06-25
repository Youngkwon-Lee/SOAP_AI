import { DEFAULT_TEMPLATES } from './defaultTemplates';
import { createTemplate, getTemplates } from './templateService';
import { TemplateFormData } from '../types';

/**
 * 기본 템플릿들이 데이터베이스에 존재하는지 확인하고, 없으면 생성하는 함수
 */
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    console.log('기본 템플릿 초기화 시작...');
    
    // 기존 템플릿 조회
    const existingTemplates = await getTemplates();
    const existingSpecialties = new Set(existingTemplates.map(t => t.specialty));
    
    // 생성할 템플릿들 필터링 (이미 존재하지 않는 것들만)
    const templatesToCreate = DEFAULT_TEMPLATES.filter(
      template => !existingSpecialties.has(template.specialty)
    );
    
    if (templatesToCreate.length === 0) {
      console.log('모든 기본 템플릿이 이미 존재합니다.');
      return;
    }
    
    console.log(`${templatesToCreate.length}개의 기본 템플릿을 생성합니다...`);
    
    // 템플릿들을 순차적으로 생성 (시스템 템플릿으로)
    const creationPromises = templatesToCreate.map(async (templateData) => {
      try {
        await createTemplate(templateData, true); // isSystem = true
        console.log(`✅ ${templateData.specialty} 템플릿 생성 완료`);
      } catch (error) {
        console.error(`❌ ${templateData.specialty} 템플릿 생성 실패:`, error);
        throw error;
      }
    });
    
    await Promise.all(creationPromises);
    console.log('🎉 모든 기본 템플릿 초기화 완료!');
    
  } catch (error) {
    console.error('기본 템플릿 초기화 중 오류:', error);
    throw error;
  }
};

/**
 * 특정 전문과의 기본 템플릿이 존재하는지 확인
 */
export const checkTemplateExists = async (specialty: string): Promise<boolean> => {
  try {
    const templates = await getTemplates();
    return templates.some(template => template.specialty === specialty);
  } catch (error) {
    console.error('템플릿 존재 확인 중 오류:', error);
    return false;
  }
};

/**
 * 특정 전문과의 기본 템플릿을 강제로 재생성
 */
export const recreateTemplateForSpecialty = async (specialty: string): Promise<void> => {
  try {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.specialty === specialty);
    if (!defaultTemplate) {
      throw new Error(`${specialty}에 대한 기본 템플릿을 찾을 수 없습니다.`);
    }
    
    await createTemplate(defaultTemplate, true); // isSystem = true
    console.log(`✅ ${specialty} 기본 템플릿 재생성 완료`);
  } catch (error) {
    console.error(`${specialty} 템플릿 재생성 실패:`, error);
    throw error;
  }
};

/**
 * 사용자가 처음 로그인할 때 기본 템플릿 초기화 (선택적)
 */
export const initializeTemplatesForNewUser = async (): Promise<void> => {
  try {
    // 사용자별로 개인 템플릿을 생성하지 않고, 공통 템플릿만 확인
    await initializeDefaultTemplates();
  } catch (error) {
    console.error('신규 사용자 템플릿 초기화 실패:', error);
    // 오류가 발생해도 로그인 과정을 방해하지 않도록 에러를 던지지 않음
  }
};

export default {
  initializeDefaultTemplates,
  checkTemplateExists,
  recreateTemplateForSpecialty,
  initializeTemplatesForNewUser
}; 