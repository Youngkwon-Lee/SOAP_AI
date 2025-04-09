import { db, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { addCredits } from './userService';

// 트랜잭션 타입
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  creditType: 'text' | 'audio';
  creditsAdded: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// 새 트랜잭션 타입
export interface NewTransaction {
  amount: number;
  creditType: 'text' | 'audio';
  creditsAdded: number;
  paymentMethod: string;
}

// 현재 사용자 ID 가져오기
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// 새 트랜잭션 추가
export const createTransaction = async (transaction: NewTransaction): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const transactionData = {
      userId,
      ...transaction,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    return docRef.id;
  } catch (error) {
    console.error('트랜잭션 생성 오류:', error);
    throw error;
  }
};

// 트랜잭션 완료 처리
export const completeTransaction = async (transactionId: string): Promise<void> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (!transactionSnap.exists()) {
      throw new Error('트랜잭션을 찾을 수 없습니다.');
    }
    
    const data = transactionSnap.data() as Transaction;
    
    // 트랜잭션이 완료되지 않았는지 확인
    if (data.status === 'completed') {
      throw new Error('이미 완료된 트랜잭션입니다.');
    }
    
    // 트랜잭션 상태 업데이트
    await updateDoc(transactionRef, {
      status: 'completed'
    });
    
    // 사용자에게 크레딧 추가
    await addCredits(data.creditType, data.creditsAdded);
    
  } catch (error) {
    console.error('트랜잭션 완료 오류:', error);
    throw error;
  }
};

// 사용자의 모든 트랜잭션 가져오기
export const getUserTransactions = async (): Promise<Transaction[]> => {
  try {
    const userId = getCurrentUserId();
    
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        creditType: data.creditType,
        creditsAdded: data.creditsAdded,
        paymentMethod: data.paymentMethod,
        status: data.status,
        createdAt: data.createdAt
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('트랜잭션 목록 가져오기 오류:', error);
    throw error;
  }
};

const transactionService = {
  createTransaction,
  completeTransaction,
  getUserTransactions
};

export default transactionService; 