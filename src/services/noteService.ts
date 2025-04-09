import { db, auth } from './firebaseConfig';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { SoapNote, UserNote, NoteType } from '../types';

// 현재 로그인한 사용자의 ID 가져오기
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// 새 노트 추가
export const saveNote = async (note: SoapNote, noteType: NoteType): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const userNote = {
      type: noteType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note
    };
    
    const docRef = await addDoc(collection(db, 'notes'), userNote);
    return docRef.id;
  } catch (error) {
    console.error('Error saving note:', error);
    throw new Error('노트 저장 중 오류가 발생했습니다.');
  }
};

// 현재 사용자의 모든 노트 가져오기
export const getAllNotes = async (): Promise<UserNote[]> => {
  try {
    const userId = getCurrentUserId();
    
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const notes: UserNote[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        note: data.note
      });
    });
    
    return notes;
  } catch (error) {
    console.error('Error getting notes:', error);
    throw new Error('노트 불러오기 중 오류가 발생했습니다.');
  }
};

// 특정 노트 가져오기
export const getNoteById = async (noteId: string): Promise<UserNote | null> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 해당 노트가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 노트에 접근할 권한이 없습니다.');
      }
      
      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        note: data.note
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting note:', error);
    throw new Error('노트 불러오기 중 오류가 발생했습니다.');
  }
};

// 특정 타입의 노트만 가져오기
export const getNotesByType = async (noteType: NoteType): Promise<UserNote[]> => {
  try {
    const userId = getCurrentUserId();
    
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      where('type', '==', noteType),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const notes: UserNote[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        note: data.note
      });
    });
    
    return notes;
  } catch (error) {
    console.error('Error getting notes by type:', error);
    throw new Error('노트 불러오기 중 오류가 발생했습니다.');
  }
};

// 노트 업데이트
export const updateNote = async (noteId: string, updatedNote: Partial<SoapNote>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 해당 노트가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 노트를 수정할 권한이 없습니다.');
      }
      
      const updatedData = {
        ...data,
        note: {
          ...data.note,
          ...updatedNote
        },
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updatedData);
    } else {
      throw new Error('해당 노트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('노트 업데이트 중 오류가 발생했습니다.');
  }
};

// 노트 삭제
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 해당 노트가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 노트를 삭제할 권한이 없습니다.');
      }
      
      await deleteDoc(docRef);
    } else {
      throw new Error('해당 노트를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('노트 삭제 중 오류가 발생했습니다.');
  }
};

// CSV 형식으로 노트 내보내기
export const exportNoteToCSV = (note: SoapNote): string => {
  const { patientInfo, subjective, objective, assessment, plan } = note;
  const { name, visitDate } = patientInfo;
  
  const csvHeader = 'Patient Name,Visit Date,Subjective,Objective,Assessment,Plan\n';
  const escapedSubjective = `"${subjective.replace(/"/g, '""')}"`;
  const escapedObjective = `"${objective?.replace(/"/g, '""') || ''}"`;
  const escapedAssessment = `"${assessment?.replace(/"/g, '""') || ''}"`;
  const escapedPlan = `"${plan?.replace(/"/g, '""') || ''}"`;
  
  const csvRow = `"${name}","${visitDate}",${escapedSubjective},${escapedObjective},${escapedAssessment},${escapedPlan}`;
  
  return csvHeader + csvRow;
};

// JSON 형식으로 노트 내보내기
export const exportNoteToJSON = (note: SoapNote): string => {
  return JSON.stringify(note, null, 2);
};

const noteService = {
  saveNote,
  getAllNotes,
  getNoteById,
  getNotesByType,
  updateNote,
  deleteNote,
  exportNoteToCSV,
  exportNoteToJSON
};

export default noteService; 