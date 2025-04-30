'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getRecommendationsByEmotion, getPopularTracks } from '@/lib/youtube';
import type { YouTubeTrack } from '@/lib/youtube';
import { isValidEmotion } from '@/lib/emotions';
import MusicPlayer from '@/components/MusicPlayer';
import Link from 'next/link';
import { saveMoodHistory, saveRecommendation } from '@/lib/models/User';
import { createPlaylist, addPlaylistItem } from '@/lib/models/Playlist';
import type { RecommendationHistory } from '@/lib/models/types';
import { toast } from 'react-hot-toast';

interface Emotion {
  label: string;
  score: number;
}

type MoodMapType = {
  [key: string]: string;
};

// Cümle yapısı için tip tanımlaması
interface SentenceStructures {
  negatives: string[];
  intensifiers: string[];
  time: string[];
  personal: string[];
}

// İlişki bağlamı için tip tanımlaması
interface FamilyContext {
  members: string[];
  events: string[];
  positive: string[];
  concerns: string[];
  responsibilities: string[];
}

interface RelationshipContext {
  keywords: string[];
  negativeEvents: string[];
  emotionalImpact: string[];
  family: FamilyContext;
}

// Film için tip tanımlaması
interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
  director?: string;
  keywords?: string[];
}

interface Track {
  name: string;
  artist: { name: string };
  url: string;
  image: Array<{ '#text': string; size: string }>;
}

interface PlaylistData {
  name: string;
  description: string;
  type: 'music' | 'movie';
  isPublic: boolean;
}

// Film arama parametreleri için tip tanımlaması
interface SearchParams {
  minRating: number;
  sortBy: string;
  yearRange: string;
  keywords: string[];
}

const emotionLabels: { [key: string]: string } = {
  // Temel Duygular
  mutlu: 'Mutlu',
  üzgün: 'Üzgün',
  kızgın: 'Kızgın',
  korku: 'Korkmuş',
  iğrenme: 'İğrenmiş',
  şaşkın: 'Şaşkın',
  // Karmaşık Duygular
  heyecanlı: 'Heyecanlı',
  sakin: 'Sakin',
  endişeli: 'Endişeli',
  güvenli: 'Güvenli',
  umutlu: 'Umutlu',
  umutsuz: 'Umutsuz',
  stresli: 'Stresli',
  rahat: 'Rahat',
  yorgun: 'Yorgun',
  enerjik: 'Enerjik',
  yalnız: 'Yalnız',
  sevgi_dolu: 'Sevgi Dolu',
  nötr: 'Nötr',
  kararsız: 'Kararsız',
  kırgın: 'Kırgın',
  özlem: 'Özlem'
};

// Duygu durumlarını UI mood'larına eşleştiren sabit map
const moodMap: MoodMapType = {
  mutlu: 'happy',
  üzgün: 'sad',
  kızgın: 'focused',
  heyecanlı: 'energetic',
  sakin: 'calm',
  endişeli: 'focused',
  umutlu: 'romantic',
  kırgın: 'sad',
  yalnız: 'sad',
  özlem: 'romantic'
};

// TMDB için yardımcı fonksiyonlar
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// TMDB API için fetch yapılandırması
const fetchTMDBApi = async (endpoint: string, params: Record<string, string | number | boolean> = {}) => {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY || '',
    language: 'tr-TR',
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    )
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`;
  console.log('TMDB API çağrısı:', url);

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TMDB API Hatası: ${response.status} - ${await response.text()}`);
  }

  return response.json();
};

