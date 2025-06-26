import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomePage.css';

// 의료 전문 분야 전체 목록 (의료진이 직접 선택)
const medicalSpecialties = [
  // 내과계
  { id: 'internal-medicine', name: '내과', description: '내과 질환 진료 및 관리', icon: '🔬', color: '#e74c3c', category: '내과계' },
  { id: 'cardiology', name: '심장내과', description: '심혈관계 질환', icon: '❤️', color: '#e91e63', category: '내과계' },
  { id: 'endocrinology', name: '내분비내과', description: '당뇨병, 갑상선 질환', icon: '🧬', color: '#9c27b0', category: '내과계' },
  { id: 'gastroenterology', name: '소화기내과', description: '위장관, 간담췌 질환', icon: '🫄', color: '#673ab7', category: '내과계' },
  { id: 'nephrology', name: '신장내과', description: '신장 질환', icon: '🫘', color: '#3f51b5', category: '내과계' },
  { id: 'hematology', name: '혈액내과', description: '혈액 질환, 종양학', icon: '🩸', color: '#2196f3', category: '내과계' },
  { id: 'rheumatology', name: '류마티스내과', description: '관절염, 면역질환', icon: '🦴', color: '#03a9f4', category: '내과계' },
  { id: 'respiratory', name: '호흡기내과', description: '폐질환, 천식', icon: '🫁', color: '#00bcd4', category: '내과계' },
  
  // 외과계
  { id: 'general-surgery', name: '외과', description: '일반외과 수술', icon: '🔪', color: '#009688', category: '외과계' },
  { id: 'orthopedics', name: '정형외과', description: '골절, 관절, 척추', icon: '🦴', color: '#4caf50', category: '외과계' },
  { id: 'neurosurgery', name: '신경외과', description: '뇌, 척수 수술', icon: '🧠', color: '#8bc34a', category: '외과계' },
  { id: 'plastic-surgery', name: '성형외과', description: '재건, 미용수술', icon: '✨', color: '#cddc39', category: '외과계' },
  { id: 'urology', name: '비뇨기과', description: '비뇨생식기 질환', icon: '🔬', color: '#ffeb3b', category: '외과계' },
  { id: 'thoracic-surgery', name: '흉부외과', description: '심장, 폐 수술', icon: '🫀', color: '#ffc107', category: '외과계' },
  
  // 소아과
  { id: 'pediatrics', name: '소아과', description: '소아청소년 질환', icon: '🧒', color: '#ff9800', category: '소아과' },
  { id: 'pediatric-surgery', name: '소아외과', description: '소아 수술', icon: '👶', color: '#ff5722', category: '소아과' },
  
  // 산부인과
  { id: 'obstetrics', name: '산부인과', description: '임신, 출산, 부인과 질환', icon: '🤱', color: '#795548', category: '산부인과' },
  
  // 정신과
  { id: 'psychiatry', name: '정신건강의학과', description: '정신질환, 심리치료', icon: '🧠', color: '#607d8b', category: '정신과' },
  
  // 영상의학과
  { id: 'radiology', name: '영상의학과', description: 'CT, MRI, 초음파', icon: '📸', color: '#9e9e9e', category: '영상의학과' },
  
  // 병리과
  { id: 'pathology', name: '병리과', description: '조직검사, 진단', icon: '🔬', color: '#607d8b', category: '병리과' },
  
  // 응급의학과
  { id: 'emergency', name: '응급의학과', description: '응급환자 진료', icon: '🚨', color: '#f44336', category: '응급의학과' },
  
  // 가정의학과
  { id: 'family-medicine', name: '가정의학과', description: '종합적 일차 진료', icon: '👨‍⚕️', color: '#4caf50', category: '가정의학과' },
  
  // 재활의학과
  { id: 'rehabilitation', name: '재활의학과', description: '재활 및 기능회복', icon: '♿', color: '#ff9800', category: '재활의학과' },
  
  // 치료사
  { id: 'physical-therapy', name: '물리치료', description: '근골격계 재활치료', icon: '🏃‍♂️', color: '#2196f3', category: '치료사' },
  { id: 'occupational-therapy', name: '작업치료', description: '일상생활 기능회복', icon: '🖐️', color: '#00bcd4', category: '치료사' },
  
  // 간호
  { id: 'nursing', name: '간호', description: '환자 케어 및 간호기록', icon: '👩‍⚕️', color: '#e91e63', category: '간호' },
  { id: 'icu-nursing', name: 'ICU간호', description: '중환자실 간호', icon: '🏥', color: '#9c27b0', category: '간호' },
  
  // 기타
  { id: 'anesthesiology', name: '마취통증의학과', description: '마취, 통증관리', icon: '💉', color: '#795548', category: '기타' },
  { id: 'dermatology', name: '피부과', description: '피부질환', icon: '🧴', color: '#ff5722', category: '기타' },
  { id: 'ophthalmology', name: '안과', description: '눈 질환', icon: '👁️', color: '#3f51b5', category: '기타' },
  { id: 'otolaryngology', name: '이비인후과', description: '귀코목 질환', icon: '👂', color: '#009688', category: '기타' },
  { id: 'dentistry', name: '치과', description: '구강 및 치과질환', icon: '🦷', color: '#cddc39', category: '기타' }
];

