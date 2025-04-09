import { db, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// 환자 정보 타입
export interface Patient {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  medicalHistory: string;
  createdAt: string;
  updatedAt: string;
}

// 신규 환자 생성 시 사용되는 타입
export interface NewPatient {
  name: string;
  dateOfBirth: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  medicalHistory: string;
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// 환자 추가
export const addPatient = async (patient: NewPatient): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const patientData = {
      userId,
      ...patient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'patients'), patientData);
    return docRef.id;
  } catch (error) {
    console.error('환자 추가 오류:', error);
    throw error;
  }
};

// 모든 환자 가져오기
export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    const userId = getCurrentUserId();
    
    const q = query(
      collection(db, 'patients'),
      where('userId', '==', userId),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    const patients: Patient[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      patients.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        contactInfo: data.contactInfo,
        medicalHistory: data.medicalHistory,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    return patients;
  } catch (error) {
    console.error('환자 목록 가져오기 오류:', error);
    throw error;
  }
};

// 특정 환자 가져오기
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  try {
    const userId = getCurrentUserId();
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      const data = patientSnap.data();
      
      // 해당 환자가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 환자 정보에 접근할 권한이 없습니다.');
      }
      
      return {
        id: patientSnap.id,
        userId: data.userId,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        contactInfo: data.contactInfo,
        medicalHistory: data.medicalHistory,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('환자 정보 가져오기 오류:', error);
    throw error;
  }
};

// 환자 정보 업데이트
export const updatePatient = async (patientId: string, updates: Partial<NewPatient>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      const data = patientSnap.data();
      
      // 해당 환자가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 환자 정보를 수정할 권한이 없습니다.');
      }
      
      await updateDoc(patientRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } else {
      throw new Error('환자를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('환자 정보 업데이트 오류:', error);
    throw error;
  }
};

// 환자 삭제
export const deletePatient = async (patientId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      const data = patientSnap.data();
      
      // 해당 환자가 현재 사용자의 것인지 확인
      if (data.userId !== userId) {
        throw new Error('이 환자를 삭제할 권한이 없습니다.');
      }
      
      await deleteDoc(patientRef);
      
      // 관련 노트도 삭제하거나 연결 해제하는 로직이 필요할 수 있음
    } else {
      throw new Error('환자를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('환자 삭제 오류:', error);
    throw error;
  }
};

// 환자 이름으로 검색
export const searchPatientsByName = async (name: string): Promise<Patient[]> => {
  try {
    const userId = getCurrentUserId();
    const patients = await getAllPatients();
    
    // 클라이언트 측 필터링 (Firestore는 'contains' 쿼리를 직접 지원하지 않음)
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(name.toLowerCase())
    );
  } catch (error) {
    console.error('환자 검색 오류:', error);
    throw error;
  }
};

const patientService = {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatientsByName
};

export default patientService; 