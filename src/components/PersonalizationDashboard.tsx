import React, { useState, useEffect } from 'react';
import { 
  getPersonalizationStatus, 
  generatePersonalizedTemplate, 
  getUserPatterns 
} from '../services/personalizationEngine';
import LoadingSpinner from './LoadingSpinner';
import '../styles/PersonalizationDashboard.css';

interface PersonalizationDashboardProps {
  specialty: string;
  onTemplateGenerated?: (template: any) => void;
}

const PersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({
  specialty,
  onTemplateGenerated
}) => {
  const [status, setStatus] = useState<{
    totalPatterns: number;
    categoryCounts: { [key: string]: number };
    isReady: boolean;
    lastUpdate: string;
    vectorDbStatus?: {
      available: boolean;
      totalVectors: number;
    };
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const categoryNames = {
    structure: '구조 패턴',
    terminology: '용어 사용',
    detail_level: '상세도',
    focus_area: '포커스 영역',
    sentence_style: '문장 스타일',
    format_preference: '형식 선호도'
  };

  useEffect(() => {
    loadPersonalizationStatus();
  }, []);

  const loadPersonalizationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusData = await getPersonalizationStatus();
      setStatus(statusData);
    } catch (err) {
      setError('개인화 상태를 불러오는 중 오류가 발생했습니다.');
      console.error('개인화 상태 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePersonalizedTemplate = async () => {
    if (!status?.isReady) {
      alert('개인화 템플릿 생성을 위해서는 더 많은 SOAP 노트 작성이 필요합니다.');
      return;
    }

    try {
      setGeneratingTemplate(true);
      setError(null);
      
      const personalizedTemplate = await generatePersonalizedTemplate(specialty);
      
      if (personalizedTemplate) {
        alert('개인 맞춤 템플릿이 성공적으로 생성되었습니다!');
        if (onTemplateGenerated) {
          onTemplateGenerated(personalizedTemplate);
        }
      } else {
        alert('아직 충분한 학습 데이터가 없습니다. 더 많은 SOAP 노트를 작성해보세요.');
      }
    } catch (err) {
      setError('개인화 템플릿 생성 중 오류가 발생했습니다.');
      console.error('개인화 템플릿 생성 실패:', err);
    } finally {
      setGeneratingTemplate(false);
    }
  };

  if (loading) {
    return (
      <div className="personalization-dashboard loading">
        <LoadingSpinner message="개인화 상태를 확인하고 있습니다..." />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="personalization-dashboard error">
        <p>개인화 정보를 불러올 수 없습니다.</p>
        <button onClick={loadPersonalizationStatus}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="personalization-dashboard">
      <div className="dashboard-header">
        <h3>🤖 AI 개인화 엔진</h3>
        <p>당신의 SOAP 노트 작성 패턴을 학습하여 맞춤형 템플릿을 제공합니다</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="status-overview">
        <div className="status-card">
          <div className="status-icon">📊</div>
          <div className="status-info">
            <h4>학습된 패턴</h4>
            <p className="status-number">{status.totalPatterns}개</p>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon">🎯</div>
          <div className="status-info">
            <h4>개인화 준비도</h4>
            <p className={`status-ready ${status.isReady ? 'ready' : 'not-ready'}`}>
              {status.isReady ? '준비 완료' : '학습 중'}
            </p>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon">🔍</div>
          <div className="status-info">
            <h4>Vector DB</h4>
            <p className={`status-ready ${status.vectorDbStatus?.available ? 'ready' : 'not-ready'}`}>
              {status.vectorDbStatus?.available 
                ? `활성화 (${status.vectorDbStatus.totalVectors}개)`
                : '비활성화'
              }
            </p>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon">🕒</div>
          <div className="status-info">
            <h4>마지막 업데이트</h4>
            <p className="status-time">
              {status.totalPatterns > 0 
                ? new Date(status.lastUpdate).toLocaleDateString()
                : '없음'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="pattern-breakdown">
        <h4>학습된 패턴 분석</h4>
        <div className="pattern-categories">
          {Object.entries(categoryNames).map(([key, name]) => (
            <div key={key} className="pattern-category">
              <div className="category-name">{name}</div>
              <div className="category-count">
                {status.categoryCounts[key] || 0}개
              </div>
              <div className="category-bar">
                <div 
                  className="category-progress" 
                  style={{ 
                    width: `${Math.min((status.categoryCounts[key] || 0) * 10, 100)}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-section">
        <button
          onClick={handleGeneratePersonalizedTemplate}
          disabled={!status.isReady || generatingTemplate}
          className={`generate-button ${status.isReady ? 'ready' : 'disabled'}`}
        >
          {generatingTemplate ? (
            <>
              <LoadingSpinner size="small" />
              개인 맞춤 템플릿 생성 중...
            </>
          ) : status.isReady ? (
            <>🎨 {specialty} 개인 맞춤 템플릿 생성</>
          ) : (
            <>⏳ 더 많은 SOAP 노트 작성 필요 (최소 5개)</>
          )}
        </button>

        {!status.isReady && (
          <div className="learning-tip">
            <h5>💡 개인화 팁</h5>
            <ul>
              <li>다양한 환자 케이스의 SOAP 노트를 작성해보세요</li>
              <li>일관된 스타일로 작성하면 더 정확한 학습이 가능합니다</li>
              <li>최소 5개 이상의 SOAP 노트가 있어야 개인화 템플릿을 생성할 수 있습니다</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizationDashboard; 