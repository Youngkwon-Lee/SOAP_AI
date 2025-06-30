import { Template, TemplateFormData } from '../types';
import { storage, auth } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase Firestore를 사용하여 템플릿을 저장하고 관리
import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  DocumentData,
  Query
} from 'firebase/firestore';

const TEMPLATES_COLLECTION = 'templates';

export const createTemplate = async (data: TemplateFormData, isSystem: boolean = false): Promise<Template> => {
  try {
    const now = new Date().toISOString();
    const currentUser = auth.currentUser;
    
    if (!currentUser && !isSystem) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const templateData: Omit<Template, 'id'> = { // id를 제외한 Template 타입
      ...data,
      example: '', // example 필드를 빈 문자열로 초기화
      userId: isSystem ? 'system' : currentUser?.uid,
      isSystemTemplate: isSystem,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
    return {
      id: docRef.id,
      ...templateData
    } as Template;
  } catch (error) {
    console.error('템플릿 생성 중 오류:', error);
    throw error;
  }
};

export const updateTemplate = async (id: string, data: Partial<TemplateFormData>): Promise<void> => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(templateRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('템플릿 업데이트 중 오류:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
  } catch (error) {
    console.error('템플릿 삭제 중 오류:', error);
    throw error;
  }
};

export const getTemplates = async (profession?: string, specialty?: string): Promise<Template[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    let q: Query<DocumentData>;
    
    // 시스템 템플릿 + 사용자 개인 템플릿 조회
    if (profession && specialty) {
      q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('profession', '==', profession),
        where('specialty', '==', specialty)
      );
    } else if (profession) {
      q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('profession', '==', profession)
      );
    } else {
      q = query(collection(db, TEMPLATES_COLLECTION));
    }

    const querySnapshot = await getDocs(q);
    const allTemplates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Template));

    // 시스템 템플릿 또는 사용자 본인의 템플릿만 반환
    return allTemplates.filter(template => 
      template.userId === 'system' || template.userId === currentUser.uid
    );
  } catch (error) {
    console.error('템플릿 조회 중 오류:', error);
    throw error;
  }
};

export const uploadTemplateFile = async (file: File): Promise<string> => {
  try {
    const fileName = `templates/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('템플릿 파일 업로드 중 오류:', error);
    throw error;
  }
};

const templateService = {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplates,
  uploadTemplateFile
};

export default templateService; 