'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getPlaylist, updatePlaylist, removePlaylistItem } from '@/lib/models/Playlist';
import type { Playlist, PlaylistItem } from '@/lib/models/types';
import Link from 'next/link';
import { FaArrowLeft, FaTrash, FaMusic, FaFilm, FaEdit, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  useEffect(() => {
    if (user && params.id) {
      loadPlaylist();
    }
  }, [user, params.id]);

  const loadPlaylist = async () => {
    try {
      if (!user || !params.id) return;
      
      const data = await getPlaylist(user.uid, params.id);
      if (!data) {
        toast.error('Oynatma listesi bulunamadı');
        router.push('/playlists');
        return;
      }

      setPlaylist(data);
      setEditData({
        name: data.name,
        description: data.description || '',
        isPublic: data.isPublic
      });
    } catch (error) {
      console.error('Oynatma listesi yüklenirken hata:', error);
      toast.error('Oynatma listesi yüklenirken bir hata oluştu');
      router.push('/playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!playlist || !user || !params.id) return;
    if (!confirm('Bu öğeyi listeden kaldırmak istediğinizden emin misiniz?')) return;

    try {
      await removePlaylistItem(user.uid, params.id, itemId);
      await loadPlaylist();
      toast.success('Öğe listeden kaldırıldı');
    } catch (error) {
      console.error('Öğe kaldırılırken hata:', error);
      toast.error('Öğe kaldırılırken bir hata oluştu');
    }
  };

  const handleSaveEdit = async () => {
    if (!playlist || !user || !params.id) return;

    try {
      await updatePlaylist(user.uid, params.id, editData);
      await loadPlaylist();
      setIsEditing(false);
      toast.success('Oynatma listesi güncellendi');
    } catch (error) {
      console.error('Oynatma listesi güncellenirken hata:', error);
      toast.error('Oynatma listesi güncellenirken bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#010101] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-300 mx-auto"></div>
            <p className="mt-4 text-zinc-400">Oynatma listesi yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-[#010101] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/playlists"
            className="flex items-center gap-2 text-yellow-300 hover:text-yellow-400 transition-colors"
          >
            <FaArrowLeft />
            Geri Dön
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-300 text-black rounded-lg hover:bg-yellow-400 transition-colors"
          >
            {isEditing ? (
              <>
                <FaSave />
                Kaydet
              </>
            ) : (
              <>
                <FaEdit />
                Düzenle
              </>
            )}
          </button>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-yellow-300/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            {playlist.type === 'music' ? (
              <FaMusic className="text-yellow-300" />
            ) : (
              <FaFilm className="text-yellow-300" />
            )}
            <span className="text-sm text-yellow-300/70">
              {playlist.type === 'music' ? 'Müzik Listesi' : 'Film Listesi'}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Liste Adı
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-yellow-300/20 rounded-lg text-white focus:outline-none focus:border-yellow-300/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-yellow-300/20 rounded-lg text-white focus:outline-none focus:border-yellow-300/50"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editData.isPublic}
                  onChange={(e) => setEditData({ ...editData, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-yellow-300/20"
                />
                <label htmlFor="isPublic" className="text-sm text-zinc-400">
                  Bu listeyi herkese açık yap
                </label>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-yellow-300 mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-zinc-400">{playlist.description}</p>
              )}
              <div className="mt-4 text-sm text-zinc-500">
                {playlist.isPublic ? 'Herkese Açık Liste' : 'Özel Liste'}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          {playlist.items.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-yellow-300/10">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                {playlist.type === 'music' ? (
                  <FaMusic className="w-8 h-8 text-yellow-300" />
                ) : (
                  <FaFilm className="w-8 h-8 text-yellow-300" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-yellow-300 mb-2">
                Bu liste henüz boş
              </h2>
              <p className="text-zinc-400">
                {playlist.type === 'music'
                  ? 'Müzik önerilerinden beğendiklerinizi bu listeye ekleyebilirsiniz'
                  : 'Film önerilerinden beğendiklerinizi bu listeye ekleyebilirsiniz'}
              </p>
            </div>
          ) : (
            playlist.items.map((item: PlaylistItem) => (
              <div
                key={item.id}
                className="bg-zinc-900/30 rounded-xl border border-yellow-300/10 p-4 flex items-center gap-4"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center">
                    {item.type === 'music' ? (
                      <FaMusic className="w-6 h-6 text-yellow-300" />
                    ) : (
                      <FaFilm className="w-6 h-6 text-yellow-300" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-yellow-300 truncate">
                    {item.title}
                  </h3>
                  {item.artist && (
                    <p className="text-sm text-zinc-400">{item.artist}</p>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 