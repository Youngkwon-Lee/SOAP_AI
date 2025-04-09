import { db, auth } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

// 사용자 프로필 타입
export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  professionType: string;
  credits: {
    text: number;
    audio: number;
  };
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// 사용자 프로필 가져오기
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('프로필 가져오기 오류:', error);
    throw error;
  }
};

// 사용자 프로필 생성하기
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const newProfile: UserProfile = {
      displayName: user.displayName || user.email?.split('@')[0] || '사용자',
      email: user.email || '',
      photoURL: user.photoURL,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      professionType: '',
      credits: {
        text: 3, // 기본 크레딧
        audio: 3  // 기본 크레딧
      }
    };
    
    await setDoc(doc(db, 'users', user.uid), newProfile);
  } catch (error) {
    console.error('프로필 생성 오류:', error);
    throw error;
  }
};

// 사용자 프로필 업데이트하기
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const userRef = doc(db, 'users', userId);
    
    // lastLoginAt 자동 업데이트
    const updatesWithTimestamp = {
      ...updates,
      lastLoginAt: new Date()
    };
    
    await updateDoc(userRef, updatesWithTimestamp);
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    throw error;
  }
};

// 크레딧 사용하기
export const useCredits = async (type: 'text' | 'audio', amount: number = 1): Promise<boolean> => {
  try {
    const userId = getCurrentUserId();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('사용자 프로필이 존재하지 않습니다.');
    }
    
    const userData = userSnap.data() as UserProfile;
    
    // 크레딧이 충분한지 확인
    if (userData.credits[type] < amount) {
      return false; // 크레딧 부족
    }
    
    // 크레딧 차감
    await updateDoc(userRef, {
      [`credits.${type}`]: userData.credits[type] - amount
    });
    
    return true;
  } catch (error) {
    console.error('크레딧 사용 오류:', error);
    throw error;
  }
};

// 크레딧 추가하기
export const addCredits = async (type: 'text' | 'audio', amount: number): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('사용자 프로필이 존재하지 않습니다.');
    }
    
    const userData = userSnap.data() as UserProfile;
    
    // 크레딧 추가
    await updateDoc(userRef, {
      [`credits.${type}`]: userData.credits[type] + amount
    });
  } catch (error) {
    console.error('크레딧 추가 오류:', error);
    throw error;
  }
};

const userService = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  useCredits,
  addCredits
};

export default userService; 