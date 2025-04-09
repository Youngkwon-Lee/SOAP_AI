import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import noteService from '../services/noteService';
import { UserNote, SoapNote, NoteType } from '../types';
import '../App.css';
import { useAuth } from '../contexts/AuthContext';

const EditNotePage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState<UserNote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [editedNote, setEditedNote] = useState<SoapNote>({
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      visitDate: ''
    },
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  
  useEffect(() => {
    const fetchNote = async () => {
      // 사용자가 로그인되어 있지 않으면 리디렉션
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      
      if (!noteId) {
        setError('노트 ID가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Firebase 연결 여부 확인
        if (!process.env.REACT_APP_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY === 'YOUR_API_KEY') {
          // 시뮬레이션된 노트 데이터
          const simulatedNote: UserNote = {
            id: noteId,
            userId: currentUser.uid,
            type: 'Physical Therapy' as NoteType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            note: {
              patientInfo: {
                name: '김환자',
                age: '30',
                gender: '남',
                visitDate: '2023-04-08'
              },
              subjective: '무릎 통증을 호소합니다.',
              objective: '경미한 부종이 관찰됩니다.',
              assessment: '내측 반월상 연골 손상이 의심됩니다.',
              plan: '물리치료와 운동치료를 진행합니다.'
            }
          };
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          setNote(simulatedNote);
          setEditedNote(simulatedNote.note);
        } else {
          // 실제 Firebase에서 노트 가져오기
          const fetchedNote = await noteService.getNoteById(noteId);
          
          if (!fetchedNote) {
            setError('노트를 찾을 수 없습니다.');
            return;
          }
          
          setNote(fetchedNote);
          setEditedNote(fetchedNote.note);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('노트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNote();
  }, [noteId, currentUser, navigate]);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'patientName' || name === 'visitDate') {
      setEditedNote(prev => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          [name === 'patientName' ? 'name' : 'visitDate']: value
        }
      }));
    } else {
      setEditedNote(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSave = async () => {
    if (!noteId || !note) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (!process.env.REACT_APP_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY === 'YOUR_API_KEY') {
        // 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('노트가 성공적으로 업데이트되었습니다. (시뮬레이션)');
      } else {
        // 실제 업데이트
        await noteService.updateNote(noteId, editedNote);
        alert('노트가 성공적으로 업데이트되었습니다.');
      }
      
      navigate('/all-notes');
    } catch (error) {
      console.error('Error updating note:', error);
      setError('노트 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/all-notes');
  };
  
  const handleNoteTypeSelect = (type: string) => {
    console.log('Selected note type:', type);
  };
  
  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="main-content">
          <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
          <div className="content">
            <div className="loading">
              <p>노트를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="app">
        <Header />
        <div className="main-content">
          <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
          <div className="content">
            <div className="error-message">
              <p>{error}</p>
              <button className="button" onClick={handleCancel}>목록으로 돌아가기</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!note) {
    return (
      <div className="app">
        <Header />
        <div className="main-content">
          <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
          <div className="content">
            <div className="error-message">
              <p>노트를 찾을 수 없습니다.</p>
              <button className="button" onClick={handleCancel}>목록으로 돌아가기</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
        <div className="content">
          <div className="edit-note-container">
            <div className="edit-note-header">
              <h1>노트 편집</h1>
              <div>
                <span>노트 유형: {note.type}</span>
                <span>작성일: {new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="edit-form">
              <div className="form-section">
                <h2>환자 정보</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>환자 이름</label>
                    <input 
                      type="text" 
                      name="patientName"
                      value={editedNote.patientInfo.name} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>방문 날짜</label>
                    <input 
                      type="date" 
                      name="visitDate"
                      value={editedNote.patientInfo.visitDate} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2>Subjective (주관적 정보)</h2>
                <textarea 
                  name="subjective"
                  value={editedNote.subjective} 
                  onChange={handleInputChange}
                  rows={6}
                />
              </div>
              
              <div className="form-section">
                <h2>Objective (객관적 정보)</h2>
                <textarea 
                  name="objective"
                  value={editedNote.objective || ''} 
                  onChange={handleInputChange}
                  rows={6}
                />
              </div>
              
              <div className="form-section">
                <h2>Assessment (평가)</h2>
                <textarea 
                  name="assessment"
                  value={editedNote.assessment || ''} 
                  onChange={handleInputChange}
                  rows={6}
                />
              </div>
              
              <div className="form-section">
                <h2>Plan (계획)</h2>
                <textarea 
                  name="plan"
                  value={editedNote.plan || ''} 
                  onChange={handleInputChange}
                  rows={6}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="button cancel-btn" 
                  onClick={handleCancel}
                >
                  취소
                </button>
                <button 
                  className="button save-btn" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditNotePage; 