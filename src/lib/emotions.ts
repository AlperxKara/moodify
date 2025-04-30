export type Emotion = 'mutlu' | 'üzgün' | 'kızgın' | 'sakin' | 'endişeli' | 'heyecanlı' | 'yorgun' | 'stresli' | 'umutlu' | 'romantik' | 'nötr';

export interface EmotionScore {
  emotion: Emotion;
  score: number;
}

export interface MusicParams {
  valence: number;
  energy: number;
  genres: string[];
  keywords: string[];
  subEmotions: string[];
  tempo: string;
  mood: string;
}

export function isValidEmotion(emotion: string): emotion is Emotion {
  return ['mutlu', 'üzgün', 'kızgın', 'sakin', 'endişeli', 'heyecanlı', 'yorgun', 'stresli', 'umutlu', 'romantik', 'nötr'].includes(emotion);
}

export function getTopEmotion(emotions: EmotionScore[]): Emotion | null {
  if (!emotions || emotions.length === 0) return null;
  
  return emotions.reduce((prev, current) => {
    return (prev.score > current.score) ? prev : current;
  }).emotion;
}

export function mapEmotionToMusicParams(emotion: Emotion): MusicParams {
  const params: Record<Emotion, MusicParams> = {
    'mutlu': {
      valence: 0.8,
      energy: 0.8,
      genres: ['pop', 'dance', 'happy', 'party', 'summer', 'disco'],
      keywords: ['neşeli', 'pozitif', 'eğlenceli', 'dans', 'kutlama', 'başarı'],
      subEmotions: ['coşkulu', 'gururlu', 'başarılı', 'şanslı'],
      tempo: 'fast',
      mood: 'upbeat'
    },
    'üzgün': {
      valence: 0.2,
      energy: 0.3,
      genres: ['acoustic', 'ballad', 'sad', 'indie', 'folk', 'piano'],
      keywords: ['hüzünlü', 'duygusal', 'melankolik', 'slow', 'nostaljik', 'kayıp'],
      subEmotions: ['kırgın', 'yalnız', 'pişman', 'özlem'],
      tempo: 'slow',
      mood: 'melancholic'
    },
    'kızgın': {
      valence: 0.4,
      energy: 0.9,
      genres: ['rock', 'metal', 'punk', 'hardcore', 'industrial'],
      keywords: ['güçlü', 'sert', 'dinamik', 'yoğun', 'isyan', 'öfke'],
      subEmotions: ['sinirli', 'öfkeli', 'kızgın', 'hiddetli'],
      tempo: 'very_fast',
      mood: 'aggressive'
    },
    'sakin': {
      valence: 0.6,
      energy: 0.3,
      genres: ['ambient', 'chill', 'classical', 'jazz', 'lofi', 'meditation'],
      keywords: ['rahatlatıcı', 'dinlendirici', 'huzurlu', 'soft', 'dingin', 'sakin'],
      subEmotions: ['huzurlu', 'dingin', 'rahat', 'sakin'],
      tempo: 'very_slow',
      mood: 'peaceful'
    },
    'endişeli': {
      valence: 0.3,
      energy: 0.7,
      genres: ['alternative', 'indie', 'electronic', 'experimental', 'post-rock'],
      keywords: ['yoğun', 'karmaşık', 'derin', 'atmosferik', 'gergin', 'tedirgin'],
      subEmotions: ['kaygılı', 'tedirgin', 'gergin', 'stresli'],
      tempo: 'medium',
      mood: 'anxious'
    },
    'heyecanlı': {
      valence: 0.7,
      energy: 0.9,
      genres: ['pop', 'dance', 'happy', 'party', 'electronic', 'house'],
      keywords: ['heyecanlı', 'enerjik', 'eğlenceli', 'dans', 'coşkulu', 'dinamik'],
      subEmotions: ['coşkulu', 'enerjik', 'dinamik', 'heyecanlı'],
      tempo: 'fast',
      mood: 'energetic'
    },
    'yorgun': {
      valence: 0.3,
      energy: 0.5,
      genres: ['ambient', 'chill', 'classical', 'jazz', 'lofi', 'sleep'],
      keywords: ['rahatlatıcı', 'dinlendirici', 'huzurlu', 'soft', 'sakin', 'yavaş'],
      subEmotions: ['bitkin', 'yorgun', 'uykusuz', 'halsiz'],
      tempo: 'very_slow',
      mood: 'relaxed'
    },
    'stresli': {
      valence: 0.2,
      energy: 0.8,
      genres: ['rock', 'metal', 'punk', 'industrial', 'electronic'],
      keywords: ['güçlü', 'sert', 'dinamik', 'yoğun', 'stres', 'gergin'],
      subEmotions: ['gergin', 'stresli', 'bunalımlı', 'sıkıntılı'],
      tempo: 'fast',
      mood: 'tense'
    },
    'umutlu': {
      valence: 0.8,
      energy: 0.5,
      genres: ['pop', 'dance', 'happy', 'indie', 'folk', 'acoustic'],
      keywords: ['neşeli', 'pozitif', 'eğlenceli', 'umut', 'motivasyon', 'başarı'],
      subEmotions: ['umutlu', 'motivasyonlu', 'hevesli', 'kararlı'],
      tempo: 'medium',
      mood: 'hopeful'
    },
    'romantik': {
      valence: 0.7,
      energy: 0.4,
      genres: ['acoustic', 'ballad', 'sad', 'indie', 'folk', 'piano'],
      keywords: ['hüzünlü', 'duygusal', 'melankolik', 'slow', 'aşk', 'sevda'],
      subEmotions: ['aşık', 'tutkulu', 'duygusal', 'romantik'],
      tempo: 'slow',
      mood: 'romantic'
    }
  };
  return params[emotion] || params['nötr'];
} 