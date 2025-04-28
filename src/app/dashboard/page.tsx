'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getRecommendationsByEmotion, mapEmotionToMusicParams, setSpotifyToken, clearSpotifyToken, checkSpotifyToken, getSpotifyAuthUrl, getPopularTracks } from '@/lib/spotify';
import type { SpotifyTrack } from '@/lib/spotify';

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
}

interface Track {
  name: string;
  artist: { name: string };
  url: string;
  image: Array<{ '#text': string; size: string }>;
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
    ...params
  });

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`TMDB API Hatası: ${response.status}`);
  }

  return response.json();
};

// Ruh haline göre film türleri eşleştirmesi
const moodToGenres: { [key: string]: number[] } = {
  happy: [35, 10751, 16], // Komedi, Aile, Animasyon
  sad: [18, 10749], // Drama, Romantik
  energetic: [28, 12, 878], // Aksiyon, Macera, Bilim Kurgu
  calm: [99, 36, 10402], // Belgesel, Tarih, Müzik
  romantic: [10749, 35, 18], // Romantik, Komedi, Drama
  focused: [9648, 53, 878] // Gizem, Gerilim, Bilim Kurgu
};

// Ruh haline göre film arama parametreleri
const moodToSearchParams: { [key: string]: { minRating: number, sortBy: string } } = {
  happy: { minRating: 7.0, sortBy: 'popularity.desc' },
  sad: { minRating: 7.5, sortBy: 'vote_average.desc' },
  energetic: { minRating: 7.0, sortBy: 'popularity.desc' },
  calm: { minRating: 7.0, sortBy: 'vote_average.desc' },
  romantic: { minRating: 7.0, sortBy: 'popularity.desc' },
  focused: { minRating: 7.5, sortBy: 'vote_average.desc' }
};

