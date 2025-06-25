import React, { useState, useEffect } from 'react';
import { SUPPORTED_SPECIALTIES, SPECIALTY_DESCRIPTIONS } from '../services/defaultTemplates';
import { initializeDefaultTemplates, checkTemplateExists } from '../services/templateInitializer';
import LoadingSpinner from './LoadingSpinner';
import '../styles/SpecialtySelector.css';

interface SpecialtySelectorProps {
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  disabled?: boolean;
}

const SpecialtySelector: React.FC<SpecialtySelectorProps> = ({
  selectedSpecialty,
  onSpecialtyChange,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [templatesStatus, setTemplatesStatus] = useState<Record<string, boolean>>({});
  const [showInitializeButton, setShowInitializeButton] = useState(false);

  // 템플릿 존재 상태 확인
  useEffect(() => {
    const checkAllTemplates = async () => {
      const status: Record<string, boolean> = {};
      let missingCount = 0;

      for (const specialty of SUPPORTED_SPECIALTIES) {
        const exists = await checkTemplateExists(specialty);
        status[specialty] = exists;
        if (!exists) missingCount++;
      }

      setTemplatesStatus(status);
      setShowInitializeButton(missingCount > 0);
    };

    checkAllTemplates();
  }, []);

  // 기본 템플릿 초기화
  const handleInitializeTemplates = async () => {
    try {
      setLoading(true);
      console.log('기본 템플릿 초기화 시작...');
      
      await initializeDefaultTemplates();
      
      // 상태 업데이트 - 실제로 생성된 템플릿들 확인
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      
      const status: Record<string, boolean> = {};
      for (const specialty of SUPPORTED_SPECIALTIES) {
        const exists = await checkTemplateExists(specialty);
        status[specialty] = exists;
      }
      
      setTemplatesStatus(status);
      
      const createdCount = Object.values(status).filter(Boolean).length;
      if (createdCount > 0) {
        setShowInitializeButton(false);
        alert(`${createdCount}개의 기본 템플릿이 성공적으로 생성되었습니다!`);
      } else {
        alert('템플릿 생성에 실패했습니다. 로그인 상태를 확인해주세요.');
      }
    } catch (error: any) {
      console.error('템플릿 초기화 실패:', error);
      
      let errorMessage = '템플릿 초기화 중 오류가 발생했습니다.';
      if (error.message?.includes('로그인')) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
      } else if (error.message?.includes('permission')) {
        errorMessage = '권한이 없습니다. 로그인 상태를 확인해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="specialty-selector">
      <div className="specialty-header">
        <label htmlFor="specialty-select" className="specialty-label">
          전문과 선택
        </label>
        {showInitializeButton && (
          <button
            onClick={handleInitializeTemplates}
            disabled={loading}
            className="initialize-templates-btn"
            title="기본 템플릿 생성"
          >
            {loading ? <LoadingSpinner /> : '📋 기본 템플릿 생성'}
          </button>
        )}
      </div>

      <select
        id="specialty-select"
        value={selectedSpecialty}
        onChange={(e) => onSpecialtyChange(e.target.value)}
        disabled={disabled || loading}
        className="specialty-select"
      >
        <option value="">전문과를 선택해주세요</option>
        {SUPPORTED_SPECIALTIES.map((specialty) => (
          <option key={specialty} value={specialty}>
            {specialty} {!templatesStatus[specialty] && '(템플릿 없음)'}
          </option>
        ))}
      </select>

      {selectedSpecialty && SPECIALTY_DESCRIPTIONS[selectedSpecialty as keyof typeof SPECIALTY_DESCRIPTIONS] && (
        <div className="specialty-description">
          <h4>{selectedSpecialty} 템플릿</h4>
          <p>{SPECIALTY_DESCRIPTIONS[selectedSpecialty as keyof typeof SPECIALTY_DESCRIPTIONS]}</p>
          <div className="template-status">
            {templatesStatus[selectedSpecialty] ? (
              <span className="status-available">✅ 템플릿 사용 가능</span>
            ) : (
              <span className="status-missing">⚠️ 기본 템플릿 생성 필요</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtySelector; 