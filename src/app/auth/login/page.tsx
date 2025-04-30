'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
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
            Müzik ve film dünyasına hoş geldiniz
          </p>
          <p className="text-white/70">
            Ruh halinize göre özel olarak seçilmiş içeriklerle tanışın
          </p>
        </div>
      </div>

      {/* Sağ Panel - Giriş Formu */}
      <div className="md:w-1/2 bg-[#111] p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-yellow-300 text-center">
              Giriş Yap
            </h2>
            <p className="mt-2 text-center text-white/70">
              Hesabınız yok mu?{' '}
              <Link href="/auth/register" className="text-yellow-300 hover:text-yellow-400 transition-colors">
                Hemen üye olun
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-yellow-300/70 mb-1">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-yellow-300/70 mb-1">
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300/50 focus:ring-2 focus:ring-yellow-300/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-yellow-300 text-black px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Giriş Yap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 