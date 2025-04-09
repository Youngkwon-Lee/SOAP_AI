import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import noteService from '../services/noteService';
import { UserNote } from '../types';
import '../App.css';
import { useAuth } from '../contexts/AuthContext';

const AllNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // 사용자가 로그인되어 있지 않으면 리디렉션
        if (!currentUser) {
          navigate('/auth');
          return;
        }

        setLoading(true);
        
        // Firebase에 연결되지 않은 경우 더미 데이터 사용
        if (!process.env.REACT_APP_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY === 'YOUR_API_KEY') {
          // 임시 더미 데이터
          const dummyNotes = [
            {
              id: '1',
              userId: currentUser.uid,
              type: 'Physical Therapy',
              createdAt: '2023-04-08T12:00:00Z',
              updatedAt: '2023-04-08T12:00:00Z',
              note: {
                patientInfo: {
                  name: '김환자',
                  visitDate: '2023-04-08'
                },
                subjective: '무릎 통증을 호소합니다.',
                objective: '경미한 부종이 관찰됩니다.',
                assessment: '내측 반월상 연골 손상이 의심됩니다.',
                plan: '주 2회, 6주간 물리치료 실시'
              }
            },
            {
              id: '2',
              userId: currentUser.uid,
              type: 'Physical Therapy',
              createdAt: '2023-04-05T10:30:00Z',
              updatedAt: '2023-04-05T10:30:00Z',
              note: {
                patientInfo: {
                  name: '이환자',
                  visitDate: '2023-04-05'
                },
                subjective: '어깨 통증을 호소합니다.',
                objective: '어깨 ROM 제한이 관찰됩니다.',
                assessment: '회전근개 부분 파열 의심',
                plan: '주 3회, 4주간 물리치료 실시'
              }
            },
            {
              id: '3',
              userId: currentUser.uid,
              type: 'Physical Therapy',
              createdAt: '2023-04-01T15:45:00Z',
              updatedAt: '2023-04-01T15:45:00Z',
              note: {
                patientInfo: {
                  name: '박환자',
                  visitDate: '2023-04-01'
                },
                subjective: '허리 통증을 호소합니다.',
                objective: '허리 전굴 시 통증 증가가 관찰됩니다.',
                assessment: '요추 추간판 탈출증 의심',
                plan: '주 2회, 8주간 물리치료 실시'
              }
            }
          ];
          
          setNotes(dummyNotes as UserNote[]);
        } else {
          // Firebase에서 노트 불러오기
          const fetchedNotes = await noteService.getAllNotes();
          setNotes(fetchedNotes);
        }
      } catch (error) {
        console.error('노트 불러오기 오류:', error);
        setError('노트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [currentUser, navigate]);
  
  const handleNoteTypeSelect = (type: string) => {
    console.log('Selected note type:', type);
    // 노트 타입에 따라 다른 페이지로 이동 가능
  };
  
  const handleNoteClick = (noteId: string) => {
    // 특정 노트 보기
    alert(`노트 ID ${noteId}를 클릭했습니다. 이 기능은 아직 구현 중입니다.`);
  };
  
  const handleCreateNew = () => {
    navigate('/soap-note-physical-therapy');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation(); // 부모 요소의 클릭 이벤트 전파 방지
    
    if (window.confirm('정말로 이 노트를 삭제하시겠습니까?')) {
      try {
        if (process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_API_KEY !== 'YOUR_API_KEY') {
          await noteService.deleteNote(noteId);
        }
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('노트 삭제 오류:', error);
        alert('노트 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  
  const handleEditNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation(); // 부모 요소의 클릭 이벤트 전파 방지
    
    // 편집 페이지로 이동
    navigate(`/edit-note/${noteId}`);
  };
  
  const handleExportNote = (e: React.MouseEvent, note: UserNote) => {
    e.stopPropagation(); // 부모 요소의 클릭 이벤트 전파 방지
    
    const exportOptions = ['JSON', 'CSV'];
    const option = prompt(`노트 내보내기 형식을 선택하세요: ${exportOptions.join(', ')}`);
    
    if (!option) return;
    
    try {
      let exportedData: string = '';
      let fileName: string = '';
      
      if (option.toUpperCase() === 'JSON') {
        exportedData = noteService.exportNoteToJSON(note.note);
        fileName = `SOAP_Note_${note.id}_${new Date().toISOString().slice(0, 10)}.json`;
      } else if (option.toUpperCase() === 'CSV') {
        exportedData = noteService.exportNoteToCSV(note.note);
        fileName = `SOAP_Note_${note.id}_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        alert('지원하지 않는 형식입니다. JSON 또는 CSV를 선택하세요.');
        return;
      }
      
      const blob = new Blob([exportedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('내보내기 오류:', error);
      alert('노트 내보내기 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <Sidebar onNoteTypeSelect={handleNoteTypeSelect} />
        <div className="content">
          <div className="all-notes-container">
            <div className="all-notes-header">
              <h1>모든 노트</h1>
              <button className="button new-btn" onClick={handleCreateNew}>새 노트 작성</button>
            </div>
            
            {loading && (
              <div className="loading">
                <p>노트를 불러오는 중...</p>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            
            {!loading && !error && notes.length === 0 ? (
              <div className="no-notes-message">
                <p>저장된 노트가 없습니다. 새 노트를 작성해보세요.</p>
              </div>
            ) : (
              <div className="notes-list">
                {notes.map(note => (
                  <div 
                    key={note.id} 
                    className="note-item"
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <div className="note-details">
                      <h3>{note.note.patientInfo.name || '환자명 없음'} - {note.type}</h3>
                      <div className="note-meta">
                        <span>환자 방문일: {note.note.patientInfo.visitDate}</span>
                        <span>작성일: {formatDate(note.createdAt)}</span>
                      </div>
                      <div className="note-preview">
                        <p>{note.note.subjective?.substring(0, 100)}...</p>
                      </div>
                    </div>
                    <div className="note-actions">
                      <button 
                        className="icon-button" 
                        title="편집"
                        onClick={(e) => handleEditNote(e, note.id)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="icon-button" 
                        title="내보내기"
                        onClick={(e) => handleExportNote(e, note)}
                      >
                        📄
                      </button>
                      <button 
                        className="icon-button" 
                        title="삭제"
                        onClick={(e) => handleDeleteNote(e, note.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllNotesPage; 