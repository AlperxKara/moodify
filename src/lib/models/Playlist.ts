import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc, arrayUnion } from 'firebase/firestore';
import { Playlist, PlaylistItem } from './types';

// Yeni oynatma listesi oluştur
export const createPlaylist = async (userId: string, data: Omit<Playlist, 'id' | 'items' | 'createdAt'>): Promise<Playlist> => {
  try {
    if (!userId) {
      throw new Error('userId gerekli');
    }

    const playlistsRef = collection(db, 'users', userId, 'playlists');
    const newPlaylist = {
      ...data,
      items: [],
      createdAt: new Date()
    };
    
    console.log('Oluşturulacak playlist:', newPlaylist);
    const docRef = await addDoc(playlistsRef, newPlaylist);
    
    return {
      id: docRef.id,
      ...newPlaylist
    };
  } catch (error) {
    console.error('Oynatma listesi oluşturulurken hata:', error);
    throw error;
  }
};

// Kullanıcının oynatma listelerini getir
export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  try {
    const playlistsRef = collection(db, 'users', userId, 'playlists');
    const querySnapshot = await getDocs(playlistsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Playlist[];
  } catch (error) {
    console.error('Oynatma listeleri alınırken hata:', error);
    throw error;
  }
};

// Oynatma listesi detaylarını getir
export const getPlaylist = async (userId: string, playlistId: string): Promise<Playlist | null> => {
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);
    
    if (!playlistDoc.exists()) return null;
    
    return {
      id: playlistDoc.id,
      ...playlistDoc.data()
    } as Playlist;
  } catch (error) {
    console.error('Oynatma listesi alınırken hata:', error);
    throw error;
  }
};

// Oynatma listesine öğe ekle
export const addPlaylistItem = async (userId: string, playlistId: string, item: Omit<PlaylistItem, 'userId'>): Promise<void> => {
  try {
    // Gerekli alanların kontrolü
    if (!userId || !playlistId) {
      throw new Error('userId ve playlistId gerekli');
    }

    if (!item || typeof item !== 'object') {
      throw new Error('Geçerli bir öğe gerekli');
    }

    // Zorunlu alanları kontrol et
    if (!item.id || !item.title || !item.type) {
      console.error('Eksik alanlar:', item);
      throw new Error('id, title ve type alanları zorunludur');
    }

    // Temiz bir nesne oluştur
    const cleanItem = {
      id: item.id,
      title: item.title,
      type: item.type as 'music' | 'movie',
      addedAt: new Date(),
      artist: item.artist || null,
      thumbnail: item.thumbnail || null
    };

    if (item.details) {
      cleanItem['details'] = {
        duration: item.details.duration || '',
        releaseDate: item.details.releaseDate || null,
        rating: item.details.rating || null
      };
    }

    // Firestore referansını al
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    const playlistDoc = await getDoc(playlistRef);

    if (!playlistDoc.exists()) {
      throw new Error('Playlist bulunamadı');
    }

    // Mevcut items dizisini al
    const currentPlaylist = playlistDoc.data();
    const currentItems = currentPlaylist.items || [];

    // Yeni öğeyi ekle
    const updatedItems = [...currentItems, { ...cleanItem, userId }];

    // Firestore'u güncelle
    await updateDoc(playlistRef, {
      items: updatedItems
    });

    console.log('Öğe başarıyla eklendi:', cleanItem);
  } catch (error) {
    console.error('Oynatma listesine öğe eklenirken hata:', error);
    throw error;
  }
};

// Oynatma listesinden öğe kaldır
export const removePlaylistItem = async (userId: string, playlistId: string, itemId: string): Promise<void> => {
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    const playlist = await getPlaylist(userId, playlistId);
    
    if (!playlist) throw new Error('Oynatma listesi bulunamadı');
    
    const updatedItems = playlist.items.filter(item => item.id !== itemId);
    
    await updateDoc(playlistRef, {
      items: updatedItems
    });
  } catch (error) {
    console.error('Oynatma listesinden öğe kaldırılırken hata:', error);
    throw error;
  }
};

// Oynatma listesini güncelle
export const updatePlaylist = async (userId: string, playlistId: string, data: Partial<Playlist>): Promise<void> => {
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    await updateDoc(playlistRef, data);
  } catch (error) {
    console.error('Oynatma listesi güncellenirken hata:', error);
    throw error;
  }
};

// Oynatma listesini sil
export const deletePlaylist = async (userId: string, playlistId: string): Promise<void> => {
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    await deleteDoc(playlistRef);
  } catch (error) {
    console.error('Oynatma listesi silinirken hata:', error);
    throw error;
  }
}; 