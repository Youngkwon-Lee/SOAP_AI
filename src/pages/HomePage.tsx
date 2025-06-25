import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import { SUPPORTED_SPECIALTIES } from '../services/defaultTemplates';

interface Specialty {
  id: string;
  name: string;
}

interface Profession {
  id: string;
  name: string;
  specialties: Specialty[];
}

const professions: Profession[] = [
  {
    id: 'doctor',
    name: '의사',
    specialties: [
      // 기본 템플릿이 있는 전문과들 (우선 표시)
      { id: 'internal', name: '내과' },
      { id: 'surgery', name: '외과' },
      { id: 'family', name: '가정의학과' },
      { id: 'emergency', name: '응급의학과' },
      { id: 'orthopedics', name: '정형외과' },
      // 기타 전문과들
      { id: 'cardiology', name: '순환기내과' },
      { id: 'gastroenterology', name: '소화기내과' },
      { id: 'endocrinology', name: '내분비내과' },
      { id: 'neurology', name: '신경과' },
      { id: 'rehabilitation', name: '재활의학과' },
      { id: 'psychiatry', name: '정신건강의학과' },
      { id: 'pediatrics', name: '소아과' },
      { id: 'dermatology', name: '피부과' },
      { id: 'ophthalmology', name: '안과' },
      { id: 'otolaryngology', name: '이비인후과' },
      { id: 'obgyn', name: '산부인과' },
      { id: 'urology', name: '비뇨기과' }
    ]
  },
  {
    id: 'therapist',
    name: '치료사',
    specialties: [
      { id: 'physical', name: '물리치료' },
      { id: 'occupational', name: '작업치료' },
      { id: 'speech', name: '언어치료' }
    ]
  },
  {
    id: 'nurse',
    name: '간호사',
    specialties: [
      { id: 'rehabilitation', name: '재활간호' },
      { id: 'psychiatric', name: '정신간호' },
      { id: 'home', name: '방문간호' },
      { id: 'general', name: '일반간호' },
      { id: 'emergency', name: '응급간호' },
      { id: 'pediatric', name: '소아간호' },
      { id: 'geriatric', name: '노인간호' },
      { id: 'intensive', name: '중환자간호' },
      { id: 'oncology', name: '종양간호' },
      { id: 'hospice', name: '호스피스간호' }
    ]
  },
  {
    id: 'trainer',
    name: '운동전문가',
    specialties: [
      { id: 'personal', name: '개인트레이너' },
      { id: 'sports', name: '스포츠코치' },
      { id: 'rehabilitation', name: '재활운동전문가' },
      { id: 'pilates', name: '필라테스강사' },
      { id: 'yoga', name: '요가강사' },
      { id: 'athletic', name: '선수트레이너' }
    ]
  }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProfession, setSelectedProfession] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const handleProfessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProfession(e.target.value);
    setSelectedSpecialty(''); // 직업이 변경되면 세부전공 초기화
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(e.target.value);
  };

  const handleMethodSelect = (method: 'text' | 'voice') => {
    if (selectedProfession && selectedSpecialty) {
      const profession = professions.find(p => p.id === selectedProfession);
      const specialty = profession?.specialties.find(s => s.id === selectedSpecialty);
      
      const params = new URLSearchParams({
        profession: profession?.name || '',
        specialty: specialty?.name || '',
        method: method
      });

      navigate(`/soap-note?${params.toString()}`);
    }
  };

  // 기본 템플릿이 있는 전문과인지 확인
  const hasTemplate = (specialtyName: string) => {
    return SUPPORTED_SPECIALTIES.includes(specialtyName);
  };

  const selectedProfessionData = professions.find(p => p.id === selectedProfession);

  return (
    <div className="home-container">
      <h1>SOAP 노트 작성</h1>
      <div className="selection-container">
        <div className="dropdown-sections">
          <div className="dropdown-section">
            <label htmlFor="profession">직업 선택</label>
            <select
              id="profession"
              value={selectedProfession}
              onChange={handleProfessionChange}
              className="dropdown"
            >
              <option value="">직업을 선택하세요</option>
              {professions.map(profession => (
                <option key={profession.id} value={profession.id}>
                  {profession.name}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown-section">
            <label htmlFor="specialty">세부전공 선택</label>
            <select
              id="specialty"
              value={selectedSpecialty}
              onChange={handleSpecialtyChange}
              className="dropdown"
              disabled={!selectedProfession}
            >
              <option value="">세부전공을 선택하세요</option>
              {selectedProfessionData?.specialties.map(specialty => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name} {hasTemplate(specialty.name) ? '📋' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSpecialty && (
          <div className="selected-info">
            <h3>선택한 전문과</h3>
            <p>
              {selectedProfessionData?.specialties.find(s => s.id === selectedSpecialty)?.name}
              {hasTemplate(selectedProfessionData?.specialties.find(s => s.id === selectedSpecialty)?.name || '') && (
                <span className="template-badge">📋 기본 템플릿 사용 가능</span>
              )}
            </p>
          </div>
        )}

        <div className="method-buttons">
          <button
            className={`method-button ${!selectedSpecialty ? 'disabled' : ''}`}
            onClick={() => handleMethodSelect('text')}
            disabled={!selectedSpecialty}
          >
            ✏️ 텍스트로 작성
          </button>
          <button
            className={`method-button ${!selectedSpecialty ? 'disabled' : ''}`}
            onClick={() => handleMethodSelect('voice')}
            disabled={!selectedSpecialty}
          >
            🎙️ 음성으로 작성
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 