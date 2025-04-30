import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <div className="bg-[#111] border-b border-white/10 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-300 font-dancing">
            Moodify
          </h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Ruh Halinize Göre<br />
              <span className="text-yellow-300">Müzik ve Film</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Moodify ile ruh halinize uygun içerikler keşfedin, benzer ruh halindeki kullanıcılarla bağlantı kurun ve kişiselleştirilmiş öneriler alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/login"
                className="bg-yellow-300 text-black px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="bg-transparent border-2 border-yellow-300 text-yellow-300 px-8 py-4 rounded-full font-semibold hover:bg-yellow-300/10 transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>
          <div className="relative h-[500px] hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 to-black rounded-3xl backdrop-blur-sm">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-yellow-300/10 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#111]/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-yellow-300 text-center mb-12">Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#111]/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-[#222]/50 transition-all border border-yellow-300/20">
              <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0a0118]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Ruh Hali Analizi</h3>
              <p className="text-white/80">Gelişmiş algoritmalar ile ruh halinizi analiz edin ve size özel içerikler keşfedin.</p>
            </div>
            <div className="bg-[#111]/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-[#222]/50 transition-all border border-yellow-300/20">
              <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0a0118]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Sosyal Eşleştirme</h3>
              <p className="text-white/80">Benzer ruh halindeki kullanıcılarla bağlantı kurun ve içeriklerinizi paylaşın.</p>
            </div>
            <div className="bg-[#111]/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-[#222]/50 transition-all border border-yellow-300/20">
              <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0a0118]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Kişiselleştirilmiş İçerik</h3>
              <p className="text-white/80">Spotify ve Netflix entegrasyonu ile size özel oynatma listeleri oluşturun.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-yellow-300 text-center mb-12">Nasıl Çalışır?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0a0118]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Hesap Oluştur</h3>
              <p className="text-white/80">Hızlı ve kolay bir şekilde hesabınızı oluşturun.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0a0118]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Ruh Halinizi Seçin</h3>
              <p className="text-white/80">Günlük ruh halinizi belirleyin ve analiz edin.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0a0118]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">İçerik Keşfedin</h3>
              <p className="text-white/80">Size özel müzik ve film önerileri alın.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0a0118]">4</span>
              </div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-2">Bağlantı Kurun</h3>
              <p className="text-white/80">Benzer ruh halindeki kullanıcılarla tanışın.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features Section */}
      <div className="bg-[#111]/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-yellow-300 text-center mb-12">Premium Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#111]/50 backdrop-blur-sm p-8 rounded-2xl border border-yellow-300/20">
              <h3 className="text-2xl font-bold text-yellow-300 mb-4">Ücretsiz Plan</h3>
              <ul className="space-y-4 text-white/80">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Temel ruh hali analizi
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sınırlı içerik önerileri
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Temel eşleştirme
                </li>
              </ul>
            </div>
            <div className="bg-[#111]/50 backdrop-blur-sm p-8 rounded-2xl border-2 border-yellow-300">
              <h3 className="text-2xl font-bold text-yellow-300 mb-4">Premium Plan</h3>
              <ul className="space-y-4 text-white/80">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Gelişmiş ruh hali analizi
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sınırsız içerik önerileri
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Öncelikli eşleştirme
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Özel oynatma listeleri
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-yellow-300 mb-8">Hemen Başlayın</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Ruh halinize göre kişiselleştirilmiş içerikler keşfetmek için hemen ücretsiz hesap oluşturun.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-yellow-300 text-black px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Ücretsiz Hesap Oluştur
          </Link>
        </div>
      </div>
    </main>
  );
}