// Ruh haline göre film türleri eşleştirmesi
const moodToGenres: { [key: string]: { yerli: number[], yabanci: number[] } } = {
  happy: {
    yerli: [35, 10751, 16, 10402, 10749], // Komedi, Aile, Animasyon, Müzik, Romantik
    yabanci: [35, 10751, 16, 10402, 10749, 12] // Komedi, Aile, Animasyon, Müzik, Romantik, Macera
  },
  sad: {
    yerli: [18, 10749, 9648, 36], // Drama, Romantik, Gizem, Tarih
    yabanci: [18, 10749, 9648, 36, 14] // Drama, Romantik, Gizem, Tarih, Fantastik
  },
  energetic: {
    yerli: [28, 12, 878, 53, 80], // Aksiyon, Macera, Bilim Kurgu, Gerilim, Suç
    yabanci: [28, 12, 878, 53, 80, 10752] // Aksiyon, Macera, Bilim Kurgu, Gerilim, Suç, Savaş
  },
  calm: {
    yerli: [99, 36, 10402, 9648, 10770], // Belgesel, Tarih, Müzik, Gizem, TV Film
    yabanci: [99, 36, 10402, 9648, 10770, 14] // Belgesel, Tarih, Müzik, Gizem, TV Film, Fantastik
  },
  romantic: {
    yerli: [10749, 35, 18, 10402, 10751], // Romantik, Komedi, Drama, Müzik, Aile
    yabanci: [10749, 35, 18, 10402, 10751, 14] // Romantik, Komedi, Drama, Müzik, Aile, Fantastik
  },
  focused: {
    yerli: [9648, 53, 878, 18, 80], // Gizem, Gerilim, Bilim Kurgu, Drama, Suç
    yabanci: [9648, 53, 878, 18, 80, 10752] // Gizem, Gerilim, Bilim Kurgu, Drama, Suç, Savaş
  },
  angry: {
    yerli: [28, 53, 80, 18, 10752], // Aksiyon, Gerilim, Suç, Drama, Savaş
    yabanci: [28, 53, 80, 18, 10752, 27] // Aksiyon, Gerilim, Suç, Drama, Savaş, Korku
  },
  anxious: {
    yerli: [53, 27, 9648, 18, 80], // Gerilim, Korku, Gizem, Drama, Suç
    yabanci: [53, 27, 9648, 18, 80, 14] // Gerilim, Korku, Gizem, Drama, Suç, Fantastik
  },
  hopeful: {
    yerli: [12, 35, 18, 10751, 10749], // Macera, Komedi, Drama, Aile, Romantik
    yabanci: [12, 35, 18, 10751, 10749, 14] // Macera, Komedi, Drama, Aile, Romantik, Fantastik
  },
  nostalgic: {
    yerli: [18, 10749, 36, 99, 10770], // Drama, Romantik, Tarih, Belgesel, TV Film
    yabanci: [18, 10749, 36, 99, 10770, 14] // Drama, Romantik, Tarih, Belgesel, TV Film, Fantastik
  },
  tired: {
    yerli: [99, 10402, 36, 18, 10770], // Belgesel, Müzik, Tarih, Drama, TV Film
    yabanci: [99, 10402, 36, 18, 10770, 14] // Belgesel, Müzik, Tarih, Drama, TV Film, Fantastik
  },
  stressed: {
    yerli: [53, 18, 9648, 27, 80], // Gerilim, Drama, Gizem, Korku, Suç
    yabanci: [53, 18, 9648, 27, 80, 14] // Gerilim, Drama, Gizem, Korku, Suç, Fantastik
  }
};

// Ruh haline göre film arama parametreleri
const moodToSearchParams: { [key: string]: { yerli: SearchParams, yabanci: SearchParams } } = {
  happy: {
    yerli: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['komedi', 'eğlence', 'mutluluk', 'aile', 'müzik'] },
    yabanci: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['comedy', 'fun', 'happiness', 'family', 'music'] }
  },
  sad: {
    yerli: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['drama', 'hüzün', 'aşk', 'kayıp', 'duygu'] },
    yabanci: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['drama', 'sadness', 'love', 'loss', 'emotion'] }
  },
  energetic: {
    yerli: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2010-2024', keywords: ['aksiyon', 'macera', 'heyecan', 'spor', 'mücadele'] },
    yabanci: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2010-2024', keywords: ['action', 'adventure', 'excitement', 'sports', 'struggle'] }
  },
  calm: {
    yerli: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['huzur', 'doğa', 'meditasyon', 'müzik', 'sanat'] },
    yabanci: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['peace', 'nature', 'meditation', 'music', 'art'] }
  },
  romantic: {
    yerli: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['aşk', 'romantik', 'duygu', 'sevgi', 'tutku'] },
    yabanci: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['love', 'romantic', 'emotion', 'passion', 'romance'] }
  },
  focused: {
    yerli: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['gerilim', 'gizem', 'suç', 'drama', 'psikolojik'] },
    yabanci: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['thriller', 'mystery', 'crime', 'drama', 'psychological'] }
  },
  angry: {
    yerli: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['aksiyon', 'öfke', 'intikam', 'savaş', 'mücadele'] },
    yabanci: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['action', 'anger', 'revenge', 'war', 'struggle'] }
  },
  anxious: {
    yerli: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['gerilim', 'korku', 'gizem', 'psikolojik', 'drama'] },
    yabanci: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['thriller', 'horror', 'mystery', 'psychological', 'drama'] }
  },
  hopeful: {
    yerli: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['umut', 'motivasyon', 'başarı', 'aile', 'macera'] },
    yabanci: { minRating: 7.0, sortBy: 'popularity.desc', yearRange: '2000-2024', keywords: ['hope', 'motivation', 'success', 'family', 'adventure'] }
  },
  nostalgic: {
    yerli: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1970-2024', keywords: ['geçmiş', 'anı', 'tarih', 'drama', 'aile'] },
    yabanci: { minRating: 7.5, sortBy: 'vote_average.desc', yearRange: '1970-2024', keywords: ['past', 'memory', 'history', 'drama', 'family'] }
  },
  tired: {
    yerli: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['huzur', 'müzik', 'doğa', 'drama', 'belgesel'] },
    yabanci: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['peace', 'music', 'nature', 'drama', 'documentary'] }
  },
  stressed: {
    yerli: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['gerilim', 'drama', 'psikolojik', 'gizem', 'suç'] },
    yabanci: { minRating: 7.0, sortBy: 'vote_average.desc', yearRange: '1990-2024', keywords: ['thriller', 'drama', 'psychological', 'mystery', 'crime'] }
  }
};

