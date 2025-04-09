import { db, auth } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Note } from '../types/note';

export interface SoapStyle {
  id: string;
  userId: string;
  styleName: string;
  examples: Note[];
  createdAt: Date;
  updatedAt: Date;
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// SOAP 스타일 생성
export const createSoapStyle = async (styleName: string, examples: Note[]): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    const styleData = {
      userId,
      styleName,
      examples,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'soapStyles'), styleData);
    return docRef.id;
  } catch (error) {
    console.error('SOAP 스타일 생성 오류:', error);
    throw error;
  }
};

// 사용자의 모든 SOAP 스타일 가져오기
export const getUserSoapStyles = async (): Promise<SoapStyle[]> => {
  try {
    const userId = getCurrentUserId();
    const q = query(collection(db, 'soapStyles'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const styles: SoapStyle[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      styles.push({
        id: doc.id,
        userId: data.userId,
        styleName: data.styleName,
        examples: data.examples,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    });
    
    return styles;
  } catch (error) {
    console.error('SOAP 스타일 가져오기 오류:', error);
    throw error;
  }
};

// SOAP 스타일 업데이트
export const updateSoapStyle = async (styleId: string, updates: Partial<SoapStyle>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const styleRef = doc(db, 'soapStyles', styleId);
    const styleSnap = await getDoc(styleRef);
    
    if (!styleSnap.exists()) {
      throw new Error('SOAP 스타일을 찾을 수 없습니다.');
    }
    
    const styleData = styleSnap.data();
    if (styleData.userId !== userId) {
      throw new Error('이 SOAP 스타일을 수정할 권한이 없습니다.');
    }
    
    await updateDoc(styleRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('SOAP 스타일 업데이트 오류:', error);
    throw error;
  }
};

// 노트를 SOAP 스타일에 추가
export const addNoteToStyle = async (styleId: string, note: Note): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const styleRef = doc(db, 'soapStyles', styleId);
    const styleSnap = await getDoc(styleRef);
    
    if (!styleSnap.exists()) {
      throw new Error('SOAP 스타일을 찾을 수 없습니다.');
    }
    
    const styleData = styleSnap.data();
    if (styleData.userId !== userId) {
      throw new Error('이 SOAP 스타일을 수정할 권한이 없습니다.');
    }
    
    const updatedExamples = [...styleData.examples, note];
    await updateDoc(styleRef, {
      examples: updatedExamples,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('노트 추가 오류:', error);
    throw error;
  }
};

const soapStyleService = {
  createSoapStyle,
  getUserSoapStyles,
  updateSoapStyle,
  addNoteToStyle
};

export default soapStyleService; 