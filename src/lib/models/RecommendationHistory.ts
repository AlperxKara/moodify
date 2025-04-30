import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { RecommendationHistory } from './types';

// Kullanıcının geçmiş önerilerini getir
export const getUserRecommendationHistory = async (userId: string, type: 'music' | 'movie'): Promise<RecommendationHistory[]> => {
  const historyRef = collection(db, 'recommendationHistory');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    where('type', '==', type),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as RecommendationHistory);
}; 