// Duyguya göre Türkçe anahtar kelime listesi
const turkishEmotionKeywords: { [key: string]: string[] } = {
  mutlu: ['mutlu', 'gül', 'sevinç', 'bahar', 'neşe', 'şanslı', 'iyi', 'başarılı', 'gururlu', 'coşkulu'],
  üzgün: ['üzgün', 'ağla', 'hüzün', 'yalnız', 'ağlamak', 'keder', 'dert', 'yara', 'hasret', 'acı', 'kırgın', 'pişman'],
  kızgın: ['kızgın', 'öfke', 'sinir', 'isyan', 'çıldır', 'bıktım', 'lanet', 'nefret', 'hiddet', 'öfkeli'],
  endişeli: ['endişe', 'kaygı', 'korku', 'tedirgin', 'panik', 'gergin', 'stres', 'bunalım', 'sıkıntı'],
  sakin: ['sakin', 'huzur', 'sessiz', 'dingin', 'rahat', 'yavaş', 'huzurlu', 'dingin', 'sükunet'],
  heyecanlı: ['heyecan', 'coşku', 'ateş', 'hareket', 'enerji', 'dinamik', 'canlı', 'coşkulu'],
  yorgun: ['yorgun', 'bitkin', 'uyku', 'uykusuz', 'dinlen', 'halsiz', 'tükenmiş', 'yıpranmış'],
  stresli: ['stres', 'bunalım', 'gerilim', 'sıkıntı', 'darlık', 'baskı', 'zorlanma', 'yük'],
  umutlu: ['umut', 'motivasyon', 'heves', 'kararlı', 'azimli', 'istekli', 'hevesli'],
  romantik: ['aşk', 'sevda', 'tutku', 'romantik', 'duygusal', 'aşık', 'sevdalı'],
  nostaljik: ['geçmiş', 'anı', 'nostalji', 'hatıra', 'eski', 'dün', 'önceki'],
  kırgın: ['kırgın', 'kırılmış', 'incinmiş', 'üzgün', 'küskün']
};

