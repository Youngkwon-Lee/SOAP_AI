import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

interface SidebarProps {
  onNoteTypeSelect: (type: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNoteTypeSelect }) => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<string>('audio');

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    
    switch(item) {
      case 'audio':
        navigate('/soap-note-physical-therapy');
        onNoteTypeSelect('Audio SOAP Note');
        break;
      case 'text':
        navigate('/soap-note-physical-therapy');
        onNoteTypeSelect('Text SOAP Note');
        break;
      case 'all':
        navigate('/all-notes');
        break;
      case 'patients':
        navigate('/patients');
        break;
      default:
        break;
    }
  };

  return (
    <div className="sidebar">
      <div 
        className={`sidebar-item ${activeItem === 'audio' ? 'active' : ''}`} 
        onClick={() => handleItemClick('audio')}
      >
        <span>Audio SOAP Note</span>
      </div>
      
      <div 
        className={`sidebar-item ${activeItem === 'text' ? 'active' : ''}`}
        onClick={() => handleItemClick('text')}
      >
        <span>Text SOAP Note</span>
      </div>
      
      <div 
        className={`sidebar-item ${activeItem === 'all' ? 'active' : ''}`}
        onClick={() => handleItemClick('all')}
      >
        <span>All Notes (0)</span>
        <p className="note-info">Notes are auto deleted after 30 days of creation.</p>
      </div>
      
      <div 
        className={`sidebar-item ${activeItem === 'patients' ? 'active' : ''}`}
        onClick={() => handleItemClick('patients')}
      >
        <span>환자 관리</span>
        <p className="note-info">환자 정보를 관리하고 환자별 노트를 확인할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default Sidebar; 