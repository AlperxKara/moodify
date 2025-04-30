'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';

const musicGenres = [
  'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Klasik', 'R&B',
  'Elektronik', 'Folk', 'Metal', 'Country', 'Blues', 'Reggae',
  'Latin', 'Punk', 'Soul', 'Funk', 'Indie', 'Alternative'
];

const listeningTimes = [
  'Sabah', 'Öğlen', 'Akşam', 'Gece'
];

const ageRanges = [
  '18-24', '25-34', '35-44', '45-54', '55+'
];

const packages = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '0 ₺',
    features: [
      'Günlük 10 öneri hakkı',
      'Temel duygu analizi',
      'Sınırlı müzik ve film önerileri',
      'Reklamsız deneyim'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '49.99 ₺/ay',
    features: [
      'Sınırsız öneri hakkı',
      'Gelişmiş duygu analizi',
      'Özel müzik ve film önerileri',
      'Reklamsız deneyim',
      'Öncelikli destek',
      'Özel temalar',
      'Çevrimdışı erişim'
    ]
  }
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState('TR');
  const [ageRange, setAgeRange] = useState('');
  const [listeningTime, setListeningTime] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenreSelect = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleListeningTimeSelect = (time: string) => {
    if (listeningTime.includes(time)) {
      setListeningTime(listeningTime.filter(t => t !== time));
    } else {
      setListeningTime([...listeningTime, time]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      if (step === 1 && (!email || !password || !username)) {
        setError('Lütfen tüm alanları doldurun');
        return;
      }
      if (step === 2 && selectedGenres.length !== 3) {
        setError('Lütfen 3 müzik türü seçin');
        return;
      }
      if (step === 3 && (!ageRange || listeningTime.length === 0)) {
        setError('Lütfen tüm tercihleri belirtin');
        return;
      }
      if (step === 4 && !selectedPackage) {
        setError('Lütfen bir paket seçin');
        return;
      }
      setError('');
      setStep(step + 1);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: username,
      });
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
        isVip: selectedPackage === 'premium',
        musicPreferences: {
          genres: selectedGenres,
          language: preferredLanguage,
          listeningTime: listeningTime,
        },
        ageRange: ageRange,
        package: selectedPackage,
      });

      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-yellow-300/70 mb-1">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
                placeholder="Kullanıcı adınız"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-yellow-300/70 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
                placeholder="ornek@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-yellow-300/70 mb-1">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/70 mb-4">
              Lütfen en sevdiğiniz 3 müzik türünü seçin ({selectedGenres.length}/3)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {musicGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => handleGenreSelect(genre)}
                  className={`p-3 text-sm rounded-xl transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-yellow-300 text-black'
                      : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                  } ${selectedGenres.length === 3 && !selectedGenres.includes(genre) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-yellow-300/70 mb-2">
                Tercih Ettiğiniz Dil
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('TR')}
                  className={`p-3 text-sm rounded-xl transition-colors ${
                    preferredLanguage === 'TR'
                      ? 'bg-yellow-300 text-black'
                      : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                  }`}
                >
                  Türkçe
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('EN')}
                  className={`p-3 text-sm rounded-xl transition-colors ${
                    preferredLanguage === 'EN'
                      ? 'bg-yellow-300 text-black'
                      : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                  }`}
                >
                  İngilizce
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-300/70 mb-2">
                Yaş Aralığınız
              </label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
              >
                <option value="">Seçiniz</option>
                {ageRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-300/70 mb-2">
                Genellikle ne zaman müzik dinlersiniz?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {listeningTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleListeningTimeSelect(time)}
                    className={`p-3 text-sm rounded-xl transition-colors ${
                      listeningTime.includes(time)
                        ? 'bg-yellow-300 text-black'
                        : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-white/70 mb-4">
              Size en uygun paketi seçin
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPackage === pkg.id
                      ? 'border-yellow-300 bg-yellow-300/10'
                      : 'border-white/10 hover:border-yellow-300/50'
                  }`}
                >
                  {selectedPackage === pkg.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-2xl font-bold text-yellow-300 mb-4">
                    {pkg.price}
                  </p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-white/70">
                        <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sol Panel - Dekoratif Alan */}
      <div className="md:w-1/2 bg-black p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-6">
            Moodify
          </h1>
          <p className="text-xl text-white/90 mb-4">
            Müzik ve film dünyasına katılın
          </p>
          <p className="text-white/70">
            Ruh halinize göre özel olarak seçilmiş içerikleri keşfedin
          </p>
        </div>
      </div>

      {/* Sağ Panel - Kayıt Formu */}
      <div className="md:w-1/2 bg-[#111] p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-300">
              {step === 1 ? 'Hesap Oluştur' : 
               step === 2 ? 'Müzik Tercihleriniz' : 
               step === 3 ? 'Kişisel Tercihleriniz' :
               'Paket Seçimi'}
            </h2>
            <p className="mt-2 text-white/70">
              {step === 1 ? 'Hemen üye olun ve keşfe başlayın' : 
               step === 2 ? 'En sevdiğiniz müzik türlerini seçin' : 
               step === 3 ? 'Son birkaç detay' :
               'Size en uygun paketi seçin'}
            </p>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2 z-0">
              <div className="h-full bg-[#222]">
                <div
                  className="h-full bg-yellow-300 transition-all duration-300"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    stepNumber === step
                      ? 'bg-yellow-300 text-black'
                      : stepNumber < step
                      ? 'bg-yellow-400 text-black'
                      : 'bg-[#222] text-white/50'
                  }`}
                >
                  {stepNumber < step ? '✓' : stepNumber}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStep()}

            <button
              type="submit"
              className="w-full bg-yellow-300 text-black px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {step === 4 ? 'Kaydı Tamamla' : 'Devam Et'}
            </button>

            {step === 1 && (
              <>
                <div className="text-center">
                  <p className="text-sm text-white/70">
                    Zaten hesabınız var mı?{' '}
                    <Link href="/auth/login" className="text-yellow-300 hover:text-yellow-400 transition-colors">
                      Giriş Yap
                    </Link>
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#111] text-white/50">veya</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-white/10 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <FaGoogle className="w-5 h-5 text-red-500" />
                  Google ile Devam Et
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 