// Duyguya göre Türkçe anahtar kelime listesi
const turkishEmotionKeywords: { [key: string]: string[] } = {
  mutlu: ['mutlu', 'gül', 'sevinç', 'bahar', 'neşe', 'şanslı', 'iyi'],
  üzgün: ['üzgün', 'ağla', 'hüzün', 'yalnız', 'ağlamak', 'keder', 'dert', 'yara', 'hasret', 'acı'],
  kızgın: ['kızgın', 'öfke', 'sinir', 'isyan', 'çıldır', 'bıktım', 'lanet', 'nefret'],
  endişeli: ['endişe', 'kaygı', 'korku', 'tedirgin', 'panik', 'gergin', 'stres'],
  sakin: ['sakin', 'huzur', 'sessiz', 'dingin', 'rahat', 'yavaş'],
  heyecanlı: ['heyecan', 'coşku', 'ateş', 'hareket', 'enerji'],
  yorgun: ['yorgun', 'bitkin', 'uyku', 'uykusuz', 'dinlen'],
  stresli: ['stres', 'bunalım', 'gerilim', 'sıkıntı', 'darlık'],
  // Diğer duygular eklenebilir
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
  const [recommendedTracks, setRecommendedTracks] = useState<SpotifyTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'yerli' | 'yabanci'>('yabanci');

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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash
        .substring(1)
        .split('&')
        .find(elem => elem.startsWith('access_token'))
        ?.split('=')[1];

      if (token) {
        console.log('Spotify token alındı');
        setIsSpotifyConnected(true);
        setSpotifyToken(token);
        setSpotifyError(null);
        window.location.hash = '';
      }
    }

    const isConnected = checkSpotifyToken();
    console.log('Spotify bağlantı durumu:', isConnected);
    setIsSpotifyConnected(isConnected);
  }, []);

  const analyzeMood = async () => {
    if (!userText.trim()) return;

    setIsAnalyzing(true);
    setSpotifyError(null);
    try {
      const textLower = userText.toLowerCase();
      let detectedEmotions: Emotion[] = [];

      // İlişki bağlamı tanımlaması
      const relationshipContext: RelationshipContext = {
        keywords: ['sevgili', 'aşk', 'ilişki', 'flört', 'birliktelik', 'evlilik'],
        negativeEvents: ['terketti', 'ayrıldık', 'bıraktı', 'aldattı', 'kandırdı', 'bitirdik', 'olmaz dedi'],
        emotionalImpact: ['kalbim', 'yüreğim', 'canım', 'hayatım', 'dünyam'],
        family: {
          members: ['annem', 'babam', 'ablam', 'abim', 'kardeşim', 'dedem', 'babaannem', 'anneannem', 'dayım', 'halam', 'teyzem', 'amcam', 'ailem', 'evladım', 'oğlum', 'kızım'],
          events: ['kavga ettik', 'tartıştık', 'küstük', 'konuşmuyoruz', 'anlaşamıyoruz', 'uzaklaştık', 'ayrı yaşıyoruz'],
          positive: ['barıştık', 'özür diledi', 'sarıldık', 'anlaştık', 'bir araya geldik'],
          concerns: ['hasta', 'rahatsız', 'ameliyat', 'hastane', 'tedavi', 'sağlık', 'bakım'],
          responsibilities: ['bakmak zorundayım', 'ilgilenmem gerek', 'sorumluyum', 'mecburum', 'yükümlüyüm']
        }
      };

      // Cümle yapısı analizi için sabitler
      const sentenceStructures: SentenceStructures = {
        negatives: ['değil', 'yok', 'hiç', 'asla', 'olmaz', 'bitti', 'imkansız', 'yapamam', 'edemem'],
        intensifiers: ['çok', 'aşırı', 'fazla', 'oldukça', 'bayağı', 'epey', 'acayip', 'aşırı', 'sürekli', 'hep'],
        time: ['bugün', 'şimdi', 'şu an', 'demin', 'az önce', 'biraz önce', 'dün', 'geçen', 'hep', 'sürekli'],
        personal: ['benim', 'kendimi', 'bana', 'beni', 'içimde', 'kalbim', 'hayatım', 'vicdanım', 'sorumluluğum']
      };

      const moodPatterns = {
        üzgün: {
          keywords: ['üzgün', 'kederli', 'mutsuz', 'kötü', 'üzücü', 'hüzünlü', 'acı', 'ağlamak', 'çaresiz', 'moral', 'ağlıyorum', 'kahroldum', 'mahvoldum', 'perişan', 'çaresizim'],
          phrases: ['kötü hissediyorum', 'moralim bozuk', 'canım sıkkın', 'içim acıyor', 'daralıyorum', 'kendimi kötü', 'çok üzgünüm', 'mahvetti', 'yıkıldım', 'bittim', 'dayanamıyorum'],
          contexts: ['kaybettim', 'özledim', 'başaramadım', 'yalnızım', 'ayrıldık', 'terketti', 'bıraktı', 'vedalaştık', 'gitti', 'olmadı', 'hasta oldu', 'vefat etti'],
          weight: 1.5
        },
        endişeli: {
          keywords: ['endişe', 'kaygı', 'endişeli', 'korku', 'tedirgin', 'kaygılı', 'gergin', 'stres', 'panik', 'korkuyorum', 'tedirginim'],
          phrases: ['endişe ediyorum', 'korkuyorum', 'ya olmazsa', 'emin değilim', 'çok korkuyorum', 'endişeliyim', 'ne yapacağım'],
          contexts: ['sağlık', 'hastalık', 'hastane', 'doktor', 'tedavi', 'ameliyat', 'bakım', 'sorumluluk', 'maddi', 'borç'],
          weight: 1.3
        },
        kızgın: {
          keywords: ['kızgın', 'öfkeli', 'sinirli', 'rahatsız', 'sinirlendim', 'kızdım', 'bıktım', 'nefret', 'kırgın', 'delirdim', 'çıldırdım', 'bunaldım'],
          phrases: ['sinirlerim bozuk', 'çok sinirliyim', 'beni sinirlendiriyor', 'tahammül edemiyorum', 'çok kızgınım', 'delireceğim', 'isyan ediyorum'],
          contexts: ['kavga', 'tartıştık', 'haksızlık', 'saygısızlık', 'anlaşamıyoruz', 'dinlemiyor', 'umursamıyor', 'ilgilenmiyor'],
          weight: 1.3
        },
        suçluluk: {
          keywords: ['suçlu', 'pişman', 'vicdan', 'mahcup', 'utanç', 'rezil', 'mahvettim'],
          phrases: ['kendimi suçlu', 'çok pişmanım', 'keşke yapmasaydım', 'vicdanım rahatsız', 'yüzüne bakamıyorum'],
          contexts: ['hata yaptım', 'kırdım', 'üzdüm', 'yapamadım', 'başaramadım', 'söz vermiştim'],
          weight: 1.2
        },
        // ... diğer duygular devam eder ...
      };

      // Metin analizi
      Object.entries(moodPatterns).forEach(([mood, patterns]) => {
        let score = 0;
        let contextMatches = 0;
        let relationshipImpact = 0;
        let familyImpact = 0;

        // Aile bağlamı kontrolü
        relationshipContext.family.members.forEach((member: string) => {
          if (textLower.includes(member)) familyImpact += 0.6;
        });

        relationshipContext.family.events.forEach((event: string) => {
          if (textLower.includes(event)) familyImpact += 0.8;
        });

        relationshipContext.family.concerns.forEach((concern: string) => {
          if (textLower.includes(concern)) familyImpact += 0.7;
        });

        relationshipContext.family.responsibilities.forEach((resp: string) => {
          if (textLower.includes(resp)) familyImpact += 0.5;
        });

        relationshipContext.family.positive.forEach((pos: string) => {
          if (textLower.includes(pos)) {
            if (mood === 'mutlu' || mood === 'umutlu') {
              familyImpact += 1.0;
            } else {
              familyImpact -= 0.3;
            }
          }
        });

        // Mevcut ilişki bağlamı kontrolü
        relationshipContext.keywords.forEach(keyword => {
          if (textLower.includes(keyword)) relationshipImpact += 0.5;
        });

        relationshipContext.negativeEvents.forEach(event => {
          if (textLower.includes(event)) relationshipImpact += 1.0;
        });

        relationshipContext.emotionalImpact.forEach(impact => {
          if (textLower.includes(impact)) relationshipImpact += 0.3;
        });

        // Kelime kontrolü
        patterns.keywords.forEach(keyword => {
          if (textLower.includes(keyword)) {
            score += 1.0;
            if (textLower.indexOf(keyword) < textLower.length / 3) {
              score += 0.3;
            }
          }
        });

        // Kalıp ifade kontrolü
        patterns.phrases.forEach(phrase => {
          if (textLower.includes(phrase)) {
            score += 1.5;
          }
        });

        // Bağlam kontrolü
        patterns.contexts.forEach(context => {
          if (textLower.includes(context)) {
            contextMatches++;
            score += 0.8;
          }
        });

        if (score > 0 || relationshipImpact > 0 || familyImpact > 0) {
          // Temel ağırlık
          score = (score + relationshipImpact + familyImpact) * patterns.weight;

          // Olumsuzluk kontrolü
          const hasNegative = sentenceStructures.negatives.some((neg: string) => textLower.includes(neg));
          if (hasNegative) {
            if (mood === 'mutlu' || mood === 'enerjik' || mood === 'umutlu') {
              score *= -1;
            } else {
              score *= 1.4;
            }
          }

          // Yoğunluk kontrolü
          const intensifierCount = sentenceStructures.intensifiers.filter((int: string) => textLower.includes(int)).length;
          if (intensifierCount > 0) {
            score *= (1 + (intensifierCount * 0.2));
          }

          // Zaman referansı
          const hasTimeReference = sentenceStructures.time.some((time: string) => textLower.includes(time));
          if (hasTimeReference) score *= 1.2;

          // Kişisel referans
          const personalCount = sentenceStructures.personal.filter((pers: string) => textLower.includes(pers)).length;
          if (personalCount > 0) {
            score *= (1 + (personalCount * 0.15));
          }

          // Bağlam bonus puanı
          if (contextMatches > 1) {
            score *= (1 + (contextMatches * 0.2));
          }

          detectedEmotions.push({
            label: mood,
            score: Math.abs(score) / 10
          });
        }
      });

      if (detectedEmotions.length > 0) {
        const normalizedEmotions = combineAndNormalizeEmotions(detectedEmotions);
        setEmotions(normalizedEmotions);
        const topEmotion = normalizedEmotions[0];
        setAnalysisResult(topEmotion.label);
        setCurrentMood(moodMap[topEmotion.label] || 'calm');
        try {
          // Duyguya göre Spotify parametreleri
          const params = mapEmotionToMusicParams(topEmotion.label);
          // Yerli/Yabancı seçimine göre market belirle
          const market = contentType === 'yerli' ? 'TR' : 'US';
          // Spotify öneri fonksiyonunu market ile çağır
          const tracks = await getRecommendationsByEmotion({ ...params, limit: 3, market });
          setRecommendedTracks(tracks);
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
      console.error('TMDB API anahtarı bulunamadı! Lütfen .env.local dosyasını kontrol edin.');
      return;
    }

    setIsLoadingMovies(true);
    try {
      const genres = moodToGenres[mood];
      const { minRating, sortBy } = moodToSearchParams[mood];
      const languageParam = contentType === 'yerli' ? 'tr' : 'en';
      const data = await fetchTMDBApi('/discover/movie', {
        sort_by: sortBy,
        'vote_average.gte': minRating,
        with_genres: genres.join(','),
        include_adult: false,
        page: 1,
        with_original_language: languageParam
      });

      const moviesWithDetails = await Promise.all(
        data.results.slice(0, 3).map(async (movie: Movie) => {
          try {
            const details = await fetchTMDBApi(`/movie/${movie.id}`);
            return {
              ...movie,
              runtime: details.runtime,
              director: details.credits?.crew?.find((person: any) => person.job === 'Director')?.name
            };
          } catch (error) {
            console.error(`Film detayları alınamadı (ID: ${movie.id}):`, error);
            return movie;
          }
        })
      );

      setMovies(moviesWithDetails);
    } catch (error) {
      console.error('Film önerileri alınırken hata oluştu:', error);
      setMovies([]);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  // Dinamik güncelleme için useEffect ekle:
  // contentType değiştiğinde önerileri güncelle
  useEffect(() => {
    if (emotions.length > 0) {
      // Müzik önerilerini güncelle
      (async () => {
        const topEmotions = emotions.slice(0, 3);
        const allTracks: SpotifyTrack[] = [];
        for (const emotion of topEmotions) {
          try {
            const tracks = await getRecommendationsByEmotion(mapEmotionToMusicParams(emotion.label));
            if (tracks && tracks.length > 0) {
              allTracks.push(...tracks);
            }
          } catch {
            // hata durumunda ekleme yapma
          }
        }
        setRecommendedTracks(allTracks);
      })();
    }
    // Film önerilerini güncelle
    if (currentMood) {
      fetchMovieRecommendations(currentMood);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSpotifyConnect = () => {
    console.log('Spotify bağlantısı başlatılıyor...');
    const authUrl = getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-[#0F0416]">
      {/* Navbar - Spotify butonunu buradan kaldırıyoruz */}
      <nav className="bg-[#1A0826]/50 backdrop-blur-sm border-b border-yellow-200/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-yellow-300">
                Moodify
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-yellow-300/20 border border-yellow-300/30 flex items-center justify-center text-yellow-300">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-yellow-100 font-medium">
                  {userName}
                </span>
              </div>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 text-sm font-medium text-yellow-300 hover:bg-yellow-300/10 rounded-lg transition-colors border border-yellow-300/20"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Spotify Bağlantı Bölümü - Yeni tasarım */}
        {!isSpotifyConnected && (
          <div className="mb-12 bg-[#1A0826]/30 rounded-2xl p-8 border border-yellow-300/10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl font-bold text-yellow-300 mb-2 flex items-center">
                  <i className="fab fa-spotify text-[#1DB954] text-3xl mr-3"></i>
                  Spotify ile Müzik Deneyimini Keşfet
                </h2>
                <p className="text-purple-100/60 max-w-2xl">
                  Duygu analizine göre özel olarak seçilmiş şarkı önerileri almak ve 
                  ruh haline uygun müzikler dinlemek için Spotify hesabını bağla.
                </p>
              </div>
              <button
                onClick={handleSpotifyConnect}
                className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white px-8 py-3 rounded-full transition-all flex items-center group"
              >
                <i className="fab fa-spotify text-2xl mr-3 group-hover:scale-110 transition-transform"></i>
                <span className="font-medium">Spotify ile Bağlan</span>
              </button>
            </div>
          </div>
        )}
        {isSpotifyConnected && (
          <div className="mb-12 bg-[#1A0826]/30 rounded-2xl p-4 border border-[#1DB954]/20">
            <div className="flex items-center text-[#1DB954]">
              <i className="fab fa-spotify text-xl mr-2"></i>
              <span className="font-medium">Spotify Bağlantısı Aktif</span>
            </div>
          </div>
        )}

        {/* Spotify Hata Mesajı */}
        {spotifyError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center text-red-500">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{spotifyError}</span>
            </div>
            <button
              onClick={handleSpotifyConnect}
              className="mt-3 text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              Spotify'a tekrar bağlan
            </button>
          </div>
        )}

        {/* Metin Analizi Bölümü */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-yellow-300 mb-3">
            Nasıl hissettiğini anlat
          </h2>
          <p className="text-purple-100/60 mb-6">
            Duygularını yazıya dök, yapay zeka senin ruh halini analiz etsin.
          </p>
          <div className="space-y-4">
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Bugün nasıl hissettiğini birkaç cümle ile anlatır mısın?"
              className="w-full h-32 px-4 py-3 rounded-xl bg-[#1A0826]/40 border border-yellow-300/20 text-purple-100 placeholder-purple-100/40 focus:outline-none focus:border-yellow-300/50 focus:ring-1 focus:ring-yellow-300/50"
            />
            <div className="flex items-center space-x-4">
              <button
                onClick={analyzeMood}
                disabled={isAnalyzing || !userText.trim()}
                className={`px-6 py-3 rounded-xl text-purple-900 font-medium transition-all
                  ${isAnalyzing || !userText.trim()
                    ? 'bg-yellow-300/50 cursor-not-allowed'
                    : 'bg-yellow-300 hover:bg-yellow-400'}`}
              >
                {isAnalyzing ? 'Analiz ediliyor...' : 'Analiz Et'}
              </button>
            </div>
            {emotions.length > 0 && (
              <div className="mt-6 bg-gradient-to-b from-[#1A0826]/60 to-[#1A0826]/40 backdrop-blur-sm rounded-xl border border-yellow-300/10">
                <div className="p-4 border-b border-yellow-300/10">
                  <h3 className="text-lg font-semibold text-yellow-300">Duygu Analizi Sonuçları</h3>
                  <p className="mt-1 text-purple-100/60 text-xs">En belirgin 8 duygu durumu gösteriliyor</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {emotions.slice(0, 8).map((emotion, index) => (
                    <div 
                      key={emotion.label}
                      className={`relative flex items-center gap-3 p-3 rounded-lg transition-colors
                        ${index === 0 ? 'bg-yellow-300/10 col-span-2' : 'hover:bg-[#1A0826]/40'}`}
                    >
                      <div className="min-w-[100px]">
                        <div className="text-sm font-medium text-yellow-300/90">
                          {emotionLabels[emotion.label] || emotion.label}
                        </div>
                        <div className="text-xl font-bold text-yellow-300">
                          {(emotion.score * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-purple-100/40">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        <div className="h-1.5 bg-purple-900/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out
                              ${index === 0 ? 'bg-yellow-300' : 'bg-yellow-300/60'}`}
                            style={{ width: `${emotion.score * 100}%` }}
                          />
                        </div>
                      </div>

                      {index === 0 && (
                        <div className="absolute -right-1 -top-1 bg-yellow-300 text-purple-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
          <p className="text-purple-100/60 mb-8 text-lg">
            Ruh haline göre özel olarak seçilmiş müzik ve film önerileri alacaksın.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setCurrentMood(mood.id)}
                className={`relative p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] border 
                  ${currentMood === mood.id 
                    ? 'bg-[#1A0826]/60 border-yellow-300/30' 
                    : 'bg-[#1A0826]/30 border-purple-800/30 hover:border-yellow-300/20'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{mood.emoji}</span>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-1">{mood.name}</h3>
                    <p className="text-purple-100/50 text-sm">{mood.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Öneriler */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Müzik Önerileri */}
          <section className="bg-[#1A0826]/40 backdrop-blur-sm rounded-2xl border border-yellow-300/10">
            <div className="flex items-center justify-between p-6 border-b border-yellow-300/10">
              <h2 className="text-2xl font-bold text-yellow-300 flex items-center">
                <span className="text-3xl mr-3">🎵</span>
                Müzik Önerileri
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yerli' ? 'bg-yellow-300 text-purple-900' : 'bg-[#1A0826] text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yerli')}
                >
                  Yerli
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yabanci' ? 'bg-yellow-300 text-purple-900' : 'bg-[#1A0826] text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yabanci')}
                >
                  Yabancı
                </button>
              </div>
            </div>
            <div>
              {recommendedTracks.length > 0 ? (
                recommendedTracks.filter(Boolean).map((track, index) => (
                  <div key={`${track.id}-${index}`} className="p-6 border-b border-yellow-300/10 last:border-0">
                    <div className="flex items-center space-x-4">
                      <img src={track.album.images[0]?.url} alt={track.name} className="w-16 h-16 rounded-xl object-cover bg-yellow-200/5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-yellow-300 truncate">{track.name}</h3>
                        <p className="text-purple-100/60">{track.artists.map(a => a.name).join(', ')}</p>
                      </div>
                      <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="p-2 text-yellow-300/50 hover:text-yellow-300 transition-colors" title="Spotify'da aç">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-purple-100/60">Şu anda öneri yok. Duygu analizi yaparak öneri alabilirsin.</div>
              )}
            </div>
          </section>

          {/* Film Önerileri */}
          <section className="bg-[#1A0826]/40 backdrop-blur-sm rounded-2xl border border-yellow-300/10">
            <div className="flex items-center justify-between p-6 border-b border-yellow-300/10">
              <h2 className="text-2xl font-bold text-yellow-300 flex items-center">
                <span className="text-3xl mr-3">🎬</span>
                Film Önerileri
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yerli' ? 'bg-yellow-300 text-purple-900' : 'bg-[#1A0826] text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yerli')}
                >
                  Yerli
                </button>
                <button
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${contentType === 'yabanci' ? 'bg-yellow-300 text-purple-900' : 'bg-[#1A0826] text-yellow-300 border border-yellow-300/30'}`}
                  onClick={() => setContentType('yabanci')}
                >
                  Yabancı
                </button>
              </div>
            </div>
            <div>
              {isLoadingMovies ? (
                <div className="p-6 text-center text-purple-100/60">
                  Film önerileri yükleniyor...
                </div>
              ) : movies.length > 0 ? (
                movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="p-6 border-b border-yellow-300/10 last:border-0 hover:bg-[#1A0826]/60 transition-colors cursor-pointer group"
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
                          <div className="w-full h-full bg-yellow-200/5 flex items-center justify-center">
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
                            <span className="text-purple-100/40 text-sm">
                              {movie.vote_average.toFixed(1)}/10
                            </span>
                          </div>
                          <p className="text-purple-100/50 text-sm line-clamp-2">
                            {movie.overview || 'Film açıklaması mevcut değil.'}
                          </p>
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
                <div className="p-6 text-center text-purple-100/60">
                  Ruh halinize uygun film önerileri bulunamadı.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 