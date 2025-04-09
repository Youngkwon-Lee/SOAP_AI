import { Template, TemplateFormData } from '../types';
import { storage } from './firebaseConfig';
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

export const createTemplate = async (data: TemplateFormData): Promise<Template> => {
  try {
    const now = new Date().toISOString();
    const templateData = {
      ...data,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);
    return {
      id: docRef.id,
      ...templateData
    };
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
    let q: Query<DocumentData>;
    
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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Template));
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