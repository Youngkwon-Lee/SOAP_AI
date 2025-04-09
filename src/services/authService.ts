import { getAuth } from 'firebase/auth';

export const getCurrentUserId = (): string => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  
  return user.uid;
}; 