// 최근 사용한 설정 저장/불러오기
const getRecentSettings = () => {
  try {
    const saved = localStorage.getItem('soap-ai-recent-settings');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveRecentSettings = (specialty: string) => {
  try {
    localStorage.setItem('soap-ai-recent-settings', JSON.stringify({
      specialty,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage 실패는 무시
  }
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recentSpecialty, setRecentSpecialty] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  useEffect(() => {
    // 최근 사용한 전문과 불러오기
    const recent = getRecentSettings();
    if (recent && recent.specialty) {
      setRecentSpecialty(recent.specialty);
    }
  }, []);

  // 전문과 선택 및 노트 작성 시작
  const handleSpecialtySelect = (specialty: any, method: 'text' | 'voice') => {
    // 최근 사용 설정 저장
    saveRecentSettings(specialty.name);
    
    const params = new URLSearchParams({
      specialty: specialty.name,
      method: method
    });

    navigate(`/unified-soap-note?${params.toString()}`);
  };

  // 드롭다운에서 전문과 선택
  const handleDropdownSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(event.target.value);
  };

  // 선택된 전문과로 노트 작성 시작
  const handleStartWithSelected = (method: 'text' | 'voice') => {
    if (!selectedSpecialty) {
      alert('전문과를 먼저 선택해주세요.');
      return;
    }
    
    const specialty = medicalSpecialties.find(s => s.name === selectedSpecialty);
    if (specialty) {
      handleSpecialtySelect(specialty, method);
    }
  };

  // 빠른 시작 (최근 사용한 전문과로)
  const handleQuickStart = (method: 'text' | 'voice') => {
    if (recentSpecialty) {
      const specialty = medicalSpecialties.find(s => s.name === recentSpecialty);
      if (specialty) {
        handleSpecialtySelect(specialty, method);
      }
    }
  };

  // 선택된 전문과 정보 가져오기
  const selectedSpecialtyInfo = medicalSpecialties.find(s => s.name === selectedSpecialty);

  return (
    <div className="home-page">
      {/* 헤더 섹션 */}
      <div className="home-header">
        <h1>AI 기반 SOAP 노트</h1>
        <p>
          {currentUser ? `안녕하세요, ${currentUser.email?.split('@')[0]}님!` : '의료 전문가를 위한 스마트 기록 시스템'}
        </p>
      </div>

      {/* 빠른 시작 섹션 (최근 사용) */}
      {recentSpecialty && (
        <div className="quick-start-section">
          <h2>빠른 시작</h2>
          <div className="quick-start-card">
            <div className="quick-start-info">
              <span className="quick-start-icon">⚡</span>
              <div>
                <h3>최근 사용: {recentSpecialty}</h3>
                <p>바로 SOAP 노트 작성을 시작하세요</p>
              </div>
            </div>
            <div className="quick-start-actions">
              <button 
                className="quick-action-btn text-btn"
                onClick={() => handleQuickStart('text')}
              >
                ✏️ 텍스트
              </button>
              <button 
                className="quick-action-btn voice-btn"
                onClick={() => handleQuickStart('voice')}
              >
                🎙️ 음성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전문과 선택 섹션 */}
      <div className="specialties-section">
        <div className="section-header">
          <h2>전문과 선택</h2>
        </div>
        
        <div className="specialty-selector">
          <div className="dropdown-container">
            <label htmlFor="specialty-select" className="dropdown-label">
              전문과를 선택하세요
            </label>
            <select 
              id="specialty-select"
              className="specialty-dropdown"
              value={selectedSpecialty}
              onChange={handleDropdownSelect}
            >
              <option value="">-- 귀하의 전문과를 선택하세요 --</option>
              
              {/* 카테고리별로 그룹화 */}
              {['내과계', '외과계', '소아과', '산부인과', '정신과', '영상의학과', '병리과', '응급의학과', '가정의학과', '재활의학과', '치료사', '간호', '기타'].map(category => {
                const categorySpecialties = medicalSpecialties.filter(s => s.category === category);
                return categorySpecialties.length > 0 ? (
                  <optgroup key={category} label={`${category} (${categorySpecialties.length}개)`}>
                    {categorySpecialties.map(specialty => (
                      <option key={specialty.id} value={specialty.name}>
                        {specialty.icon} {specialty.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          
          {selectedSpecialtyInfo && (
            <div className="selected-specialty-info">
              <div className="specialty-preview">
                <div 
                  className="specialty-icon" 
                  style={{ color: selectedSpecialtyInfo.color }}
                >
                  {selectedSpecialtyInfo.icon}
                </div>
                <div className="specialty-details">
                  <h3>{selectedSpecialtyInfo.name}</h3>
                  <p>{selectedSpecialtyInfo.description}</p>
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  className="action-button text-button"
                  onClick={() => handleStartWithSelected('text')}
                >
                  <span className="button-icon">✏️</span>
                  텍스트로 작성
                </button>
                <button
                  className="action-button audio-button"
                  onClick={() => handleStartWithSelected('voice')}
                >
                  <span className="button-icon">🎙️</span>
                  음성으로 작성
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 추가 기능 섹션 */}
      <div className="additional-features">
        <div className="feature-cards">
          <div className="feature-card" onClick={() => navigate('/all-notes')}>
            <span className="feature-icon">📚</span>
            <h3>내 노트 보기</h3>
            <p>저장된 SOAP 노트 관리</p>
          </div>
          
          <div className="feature-card" onClick={() => navigate('/patients')}>
            <span className="feature-icon">👥</span>
            <h3>환자 관리</h3>
            <p>환자 정보 및 기록 관리</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 