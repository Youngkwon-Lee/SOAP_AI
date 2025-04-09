import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

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
      { id: 'rehabilitation', name: '재활의학과' },
      { id: 'orthopedics', name: '정형외과' },
      { id: 'neurology', name: '신경과' },
      { id: 'psychiatry', name: '정신건강의학과' },
      { id: 'family', name: '가정의학과' }
    ]
  },
  {
    id: 'therapist',
    name: '치료사',
    specialties: [
      { id: 'physical', name: '물리치료' },
      { id: 'occupational', name: '작업치료' },
      { id: 'speech', name: '언어치료' },
      { id: 'psychological', name: '심리치료' },
      { id: 'massage', name: '마사지치료' }
    ]
  },
  {
    id: 'nurse',
    name: '간호사',
    specialties: [
      { id: 'rehabilitation', name: '재활간호' },
      { id: 'psychiatric', name: '정신간호' },
      { id: 'home', name: '방문간호' },
      { id: 'general', name: '일반간호' }
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

      if (method === 'text') {
        navigate(`/soap-note?${params.toString()}`);
      } else {
        navigate(`/soap-note?${params.toString()}`);
      }
    }
  };

  const selectedProfessionData = professions.find(p => p.id === selectedProfession);

  return (
    <div className="home-container">
      <h1>SOAP 노트 작성</h1>
      <div className="selection-container">
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
                {specialty.name}
              </option>
            ))}
          </select>
        </div>

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