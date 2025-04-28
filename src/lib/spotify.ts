// --- Spotify API işlemleri ---

export interface EmotionToMusicParams {
  valence: number;  // 0.0 to 1.0
  energy: number;   // 0.0 to 1.0
  limit?: number;   // number of tracks to return
  market?: string;  // Spotify market kodu (TR, US, vs)
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

const CLIENT_ID = 'ba158563d9364b2a95e3e59154f6fc72';
const REDIRECT_URI = 'http://localhost:3000/dashboard';
const SCOPES = 'user-read-private user-read-email streaming';

// 1. Spotify Auth URL oluşturucu
export const getSpotifyAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'token',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: 'true'
  });
  return `https://accounts.spotify.com/authorize?${params}`;
};

// 2. Token yönetimi
export const setSpotifyToken = (token: string) => {
  localStorage.setItem('spotify_token', token);
};
export const getSpotifyToken = (): string | null => {
  return localStorage.getItem('spotify_token');
};
export const clearSpotifyToken = () => {
  localStorage.removeItem('spotify_token');
};
export const checkSpotifyToken = (): boolean => {
  return !!localStorage.getItem('spotify_token');
};

// 3. Duyguya göre genre seçici (sadece desteklenenler)
const getMoodBasedGenres = (valence: number, energy: number): string[] => {
  if (valence > 0.7 && energy > 0.7) return ['pop', 'dance', 'house'];
  if (valence < 0.3 && energy < 0.3) return ['classical', 'ambient', 'piano'];
  if (valence < 0.3 && energy > 0.7) return ['rock', 'metal', 'jazz'];
  if (valence > 0.7 && energy < 0.3) return ['jazz', 'acoustic', 'folk'];
  return ['pop', 'rock', 'indie'];
};

// 4. Duygu stringinden parametreye çevirici
export const mapEmotionToMusicParams = (emotion: string): EmotionToMusicParams => {
  const moodMap: Record<string, EmotionToMusicParams> = {
    'mutlu': { valence: 0.8, energy: 0.8 },
    'üzgün': { valence: 0.2, energy: 0.3 },
    'kızgın': { valence: 0.3, energy: 0.9 },
    'sakin': { valence: 0.6, energy: 0.4 },
    'heyecanlı': { valence: 0.7, energy: 0.8 },
    'endişeli': { valence: 0.3, energy: 0.6 },
    'yorgun': { valence: 0.4, energy: 0.3 },
    'stresli': { valence: 0.3, energy: 0.7 }
  };
  return moodMap[emotion.toLowerCase()] || { valence: 0.5, energy: 0.5 };
};

// 5. Spotify öneri fonksiyonu
export const getRecommendationsByEmotion = async (params: EmotionToMusicParams): Promise<SpotifyTrack[]> => {
  try {
    const token = getSpotifyToken();
    if (!token) throw new Error('Spotify bağlantısı gerekiyor. Lütfen tekrar giriş yapın.');
    let genres = getMoodBasedGenres(params.valence, params.energy);
    let searchParams = new URLSearchParams({
      seed_genres: genres.join(','),
      target_valence: params.valence.toString(),
      target_energy: params.energy.toString(),
      limit: (params.limit || 10).toString()
    });
    if (params.market) {
      searchParams.append('market', params.market);
    }

    let response = await fetch(`https://api.spotify.com/v1/recommendations?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `Spotify API hatası: ${response.status}`;
      if (text) {
        errorMessage += ` - ${text}`;
      }
      throw new Error(errorMessage);
    }

    let data = await response.json();
    console.log('Spotify API yanıtı:', data);

    // Eğer sonuç yoksa, daha genel parametrelerle tekrar dene
    if (!data.tracks || !Array.isArray(data.tracks) || data.tracks.length === 0) {
      genres = ['pop'];
      searchParams = new URLSearchParams({
        seed_genres: genres.join(','),
        target_valence: '0.5',
        target_energy: '0.5',
        limit: (params.limit || 10).toString()
      });
      response = await fetch(`https://api.spotify.com/v1/recommendations?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Spotify API hatası: ${response.status}`;
        if (text) {
          errorMessage += ` - ${text}`;
        }
        throw new Error(errorMessage);
      }
      data = await response.json();
      console.log('Spotify API (genel deneme) yanıtı:', data);

      if (!data.tracks || !Array.isArray(data.tracks) || data.tracks.length === 0) {
        throw new Error('Spotify şarkı önerisi bulunamadı. Lütfen farklı bir ruh hali veya tür deneyin.');
      }
    }

    return data.tracks;
  } catch (error) {
    throw error;
  }
};

// Popüler şarkı listesi çekmek için fonksiyon
export const getPopularTracks = async (query: string = 'pop', limit: number = 10): Promise<SpotifyTrack[]> => {
  try {
    const token = getSpotifyToken();
    if (!token) throw new Error('Spotify bağlantısı gerekiyor. Lütfen tekrar giriş yapın.');
    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString()
    });
    const response = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `Spotify Search API hatası: ${response.status}`;
      if (text) {
        errorMessage += ` - ${text}`;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    if (!data.tracks || !Array.isArray(data.tracks.items) || data.tracks.items.length === 0) {
      throw new Error('Spotify popüler şarkı bulunamadı.');
    }
    return data.tracks.items;
  } catch (error) {
    throw error;
  }
}; 