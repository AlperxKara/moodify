'use client';

import React, { useState, useEffect } from 'react';
import { FaSpotify, FaDeezer, FaYoutube, FaInstagram, FaTwitter, FaUser, FaCrown, FaLink } from 'react-icons/fa';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserProfile, updateUserProfile, updateSocialAccount, createUserProfile } from '@/lib/models/User';
import type { UserProfile, UserPreferences } from '@/lib/models/types';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface SocialAccount {
  platform: string;
  connected: boolean;
  username?: string;
}

interface Subscription {
  name: string;
  status: 'active' | 'inactive' | 'cancelled';
  expiryDate: string;
}

const defaultPreferences: UserPreferences = {
  contentType: 'yerli',
  language: 'tr',
  theme: 'dark',
  notifications: true
};

const defaultSocialAccounts: SocialAccount[] = [
  { platform: 'Spotify', connected: false },
  { platform: 'Deezer', connected: false },
  { platform: 'YouTube', connected: false },
  { platform: 'Instagram', connected: false },
  { platform: 'Twitter', connected: false },
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

const ProfilePage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          // Eksik alanları varsayılan değerlerle doldur
          const updatedProfile = {
            ...profile,
            preferences: {
              ...defaultPreferences,
              ...(profile.preferences || {})
            }
          };
          setProfileData(updatedProfile);
        } else {
          // Profil yoksa yeni profil oluştur
          const newProfile = await createUserProfile(user.uid, {
            name: user.displayName || '',
            email: user.email || '',
          });
          setProfileData(newProfile);
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
        toast.error('Profil bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, router]);

  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    if (!user?.uid || !profileData) return;

    try {
      const updatedProfile = await updateUserProfile(user.uid, {
        ...profileData,
        ...data,
      });

      if (updatedProfile) {
        setProfileData(updatedProfile);
        toast.success('Profil güncellendi');
      }
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      toast.error('Profil güncellenemedi');
    }
  };

  const handleSocialAccountUpdate = async (platform: string, connected: boolean, username?: string) => {
    if (!user?.uid) return;

    try {
      const success = await updateSocialAccount(user.uid, platform, connected, username);
      
      if (success) {
        // Profili yeniden yükle
        const updatedProfile = await getUserProfile(user.uid);
        if (updatedProfile) {
          setProfileData(updatedProfile);
          toast.success(`${platform} hesabı ${connected ? 'bağlandı' : 'bağlantısı kesildi'}`);
        }
      }
    } catch (error) {
      console.error('Sosyal medya hesabı güncellenirken hata:', error);
      toast.error('Sosyal medya hesabı güncellenemedi');
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Spotify': return <FaSpotify className="w-6 h-6" />;
      case 'Deezer': return <FaDeezer className="w-6 h-6" />;
      case 'YouTube': return <FaYoutube className="w-6 h-6" />;
      case 'Instagram': return <FaInstagram className="w-6 h-6" />;
      case 'Twitter': return <FaTwitter className="w-6 h-6" />;
      default: return null;
    }
  };

  const handleSocialAccountToggle = async (account: SocialAccount) => {
    // ... existing code ...
  };

  const renderPreferences = () => {
    if (!profileData?.preferences) return null;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-yellow-300/70">Dil</label>
          <select
            value={profileData.preferences.language}
            onChange={(e) => handleProfileUpdate({
              preferences: {
                ...profileData.preferences,
                language: e.target.value as 'tr' | 'en'
              }
            })}
            className="w-full bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-yellow-300/70">Tema</label>
          <select
            value={profileData.preferences.theme}
            onChange={(e) => handleProfileUpdate({
              preferences: {
                ...profileData.preferences,
                theme: e.target.value as 'dark' | 'light'
              }
            })}
            className="w-full bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
          >
            <option value="dark">Koyu</option>
            <option value="light">Açık</option>
          </select>
        </div>
        <div className="flex items-center bg-purple-900/30 p-4 rounded-xl">
          <input
            type="checkbox"
            checked={profileData.preferences.notifications}
            onChange={(e) => handleProfileUpdate({
              preferences: {
                ...profileData.preferences,
                notifications: e.target.checked
              }
            })}
            className="w-5 h-5 rounded border-purple-700/50 text-yellow-300 focus:ring-yellow-300/20"
          />
          <label className="ml-3 text-sm">Bildirimleri Etkinleştir</label>
        </div>
      </div>
    );
  };

  const renderSubscription = () => {
    if (!profileData) return null;

    const currentPackage = packages.find(pkg => {
      // Subscription name kontrolünü daha detaylı yapalım
      const subscriptionName = profileData.subscription?.name || '';
      return pkg.id === (subscriptionName.toLowerCase() === 'premium' || subscriptionName === 'Premium' ? 'premium' : 'free');
    });

    console.log('Mevcut subscription:', profileData.subscription); // Debug için
    console.log('Seçilen paket:', currentPackage); // Debug için

    // Mevcut sosyal hesapları varsayılan hesaplarla birleştir
    const allAccounts = defaultSocialAccounts.map(defaultAccount => {
      const existingAccount = profileData.socialAccounts?.find(
        acc => acc.platform === defaultAccount.platform
      );
      return existingAccount || defaultAccount;
    });

    return (
      <div className="space-y-8">
        {/* Mevcut Paket Bilgisi */}
        <div className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border border-yellow-300/10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FaCrown className="w-5 h-5 text-yellow-300" />
            Mevcut Paketiniz
          </h2>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-yellow-300">
                {currentPackage?.name || 'Ücretsiz'}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {profileData.subscription?.expiryDate 
                  ? `Bitiş Tarihi: ${new Date(profileData.subscription.expiryDate).toLocaleDateString('tr-TR')}`
                  : 'Süresiz'}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              profileData.subscription?.status === 'active'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {profileData.subscription?.status === 'active' ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="space-y-2">
            {currentPackage?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-zinc-300">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Paket Seçenekleri */}
        <div className="grid gap-6 md:grid-cols-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border transition-all ${
                currentPackage?.id === pkg.id
                  ? 'border-yellow-300/50 shadow-yellow-300/20'
                  : 'border-yellow-300/10 hover:border-yellow-300/30'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-xl font-bold text-yellow-300">{pkg.name}</h4>
                <span className="text-2xl font-bold text-yellow-300">{pkg.price}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-zinc-300">
                    <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              {currentPackage?.id !== pkg.id ? (
                <button
                  onClick={() => handleProfileUpdate({
                    subscription: {
                      name: pkg.id === 'premium' ? 'Premium' : 'Free',
                      status: 'active',
                      expiryDate: pkg.id === 'premium' 
                        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        : new Date(Date.now()).toISOString()
                    }
                  })}
                  className={`w-full px-6 py-3 rounded-xl transition-colors ${
                    pkg.id === 'premium'
                      ? 'bg-yellow-300 hover:bg-yellow-400 text-black font-medium'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {pkg.id === 'premium' ? 'Yükselt' : 'Ücretsiz Plana Geç'}
                </button>
              ) : (
                <div className="w-full px-6 py-3 text-center text-yellow-300 border border-yellow-300/30 rounded-xl">
                  Mevcut Paketiniz
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSocialAccounts = () => {
    if (!profileData) return null;

    // Mevcut sosyal hesapları varsayılan hesaplarla birleştir
    const allAccounts = defaultSocialAccounts.map(defaultAccount => {
      const existingAccount = profileData.socialAccounts?.find(
        acc => acc.platform === defaultAccount.platform
      );
      return existingAccount || defaultAccount;
    });

    return (
      <div className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border border-yellow-300/10">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FaLink className="w-5 h-5 text-yellow-300" />
          Bağlı Hesaplar
        </h2>
        <div className="grid gap-4">
          {allAccounts.map((account) => (
            <div 
              key={account.platform}
              className="group flex items-center justify-between p-6 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-yellow-300/10 hover:border-yellow-300/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  account.connected ? 'bg-yellow-300/20 text-yellow-300' : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {getSocialIcon(account.platform)}
                </div>
                <div>
                  <h3 className="font-medium text-lg text-yellow-300">{account.platform}</h3>
                  {account.connected ? (
                    <p className="text-sm text-yellow-300/70">{account.username || 'Bağlı'}</p>
                  ) : (
                    <p className="text-sm text-zinc-400">Bağlı değil</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSocialAccountUpdate(
                  account.platform,
                  !account.connected,
                  account.connected ? undefined : `user_${Date.now()}`
                )}
                className={`px-6 py-3 rounded-xl transition-all ${
                  account.connected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-zinc-900 text-yellow-300 border border-yellow-300/30 hover:bg-zinc-800'
                }`}
              >
                {account.connected ? 'Bağlantıyı Kes' : 'Bağlan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010101] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-300 border-t-transparent"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-[#010101] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profil Bulunamadı</h1>
          <p className="text-zinc-400">Lütfen daha sonra tekrar deneyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 p-1">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                <FaUser className="w-12 h-12 text-yellow-300" />
              </div>
            </div>
            {profileData.subscription?.status === 'active' && (
              <div className="absolute -top-2 -right-2 bg-yellow-300 text-black rounded-full p-2">
                <FaCrown className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-yellow-300">{profileData.name}</h1>
          <p className="text-zinc-400">{profileData.email}</p>
        </div>

        {/* Sekmeler */}
        <div className="flex justify-center gap-6 mb-12">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeTab === 'profile'
                ? 'bg-yellow-300 text-black shadow-lg shadow-yellow-300/20'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <FaUser className="w-4 h-4" />
            Profil Bilgileri
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeTab === 'subscription'
                ? 'bg-yellow-300 text-black shadow-lg shadow-yellow-300/20'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <FaCrown className="w-4 h-4" />
            Paket Yönetimi
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              activeTab === 'social'
                ? 'bg-yellow-300 text-black shadow-lg shadow-yellow-300/20'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <FaLink className="w-4 h-4" />
            Sosyal Medya
          </button>
        </div>

        {/* Profil Bilgileri */}
        {activeTab === 'profile' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border border-yellow-300/10">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FaUser className="w-5 h-5 text-yellow-300" />
                Kişisel Bilgiler
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-yellow-300/70">Ad Soyad</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileUpdate({ name: e.target.value })}
                    className="w-full bg-zinc-800 border border-yellow-300/20 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all text-white placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-yellow-300/70">E-posta</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileUpdate({ email: e.target.value })}
                    className="w-full bg-zinc-800 border border-yellow-300/20 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all text-white placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border border-yellow-300/10">
              <h2 className="text-xl font-semibold mb-6 text-yellow-300">Tercihler</h2>
              {renderPreferences()}
            </div>
          </div>
        )}

        {/* Paket Yönetimi */}
        {activeTab === 'subscription' && renderSubscription()}

        {/* Sosyal Medya */}
        {activeTab === 'social' && renderSocialAccounts()}
      </div>
    </div>
  );
};

export default ProfilePage; 