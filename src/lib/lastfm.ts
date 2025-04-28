const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
const API_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmTrack {
  name: string;
  artist: { name: string };
  url: string;
  image: Array<{ '#text': string; size: string }>;
}

// Duygu durumlarına göre etiket eşleştirmesi
const emotionToTag: { [key: string]: string } = {
  'mutlu': 'happy',
  'üzgün': 'sad',
  'kızgın': 'angry',
  'sakin': 'calm',
  'heyecanlı': 'energetic',
  'endişeli': 'anxious',
  'yorgun': 'tired',
  'stresli': 'stress'
};

export const getLastFmTopTracks = async (emotion: string, limit: number = 10): Promise<LastFmTrack[]> => {
  const tag = emotionToTag[emotion] || 'pop';
  const params = new URLSearchParams({
    method: 'tag.gettoptracks',
    tag,
    api_key: API_KEY || '',
    format: 'json',
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_URL}?${params}`);
  const data = await response.json();
  
  if (!data.tracks || !Array.isArray(data.tracks.track) || data.tracks.track.length === 0) {
    throw new Error('Last.fm popüler şarkı bulunamadı.');
  }
  
  return data.tracks.track;
}; 