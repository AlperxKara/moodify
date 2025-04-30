import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { UserProfile, UserPreferences, MoodHistory, RecommendationHistory } from './types';

// Kullanıcı profili işlemleri
export const createUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  const userRef = doc(db, 'users', userId);
  const now = new Date();
  
  const defaultPreferences: UserPreferences = {
    contentType: 'yerli',
    language: 'tr',
    theme: 'dark',
    notifications: true
  };

  const newProfile: UserProfile = {
    id: userId,
    name: data.name || '',
    email: data.email || '',
    preferences: data.preferences || defaultPreferences,
    subscription: {
      name: 'Ücretsiz',
      status: 'inactive',
      expiryDate: '',
    },
    socialAccounts: [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, newProfile);
  return newProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  return userDoc.data() as UserProfile;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  const userRef = doc(db, 'users', userId);
  const updateData = {
    ...data,
    updatedAt: new Date()
  };
  
  await updateDoc(userRef, updateData);
  const updatedDoc = await getDoc(userRef);
  return updatedDoc.data() as UserProfile;
};

// Duygu geçmişi işlemleri
export const saveMoodHistory = async (data: Omit<MoodHistory, 'id' | 'timestamp'>): Promise<MoodHistory> => {
  try {
    console.log('saveMoodHistory başlıyor:', data);
    const moodHistoryRef = collection(db, 'users', data.userId, 'moodHistory');
    const now = new Date();
    
    const newMoodHistory: Omit<MoodHistory, 'id'> = {
      ...data,
      timestamp: now
    };
    
    console.log('Firestore\'a kaydedilecek veri:', newMoodHistory);
    const docRef = await addDoc(moodHistoryRef, newMoodHistory);
    console.log('MoodHistory kaydı başarılı, docId:', docRef.id);
    
    return {
      id: docRef.id,
      ...newMoodHistory
    };
  } catch (error) {
    console.error('saveMoodHistory hatası:', error);
    throw error;
  }
};

export async function getUserMoodHistory(userId: string, limitCount?: number) {
  try {
    const moodHistoryRef = collection(db, 'users', userId, 'moodHistory');
    let q = query(moodHistoryRef, orderBy('timestamp', 'desc'));
    
    if (limitCount) {
      q = query(q, firestoreLimit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting mood history:', error);
    throw error;
  }
}

// Öneri geçmişi işlemleri
export const saveRecommendation = async (data: Omit<RecommendationHistory, 'id' | 'timestamp'>): Promise<RecommendationHistory> => {
  try {
    console.log('saveRecommendation başlıyor:', data);
    const recommendationsRef = collection(db, 'users', data.userId, 'recommendations');
    const now = new Date();
    
    const newRecommendation: Omit<RecommendationHistory, 'id'> = {
      ...data,
      timestamp: now
    };
    
    console.log('Firestore\'a kaydedilecek veri:', newRecommendation);
    const docRef = await addDoc(recommendationsRef, newRecommendation);
    console.log('Recommendation kaydı başarılı, docId:', docRef.id);
    
    return {
      id: docRef.id,
      ...newRecommendation
    };
  } catch (error) {
    console.error('saveRecommendation hatası:', error);
    throw error;
  }
};

export const getUserRecommendations = async (userId: string): Promise<RecommendationHistory[]> => {
  try {
    const recommendationsRef = collection(db, 'users', userId, 'recommendations');
    const q = query(recommendationsRef, orderBy('timestamp', 'desc'), firestoreLimit(50));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RecommendationHistory[];
  } catch (error) {
    console.error('Öneriler alınırken hata:', error);
    throw error;
  }
};

// Kullanıcı tercihleri işlemleri
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('Kullanıcı bulunamadı');
  }
  
  const currentPreferences = (userDoc.data() as UserProfile).preferences;
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences
  };
  
  await updateDoc(userRef, {
    preferences: updatedPreferences,
    updatedAt: new Date()
  });
  
  return updatedPreferences;
};

// Sosyal medya hesapları işlemleri
export const updateSocialAccount = async (
  userId: string,
  platform: string,
  connected: boolean,
  username?: string
): Promise<boolean> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('Kullanıcı bulunamadı');
  }
  
  const userData = userDoc.data() as UserProfile;
  const socialAccounts = [...(userData.socialAccounts || [])];
  
  const accountIndex = socialAccounts.findIndex(acc => acc.platform === platform);
  
  if (accountIndex > -1) {
    socialAccounts[accountIndex] = {
      ...socialAccounts[accountIndex],
      connected,
      username: username || socialAccounts[accountIndex].username
    };
  } else {
    socialAccounts.push({
      platform,
      connected,
      username: username || ''
    });
  }
  
  await updateDoc(userRef, {
    socialAccounts,
    updatedAt: new Date()
  });
  
  return true;
}; 