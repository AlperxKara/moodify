// --- YouTube Music API işlemleri ---

import { Emotion } from '@/lib/emotions';

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export interface EmotionToMusicParams {
  emotion: string;
  limit?: number;
  market?: string;
}

// YouTube API yanıt tipleri
interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
    };
  }>;
}

// Duyguya göre anahtar kelimeler
const moodKeywords: Record<Emotion, string[]> = {
  'mutlu': ['neşeli', 'pozitif', 'eğlenceli'],
  'üzgün': ['hüzünlü', 'melankolik', 'duygusal'],
  'kızgın': ['sert', 'güçlü', 'agresif'],
  'sakin': ['dinlendirici', 'rahatlatıcı', 'huzurlu'],
  'endişeli': ['dramatik', 'yoğun', 'karmaşık'],
  'heyecanlı': ['coşkulu', 'enerjik', 'dinamik'],
  'yorgun': ['yavaş', 'sakin', 'dinlendirici'],
  'stresli': ['yoğun', 'hareketli', 'enerjik'],
  'umutlu': ['pozitif', 'motivasyon', 'başarı'],
  'romantik': ['aşk', 'sevda', 'duygusal'],
  'nötr': ['normal', 'dengeli', 'standart']
};

// YouTube API yapılandırması
const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  projectId: process.env.GOOGLE_PROJECT_ID,
  apiUrl: 'https://www.googleapis.com/youtube/v3'
};

export async function getRecommendationsByEmotion(emotion: Emotion, market: string = 'TR'): Promise<YouTubeTrack[]> {
  try {
    const keywords = moodKeywords[emotion];
    const searchQuery = `${keywords.join(' ')} ${market === 'TR' ? 'türkçe' : ''} müzik`;
    console.log('YouTube search query:', searchQuery);
    
    const response = await fetch(`/api/youtube?q=${encodeURIComponent(searchQuery)}&limit=3&regionCode=${market}`);
    
    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url
    }));
  } catch (error) {
    console.error('YouTube recommendations error:', error);
    return [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getPopularTracks(market: string = 'TR'): Promise<YouTubeTrack[]> {
  try {
    const searchQuery = `${market === 'TR' ? 'türkçe' : ''} popüler müzik`;
    console.log('YouTube popular tracks query:', searchQuery);
    
    const response = await fetch(`/api/youtube?q=${encodeURIComponent(searchQuery)}&limit=3&regionCode=${market}`);
    
    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url
    }));
  } catch (error) {
    console.error('YouTube popular tracks error:', error);
    return [];
  }
} 