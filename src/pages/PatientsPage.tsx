import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import patientService, { Patient } from '../services/patientService';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';
import '../styles/Patients.css';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 신규 환자 추가를 위한 상태
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    dateOfBirth: '',
    contactInfo: {
      phone: '',
      email: '',
      address: ''
    },
    medicalHistory: ''
  });
  
  useEffect(() => {
    // 사용자가 로그인되어 있지 않으면 리디렉션
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedPatients = await patientService.getAllPatients();
        setPatients(fetchedPatients);
      } catch (error) {
        console.error('환자 목록 가져오기 오류:', error);
        setError('환자 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [currentUser, navigate]);
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      if (searchTerm.trim() === '') {
        const allPatients = await patientService.getAllPatients();
        setPatients(allPatients);
      } else {
        const searchResults = await patientService.searchPatientsByName(searchTerm);
        setPatients(searchResults);
      }
    } catch (error) {
      console.error('환자 검색 오류:', error);
      setError('환자 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setNewPatient(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setNewPatient(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await patientService.addPatient(newPatient);
      
      // 폼 초기화
      setNewPatient({
        name: '',
        dateOfBirth: '',
        contactInfo: {
          phone: '',
          email: '',
          address: ''
        },
        medicalHistory: ''
      });
      
      // 폼 닫기
      setShowAddForm(false);
      
      // 환자 목록 새로고침
      const updatedPatients = await patientService.getAllPatients();
      setPatients(updatedPatients);
      
    } catch (error) {
      console.error('환자 추가 오류:', error);
      setError('환자 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('정말로 이 환자를 삭제하시겠습니까? 관련된 모든 노트도 함께 삭제될 수 있습니다.')) {
      try {
        setLoading(true);
        
        await patientService.deletePatient(patientId);
        
        // 환자 목록에서 삭제된 환자 제거
        setPatients(prev => prev.filter(patient => patient.id !== patientId));
        
      } catch (error) {
        console.error('환자 삭제 오류:', error);
        setError('환자 삭제 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleViewPatient = (patientId: string) => {
    // 환자 상세 정보 페이지로 이동 (아직 구현되지 않음)
    alert(`환자 ID: ${patientId}의 상세 정보 페이지는 아직 구현되지 않았습니다.`);
  };
  
  const handleNoteTypeSelect = (type: string) => {
    console.log('Selected note type:', type);
  };
  
  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
        <div className="content">
          <div className="patients-container">
            <div className="patients-header">
              <h1>환자 목록</h1>
              <div className="patient-actions">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="환자 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch}>검색</button>
                </div>
                <button 
                  className="button add-btn"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? '취소' : '신규 환자 추가'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            
            {showAddForm && (
              <div className="add-patient-form">
                <h2>신규 환자 추가</h2>
                <form onSubmit={handleAddPatient}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>환자 이름</label>
                      <input
                        type="text"
                        name="name"
                        value={newPatient.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>생년월일</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={newPatient.dateOfBirth}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>이메일</label>
                    <input
                      type="email"
                      name="contactInfo.email"
                      value={newPatient.contactInfo.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>전화번호</label>
                    <input
                      type="tel"
                      name="contactInfo.phone"
                      value={newPatient.contactInfo.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>주소</label>
                    <input
                      type="text"
                      name="contactInfo.address"
                      value={newPatient.contactInfo.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>과거 병력</label>
                    <textarea
                      name="medicalHistory"
                      value={newPatient.medicalHistory}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="button save-btn"
                      disabled={loading}
                    >
                      {loading ? '저장 중...' : '환자 저장'}
                    </button>
                    <button 
                      type="button" 
                      className="button cancel-btn"
                      onClick={() => setShowAddForm(false)}
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {loading && !showAddForm ? (
              <div className="loading">
                <p>환자 정보를 불러오는 중...</p>
              </div>
            ) : (
              <div className="patients-list">
                {patients.length === 0 ? (
                  <div className="no-patients">
                    <p>등록된 환자가 없습니다.</p>
                  </div>
                ) : (
                  patients.map(patient => (
                    <div key={patient.id} className="patient-card">
                      <div className="patient-info" onClick={() => handleViewPatient(patient.id)}>
                        <h3>{patient.name}</h3>
                        <p><strong>생년월일:</strong> {patient.dateOfBirth}</p>
                        <p><strong>연락처:</strong> {patient.contactInfo.phone}</p>
                        <p><strong>이메일:</strong> {patient.contactInfo.email}</p>
                      </div>
                      <div className="patient-actions">
                        <button 
                          className="icon-button" 
                          title="삭제"
                          onClick={() => handleDeletePatient(patient.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage; 