const DashboardPage = () => {
  const router = useRouter();
  const [currentMood, setCurrentMood] = useState('');
  const [userName, setUserName] = useState('');
  const [userText, setUserText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<YouTubeTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'yerli' | 'yabanci'>('yerli');
  const [selectedTrack, setSelectedTrack] = useState<YouTubeTrack | null>(null);
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationHistory[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newPlaylistData, setNewPlaylistData] = useState<PlaylistData>({
    name: '',
    description: '',
    type: 'music',
    isPublic: false
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth/login');
      } else {
        setUserName(user.displayName || 'Kullanıcı');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const analyzeMood = async () => {
    if (!userText.trim()) return;

    setIsAnalyzing(true);
    setSpotifyError(null);
    try {
      const textLower = userText.toLowerCase();
      let detectedEmotions: Emotion[] = [];

      // İlişki bağlamı tanımlaması
      const relationshipContext: RelationshipContext = {
        keywords: ['sevgili', 'aşk', 'ilişki', 'flört', 'birliktelik', 'evlilik', 'partner', 'eş', 'beraber'],
        negativeEvents: ['ayrıldım', 'ayrıldık', 'terketti', 'bıraktı', 'aldattı', 'kandırdı', 'bitirdik', 'olmaz dedi', 'bitti', 'son'],
        emotionalImpact: ['kalbim', 'yüreğim', 'canım', 'hayatım', 'dünyam', 'aşkım', 'sevgilim', 'özledim', 'özlüyorum'],
        family: {
          members: ['annem', 'babam', 'ablam', 'abim', 'kardeşim', 'dedem', 'babaannem', 'anneannem', 'dayım', 'halam', 'teyzem', 'amcam', 'ailem', 'evladım', 'oğlum', 'kızım'],
          events: ['kavga ettik', 'tartıştık', 'küstük', 'konuşmuyoruz', 'anlaşamıyoruz', 'uzaklaştık', 'ayrı yaşıyoruz', 'barıştık', 'özür diledi'],
          positive: ['barıştık', 'özür diledi', 'sarıldık', 'anlaştık', 'bir araya geldik', 'konuştuk', 'güldük'],
          concerns: ['hasta', 'rahatsız', 'ameliyat', 'hastane', 'tedavi', 'sağlık', 'bakım', 'ilaç', 'doktor'],
          responsibilities: ['bakmak zorundayım', 'ilgilenmem gerek', 'sorumluyum', 'mecburum', 'yükümlüyüm', 'destek olmalıyım']
        }
      };

      // Cümle yapısı analizi için sabitler
      const sentenceStructures: SentenceStructures = {
        negatives: ['değil', 'yok', 'hiç', 'asla', 'olmaz', 'bitti', 'imkansız', 'yapamam', 'edemem', 'başaramam'],
        intensifiers: ['çok', 'aşırı', 'fazla', 'oldukça', 'bayağı', 'epey', 'acayip', 'aşırı', 'sürekli', 'hep', 'kesinlikle', 'kesin'],
        time: ['bugün', 'şimdi', 'şu an', 'demin', 'az önce', 'biraz önce', 'dün', 'geçen', 'hep', 'sürekli', 'her zaman', 'hiçbir zaman'],
        personal: ['benim', 'kendimi', 'bana', 'beni', 'içimde', 'kalbim', 'hayatım', 'vicdanım', 'sorumluluğum', 'düşüncem']
      };

      // Duygu paternleri
      const moodPatterns = {
        üzgün: {
          keywords: ['üzgün', 'kederli', 'hüzünlü', 'ağlıyorum', 'kötü', 'berbat', 'ayrıldım', 'ayrıldık', 'bitti'],
          phrases: ['çok üzgünüm', 'kendimi kötü hissediyorum', 'kalbim kırık', 'içim acıyor', 'ayrıldık', 'terk etti'],
          contexts: ['kayıp', 'ayrılık', 'ölüm', 'hastalık', 'başarısızlık', 'yalnızlık'],
          weight: 1.4
        },
        kızgın: {
          keywords: ['kızgın', 'sinirli', 'öfkeli', 'çıldırıyorum', 'bıktım', 'yeter', 'terketti', 'aldattı'],
          phrases: ['çok kızgınım', 'sinirlerim bozuk', 'tahammülüm kalmadı', 'artık yeter'],
          contexts: ['haksızlık', 'aldatma', 'ihanet', 'saygısızlık', 'kaba'],
          weight: 1.3
        },
        kırgın: {
          keywords: ['kırgın', 'kırıldım', 'incinmiş', 'üzgün', 'küskün', 'darılmış', 'ayrıldık', 'bitti'],
          phrases: ['kalbim kırık', 'çok kırıldım', 'incindim', 'küstüm', 'darıldım'],
          contexts: ['ilişki', 'arkadaş', 'aile', 'saygısızlık', 'haksızlık', 'ayrılık'],
          weight: 1.2
        },
        yorgun: {
          keywords: ['yorgun', 'bitkin', 'halsiz', 'tükenmiş', 'uykusuz'],
          phrases: ['çok yorgunum', 'bitkinim', 'halsizim', 'uykusuzum'],
          contexts: ['çalışma', 'yoğun', 'tempolu', 'zor', 'ağır'],
          weight: 1.0
        },
        stresli: {
          keywords: ['stresli', 'bunalımlı', 'sıkıntılı', 'gergin', 'baskı'],
          phrases: ['stres yapıyorum', 'bunalıma girdim', 'sıkıntılıyım', 'gerginim'],
          contexts: ['iş', 'okul', 'sınav', 'proje', 'deadline'],
          weight: 1.1
        },
        endişeli: {
          keywords: ['endişeli', 'kaygılı', 'tedirgin', 'gergin', 'stresli'],
          phrases: ['çok endişeliyim', 'kaygılanıyorum', 'tedirginim', 'stres yapıyorum'],
          contexts: ['sınav', 'iş', 'gelecek', 'sağlık', 'para'],
          weight: 1.0
        },
        mutlu: {
          keywords: ['mutlu', 'sevinçli', 'neşeli', 'gülümsüyorum', 'harika', 'mükemmel', 'süper'],
          phrases: ['çok mutluyum', 'harika hissediyorum', 'süper bir gün', 'neşeli bir gün'],
          contexts: ['başarı', 'başardım', 'kazandım', 'ödül', 'tebrik', 'kutlama'],
          weight: 1.0
        },
        heyecanlı: {
          keywords: ['heyecanlı', 'coşkulu', 'enerjik', 'dinamik', 'canlı'],
          phrases: ['çok heyecanlıyım', 'coşkulu hissediyorum', 'enerjik hissediyorum'],
          contexts: ['yeni', 'başlangıç', 'değişim', 'macera', 'keşif'],
          weight: 0.9
        }
      };

      // İlişki bağlamı kontrolü
      let relationshipScore = 0;
      let isNegativeContext = false;

      // Negatif olayları kontrol et
      relationshipContext.negativeEvents.forEach(event => {
        if (textLower.includes(event)) {
          relationshipScore += 0.5;
          isNegativeContext = true;
        }
      });

      // İlişki anahtar kelimelerini kontrol et
      relationshipContext.keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          relationshipScore += 0.3;
        }
      });

      // Duygusal etki kelimelerini kontrol et
      relationshipContext.emotionalImpact.forEach(impact => {
        if (textLower.includes(impact)) {
          relationshipScore += 0.2;
        }
      });

      // Duygu analizi
      Object.entries(moodPatterns).forEach(([mood, patterns]) => {
        let score = 0;
        let contextMatches = 0;

        // Anahtar kelime kontrolü
        patterns.keywords.forEach(keyword => {
          if (textLower.includes(keyword)) {
            score += isNegativeContext ? 0.4 : 0.3;
          }
        });

        // Cümle yapısı kontrolü
        patterns.phrases.forEach(phrase => {
          if (textLower.includes(phrase)) {
            score += isNegativeContext ? 0.5 : 0.4;
          }
        });

        // Bağlam kontrolü
        patterns.contexts.forEach(context => {
          if (textLower.includes(context)) {
            contextMatches += isNegativeContext ? 0.3 : 0.2;
          }
        });

        // İlişki bağlamını değerlendir
        if (relationshipScore > 0) {
          if (isNegativeContext && (mood === 'üzgün' || mood === 'kızgın' || mood === 'kırgın')) {
            score *= 1.2;
          } else if (mood === 'mutlu' && isNegativeContext) {
            score *= 0.3; // Negatif bağlamda mutlu skorunu düşür
          }
        }

        // Toplam skor hesaplama (maksimum 1.0 olacak şekilde sınırla)
        let totalScore = (score + contextMatches + relationshipScore) * patterns.weight;
        totalScore = Math.min(totalScore, 1.0); // Maksimum 1.0 ile sınırla

        if (totalScore > 0) {
          detectedEmotions.push({
            label: mood,
            score: totalScore
          });
        }
      });

      // Skorları normalize et (toplam 100 olacak şekilde)
      if (detectedEmotions.length > 0) {
        // Önce tüm skorları topla
        const totalScore = detectedEmotions.reduce((sum, emotion) => sum + emotion.score, 0);
        
        // Her bir skoru yüzdelik değere dönüştür
        detectedEmotions = detectedEmotions.map(emotion => ({
          label: emotion.label,
          score: Math.round((emotion.score / totalScore) * 100)
        }));

        // Yuvarlama hatası nedeniyle toplam 100'ü geçebilir, düzelt
        let total = detectedEmotions.reduce((sum, emotion) => sum + emotion.score, 0);
        if (total > 100) {
          // En yüksek skorlu duygudan fazlalığı çıkar
          const diff = total - 100;
          const maxEmotion = detectedEmotions.reduce((prev, current) => 
            prev.score > current.score ? prev : current
          );
          maxEmotion.score -= diff;
        }

        // En düşük %5'in altındaki duyguları filtrele
        detectedEmotions = detectedEmotions.filter(emotion => emotion.score >= 5);
      }

      // Duyguları skorlarına göre sırala
      detectedEmotions.sort((a, b) => b.score - a.score);

      if (detectedEmotions.length > 0) {
        setEmotions(detectedEmotions);
        const topEmotion = detectedEmotions[0];
        setAnalysisResult(topEmotion.label);
        setCurrentMood(moodMap[topEmotion.label] || 'calm');

        // Film önerilerini güncelle
        await fetchMovieRecommendations(moodMap[topEmotion.label] || 'calm');

        // Müzik önerilerini güncelle
        try {
          const market = contentType === 'yerli' ? 'TR' : 'US';
          if (isValidEmotion(topEmotion.label)) {
            const tracks = await getRecommendationsByEmotion(topEmotion.label, market);
            setRecommendedTracks(tracks);

            // Müzik önerilerini Firestore'a kaydet
            if (auth.currentUser && tracks.length > 0) {
              try {
                await saveRecommendation({
                  userId: auth.currentUser.uid,
                  type: 'music',
                  mood: topEmotion.label,
                  items: tracks.map(track => ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail
                  }))
                });
              } catch (error) {
                console.error('Müzik önerileri kaydı hatası:', error);
              }
            }
          }
        } catch (error) {
          setRecommendedTracks([]);
        }
      } else {
        // Hiç duygu tespit edilemezse, metni genel olarak analiz et
        const generalAnalysis = analyzeGeneralText(textLower);
        setEmotions([{ label: generalAnalysis.mood, score: 1 }]);
        setAnalysisResult(generalAnalysis.mood);
        setCurrentMood(moodMap[generalAnalysis.mood] || 'calm');
      }
    } catch (error) {
      console.error('Duygu analizi hatası:', error);
      setAnalysisResult('Analiz sırasında bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setEmotions([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Genel metin analizi
  const analyzeGeneralText = (text: string): { mood: string } => {
    const patterns = {
      positive: ['iyi', 'güzel', 'hoş', 'başarılı', 'olumlu', 'tamam'],
      negative: ['kötü', 'zor', 'problem', 'sorun', 'sıkıntı'],
      active: ['yapıyorum', 'gidiyorum', 'çalışıyorum', 'uğraşıyorum'],
      passive: ['bekliyorum', 'duruyorum', 'oturuyorum']
    };

    let scores = {
      positive: 0,
      negative: 0,
      active: 0,
      passive: 0
    };

    // Metin içinde pattern kontrolü
    Object.entries(patterns).forEach(([key, words]) => {
      words.forEach(word => {
        if (text.includes(word)) {
          scores[key as keyof typeof scores]++;
        }
      });
    });

    // Genel ruh hali tespiti
    if (scores.positive > scores.negative) {
      return scores.active > scores.passive ? { mood: 'enerjik' } : { mood: 'mutlu' };
    } else if (scores.negative > scores.positive) {
      return scores.active > scores.passive ? { mood: 'endişeli' } : { mood: 'üzgün' };
    } else {
      return scores.active > scores.passive ? { mood: 'heyecanlı' } : { mood: 'sakin' };
    }
  };

  const combineAndNormalizeEmotions = (emotions: Emotion[]): Emotion[] => {
    const combined = emotions.reduce((acc: { [key: string]: number }, emotion) => {
      acc[emotion.label] = (acc[emotion.label] || 0) + emotion.score;
      return acc;
    }, {});

    const total = Object.values(combined).reduce((sum, score) => sum + score, 0);
    return Object.entries(combined)
      .map(([label, score]) => ({
        label,
        score: score / total
      }))
      .sort((a, b) => b.score - a.score);
  };

  const moods = [
    { id: 'happy', name: 'Mutlu', emoji: '😊', description: 'Pozitif ve neşeli içerikler' },
    { id: 'sad', name: 'Üzgün', emoji: '😢', description: 'Duygusal ve sakinleştirici içerikler' },
    { id: 'energetic', name: 'Enerjik', emoji: '⚡', description: 'Dinamik ve motive edici içerikler' },
    { id: 'calm', name: 'Sakin', emoji: '😌', description: 'Rahatlatıcı ve huzur verici içerikler' },
    { id: 'romantic', name: 'Romantik', emoji: '🥰', description: 'Romantik ve duygusal içerikler' },
    { id: 'focused', name: 'Odaklı', emoji: '🎯', description: 'Konsantrasyonu artırıcı içerikler' },
  ];

  // Film önerileri için TMDB API çağrısı
  const fetchMovieRecommendations = async (mood: string) => {
    if (!TMDB_API_KEY) {
      console.error('TMDB API anahtarı bulunamadı!');
      setError('Film önerileri için API anahtarı gerekli.');
      return;
    }

    setIsLoadingMovies(true);
    setError(null);

    try {
      const contentTypeKey = contentType === 'yerli' ? 'yerli' : 'yabanci';
      const genres = moodToGenres[mood][contentTypeKey];
      const { minRating, sortBy, yearRange, keywords } = moodToSearchParams[mood][contentTypeKey];
      const [startYear, endYear] = yearRange.split('-');
      const languageParam = contentType === 'yerli' ? 'tr' : 'en';

      console.log('Film arama parametreleri:', {
        mood,
        contentType,
        genres,
        minRating,
        sortBy,
        yearRange,
        keywords,
        languageParam
      });

      // API parametrelerini oluştur
      const searchParams: Record<string, string | number | boolean> = {
        sort_by: sortBy,
        'vote_average.gte': minRating,
        with_genres: genres.join(','),
        include_adult: false,
        page: 1,
        with_original_language: languageParam,
        'primary_release_date.gte': `${startYear}-01-01`,
        'primary_release_date.lte': `${endYear}-12-31`
      };

      // Yerli film araması için region parametresini ekle
      if (contentType === 'yerli') {
        searchParams.region = 'TR';
      }

      // İlk olarak popüler filmleri al
      const data = await fetchTMDBApi('/discover/movie', searchParams);

      if (!data.results || data.results.length === 0) {
        console.log('Film bulunamadı, daha geniş bir arama yapılıyor...');
        // Eğer film bulunamazsa, kriterleri gevşet
        const fallbackParams: Record<string, string | number | boolean> = {
          sort_by: 'popularity.desc',
          'vote_average.gte': minRating - 1,
          with_genres: genres.slice(0, 2).join(','), // Sadece ilk iki türü kullan
          include_adult: false,
          page: 1,
          with_original_language: languageParam
        };

        const fallbackData = await fetchTMDBApi('/discover/movie', fallbackParams);
        
        if (!fallbackData.results || fallbackData.results.length === 0) {
          throw new Error('Hiç film bulunamadı');
        }
        
        data.results = fallbackData.results;
      }

      const moviesWithDetails = await Promise.all(
        data.results.slice(0, 3).map(async (movie: Movie) => {
          try {
            const details = await fetchTMDBApi(`/movie/${movie.id}`);
            return {
              ...movie,
              runtime: details.runtime,
              director: details.credits?.crew?.find((person: any) => person.job === 'Director')?.name,
              keywords: details.keywords?.keywords?.map((k: { name: string }) => k.name) || []
            };
          } catch (error) {
            console.error(`Film detayları alınamadı (ID: ${movie.id}):`, error);
            return movie;
          }
        })
      );

      if (moviesWithDetails.length === 0) {
        throw new Error('Film önerileri alınamadı');
      }

      setMovies(moviesWithDetails);

      // Film önerilerini Firestore'a kaydet
      if (auth.currentUser && moviesWithDetails.length > 0) {
        try {
          await saveRecommendation({
            userId: auth.currentUser.uid,
            type: 'movie',
            mood: mood,
            items: moviesWithDetails.map(movie => ({
              id: movie.id.toString(),
              title: movie.title,
              overview: movie.overview,
              poster_path: movie.poster_path,
              release_date: movie.release_date,
              vote_average: movie.vote_average,
              keywords: movie.keywords || []
            }))
          });
        } catch (error) {
          console.error('Film önerileri kaydı hatası:', error);
        }
      }
    } catch (error) {
      console.error('Film önerileri alınırken hata oluştu:', error);
      setError('Film önerileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setMovies([]);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  // contentType değiştiğinde önerileri güncelle
  useEffect(() => {
    if (currentMood) {
      fetchMovieRecommendations(currentMood);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  // Duygu analizi sonuçlarına göre müzik önerilerini güncelle
  useEffect(() => {
    const updateRecommendations = async () => {
      try {
        if (emotions.length > 0) {
          const topEmotion = emotions[0].label;
          const market = contentType === 'yerli' ? 'TR' : 'US';
          
          if (isValidEmotion(topEmotion)) {
            const tracks = await getRecommendationsByEmotion(topEmotion, market);
            setRecommendedTracks(tracks);
          }
        }
      } catch (error) {
        console.error('Müzik önerileri alınırken hata:', error);
        setRecommendedTracks([]);
      }
    };

    updateRecommendations();
  }, [emotions, contentType]);

  // Müzik çalma kontrolü için useEffect
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPreview = (trackId: string, previewUrl: string | null) => {
    if (!previewUrl) {
      alert('Bu şarkı için örnek çalma mevcut değil.');
      return;
    }

    if (currentlyPlaying === trackId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play();
      setCurrentlyPlaying(trackId);
    }
  };

  const handleSpotifyConnect = () => {
    // Artık kullanılmıyor
  };

  // Seçili öğeleri listeye ekle
  const selectedRecommendations = recommendationHistory.filter(
    item => selectedItems.includes(item.items[0].id)
  );

  const handleCreatePlaylist = async () => {
    if (!auth.currentUser) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    if (!newPlaylistData.name.trim()) {
      toast.error('Lütfen liste adı girin');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Lütfen en az bir öğe seçin');
      return;
    }

    try {
      console.log('Seçili öğeler:', selectedItems);
      console.log('Öneri geçmişi:', recommendationHistory);

      // Yeni oynatma listesi oluştur
      const playlist = await createPlaylist(auth.currentUser.uid, newPlaylistData);
      console.log('Oluşturulan playlist:', playlist);

      // Seçili öğeleri listeye ekle
      const selectedRecommendations = recommendationHistory.filter(rec => {
        console.log('Kontrol edilen öneri:', rec);
        const hasSelectedItem = rec.items.some(item => selectedItems.includes(item.id));
        console.log('Öğe seçili mi:', hasSelectedItem);
        return hasSelectedItem;
      });

      console.log('Seçilen öneriler:', selectedRecommendations);

      for (const rec of selectedRecommendations) {
        console.log('İşlenen öneri:', rec);
        
        // items dizisinden seçili olan öğeyi bul
        const selectedItem = rec.items.find(item => selectedItems.includes(item.id));
        
        if (!selectedItem) {
          console.error('Seçili öğe bulunamadı:', {
            recommendation: rec,
            selectedItems
          });
          continue;
        }

        console.log('Eklenecek öğe:', selectedItem);

        try {
          await addPlaylistItem(auth.currentUser.uid, playlist.id, {
            id: selectedItem.id,
            title: selectedItem.title,
            artist: selectedItem.artist,
            thumbnail: selectedItem.thumbnail || selectedItem.poster_path,
            type: rec.type,
            addedAt: new Date(),
            details: {
              duration: '',
              releaseDate: selectedItem.release_date,
              rating: selectedItem.vote_average,
            }
          });

          console.log('Öğe başarıyla eklendi');
        } catch (error) {
          console.error('Öğe eklenirken hata:', error);
          toast.error('Bazı öğeler eklenirken hata oluştu');
        }
      }

      toast.success('Oynatma listesi oluşturuldu');
      setShowCreateModal(false);
      setNewPlaylistData({
        name: '',
        description: '',
        type: 'music',
        isPublic: false
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Oynatma listesi oluşturulurken hata:', error);
      toast.error('Oynatma listesi oluşturulurken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-[#010101]">
      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Metin Analizi Bölümü */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-yellow-300 mb-3">
            Nasıl hissettiğini anlat
          </h2>
          <p className="text-zinc-400 mb-6">
            Duygularını yazıya dök, yapay zeka senin ruh halini analiz etsin.
          </p>
          <div className="space-y-4">
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Bugün nasıl hissettiğini birkaç cümle ile anlatır mısın?"
              className="w-full h-32 px-4 py-3 rounded-xl bg-zinc-900/50 border border-yellow-300/20 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-300/50 focus:ring-1 focus:ring-yellow-300/50"
            />
            <div className="flex items-center space-x-4">
              <button
                onClick={analyzeMood}
                disabled={isAnalyzing || !userText.trim()}
                className={`px-6 py-3 rounded-xl text-black font-medium transition-all
                  ${isAnalyzing || !userText.trim()
                    ? 'bg-yellow-300/50 cursor-not-allowed'
                    : 'bg-yellow-300 hover:bg-yellow-400'}`}
              >
                {isAnalyzing ? 'Analiz ediliyor...' : 'Analiz Et'}
              </button>
            </div>
            
            {emotions.length > 0 && (
              <div className="mt-6 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-yellow-300/10">
                <div className="p-4 border-b border-yellow-300/10">
                  <h3 className="text-lg font-semibold text-yellow-300">Duygu Analizi Sonuçları</h3>
                  <p className="mt-1 text-zinc-500 text-xs">En belirgin 8 duygu durumu gösteriliyor</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {emotions.slice(0, 8).map((emotion, index) => (
                    <div 
                      key={emotion.label}
                      className={`relative flex items-center gap-3 p-3 rounded-lg transition-colors
                        ${index === 0 ? 'bg-zinc-800/50 col-span-2' : 'hover:bg-zinc-800/30'}`}
                    >
                      <div className="min-w-[100px]">
                        <div className="text-sm font-medium text-yellow-300/90">
                          {emotionLabels[emotion.label] || emotion.label}
                        </div>
                        <div className="text-xl font-bold text-yellow-300">
                          {(emotion.score * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out
                              ${index === 0 ? 'bg-yellow-300' : 'bg-yellow-300/60'}`}
                            style={{ width: `${emotion.score * 100}%` }}
                          />
                        </div>
                      </div>

                      {index === 0 && (
                        <div className="absolute -right-1 -top-1 bg-yellow-300 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          Baskın
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Ruh Hali Seçici */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-yellow-300 mb-3">
            Bugün nasıl hissediyorsun?
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Ruh haline göre özel olarak seçilmiş müzik ve film önerileri alacaksın.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setCurrentMood(mood.id)}
                className={`relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] border 
                  ${currentMood === mood.id 
                    ? 'bg-zinc-900/80 border-yellow-300/30' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-yellow-300/20'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{mood.emoji}</span>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-1">{mood.name}</h3>
                    <p className="text-zinc-400 text-sm">{mood.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Öneriler */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Müzik Önerileri */}
          <section className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-yellow-300/10">
            <div className="flex items-center justify-between p-6 border-b border-yellow-300/10">
              <h2 className="text-2xl font-bold text-yellow-300 flex items-center">
                <span className="text-3xl mr-3">🎵</span>
                Müzik Önerileri
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yerli' ? 'bg-yellow-300 text-black' : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yerli')}
                >
                  Yerli
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yabanci' ? 'bg-yellow-300 text-black' : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yabanci')}
                >
                  Yabancı
                </button>
              </div>
            </div>
            <div className="divide-y divide-yellow-300/10">
              {recommendedTracks.length > 0 ? (
                recommendedTracks.filter(Boolean).map((track, index) => (
                  <div key={`${track.id}-${index}`} className="p-6 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <img src={track.thumbnail} alt={track.title} className="w-16 h-16 rounded-xl object-cover bg-zinc-800" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-yellow-300 truncate">{track.title}</h3>
                        <p className="text-zinc-400">{track.artist}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedTrack(track)}
                        className="p-3 text-yellow-300 hover:text-yellow-400 transition-colors rounded-full hover:bg-zinc-800"
                        title="Şarkıyı çal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-zinc-400">Şu anda öneri yok. Duygu analizi yaparak öneri alabilirsin.</div>
              )}
            </div>
          </section>

          {/* Film Önerileri */}
          <section className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-yellow-300/10">
            <div className="flex items-center justify-between p-6 border-b border-yellow-300/10">
              <h2 className="text-2xl font-bold text-yellow-300 flex items-center">
                <span className="text-3xl mr-3">🎬</span>
                Film Önerileri
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yerli' ? 'bg-yellow-300 text-black' : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yerli')}
                >
                  Yerli
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yabanci' ? 'bg-yellow-300 text-black' : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yabanci')}
                >
                  Yabancı
                </button>
              </div>
            </div>
            <div className="divide-y divide-yellow-300/10">
              {isLoadingMovies ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-300 mx-auto"></div>
                  <p className="mt-4 text-zinc-400">Film önerileri yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <div className="bg-red-500/10 text-red-500 p-4 rounded-xl max-w-md mx-auto">
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        if (currentMood) fetchMovieRecommendations(currentMood);
                      }}
                      className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                </div>
              ) : movies.length > 0 ? (
                movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="p-6 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-28 relative flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden rounded-xl">
                        {movie.poster_path ? (
                          <Image
                            src={`${POSTER_BASE_URL}${movie.poster_path}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-2xl">🎬</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-yellow-300 truncate">
                          {movie.title}
                        </h3>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-300">
                              {'★'.repeat(Math.round(movie.vote_average / 2))}
                              {'☆'.repeat(5 - Math.round(movie.vote_average / 2))}
                            </span>
                            <span className="text-zinc-500 text-sm">
                              {movie.vote_average.toFixed(1)}/10
                            </span>
                            {movie.release_date && (
                              <span className="text-zinc-500 text-sm">
                                • {new Date(movie.release_date).getFullYear()}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm line-clamp-2">
                            {movie.overview || 'Film açıklaması mevcut değil.'}
                          </p>
                          {movie.keywords && movie.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {movie.keywords.slice(0, 3).map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.themoviedb.org/movie/${movie.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-yellow-300/50 hover:text-yellow-300 transition-colors"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="bg-zinc-800/50 rounded-xl p-8 max-w-md mx-auto">
                    <span className="text-4xl mb-4 block">🎬</span>
                    <p className="text-zinc-400">
                      {currentMood ? 'Ruh halinize uygun film önerileri bulunamadı.' : 'Lütfen bir ruh hali seçin veya duygu analizi yapın.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Müzik Player */}
        <MusicPlayer
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      </main>
    </div>
  );
};

export default DashboardPage; 