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
      <div className="md:w-1/2 bg-gradient-to-br from-purple-900 to-purple-700 p-8 flex items-center justify-center">
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
      <div className="md:w-1/2 bg-white dark:bg-gray-900 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Giriş Yap
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Hesabınıza erişin
            </p>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg focus:border-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-0 text-gray-900 dark:text-white"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg focus:border-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-0 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Giriş Yap
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hesabınız yok mu?{' '}
                <Link href="/auth/register" className="font-medium text-purple-600 hover:text-purple-500">
                  Kayıt Ol
                </Link>
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">veya</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-[#1DB954] hover:bg-[#1ed760] transition-colors"
              >
                Spotify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 