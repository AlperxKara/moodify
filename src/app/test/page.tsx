'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function TestPage() {
  useEffect(() => {
    // Firebase bağlantısını test et
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-yellow-300 mb-4">Firebase Test</h1>
        <p className="text-white">Konsolu kontrol edin (F12)</p>
        <pre className="mt-4 p-4 bg-black/30 rounded-lg text-white/80 text-sm">
          {JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 