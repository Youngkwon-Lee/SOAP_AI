import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSoapNote } from '../services/openaiService';
import { PatientInfo } from '../types/note';
import '../styles/PhysicalTherapyPage.css';

const PhysicalTherapyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [shorthandNotes, setShorthandNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInfo.name || !shorthandNotes) {
      setError('환자 정보와 노트 내용을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const soapNote = await generateSoapNote({
        patientInfo,
        shorthandNotes,
        noteType: '물리치료'
      });

      // TODO: 생성된 노트 저장 및 표시 로직 추가
      console.log('Generated SOAP Note:', soapNote);
    } catch (err) {
      console.error('Error generating SOAP note:', err);
      setError('SOAP 노트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="physical-therapy-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
        <h1>물리치료 SOAP 노트</h1>
      </div>

      <div className="content-container">
        <form onSubmit={handleSubmit} className="soap-note-form">
          <div className="form-section">
            <h2>환자 정보</h2>
            <div className="form-group">
              <label htmlFor="patientName">환자 이름</label>
              <input
                id="patientName"
                type="text"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({
                  ...patientInfo,
                  name: e.target.value
                })}
                placeholder="환자 이름을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="visitDate">방문 날짜</label>
              <input
                id="visitDate"
                type="date"
                value={patientInfo.visitDate}
                onChange={(e) => setPatientInfo({
                  ...patientInfo,
                  visitDate: e.target.value
                })}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>치료 노트</h2>
            <div className="form-group">
              <label htmlFor="shorthandNotes">
                치료 내용을 자유롭게 작성해주세요
                <span className="label-hint">
                  AI가 자동으로 SOAP 형식으로 변환합니다
                </span>
              </label>
              <textarea
                id="shorthandNotes"
                value={shorthandNotes}
                onChange={(e) => setShorthandNotes(e.target.value)}
                placeholder="예시: 환자가 오른쪽 어깨 통증을 호소함. 관절 가동 범위 검사 실시. 초음파 치료 20분 진행. 도수치료 실시. 다음 방문시 ROM 재평가 예정."
                rows={8}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            {isLoading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>SOAP 노트 생성 중...</span>
              </div>
            )}
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              SOAP 노트 생성하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhysicalTherapyPage; 