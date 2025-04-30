'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { FaList } from 'react-icons/fa';

const Navbar = () => {
  const auth = useAuth();
  const userName = auth.user?.displayName || auth.user?.email?.split('@')[0] || '';

  if (!auth.user) return null;

  return (
    <nav className="bg-[#010101] border-b border-yellow-300/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard">
              <h1 className="text-3xl font-bold text-yellow-300 font-dancing">
                Moodify
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/playlists" className="flex items-center space-x-2 text-white/90 hover:text-yellow-300 transition-colors">
              <FaList className="w-5 h-5" />
              <span>Listelerim</span>
            </Link>
            <Link href="/profile" className="flex items-center space-x-3 hover:text-yellow-300 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#010101] border border-yellow-300/30 flex items-center justify-center text-yellow-300">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/90 font-medium">
                {userName}
              </span>
            </Link>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 text-sm font-medium text-yellow-300 hover:bg-[#010101] rounded-lg transition-colors border border-yellow-300/20"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 