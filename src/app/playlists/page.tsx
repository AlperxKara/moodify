'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getUserRecommendations } from '@/lib/models/User';
import { createPlaylist, addPlaylistItem, getUserPlaylists } from '@/lib/models/Playlist';
import { FaMusic, FaFilm, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import type { RecommendationHistory, Playlist } from '@/lib/models/types';
import Link from 'next/link';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationHistory[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newPlaylistData, setNewPlaylistData] = useState({
    name: '',
    description: '',
    type: 'music' as 'music' | 'movie',
    isPublic: false
  });

  useEffect(() => {
    if (user) {
      loadPlaylists();
      loadRecommendationHistory();
    }
  }, [user, newPlaylistData.type]);

  const loadPlaylists = async () => {
    try {
      if (!user) return;
      const userPlaylists = await getUserPlaylists(user.uid);
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Oynatma listeleri yüklenirken hata:', error);
      toast.error('Oynatma listeleri yüklenirken bir hata oluştu');
    }
  };

  const loadRecommendationHistory = async () => {
    try {
      if (!user) return;
      setIsLoadingHistory(true);
      const recommendations = await getUserRecommendations(user.uid);
      // Seçilen türe göre önerileri filtrele
      const filteredRecommendations = recommendations.filter(
        rec => rec.type === newPlaylistData.type
      );
      setRecommendationHistory(filteredRecommendations);
      setSelectedItems([]);
    } catch (error) {
      console.error('Geçmiş öneriler yüklenirken hata:', error);
      toast.error('Geçmiş öneriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
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
      // Yeni oynatma listesi oluştur
      const playlist = await createPlaylist(user.uid, newPlaylistData);

      // Seçili öğeleri listeye ekle
      const selectedRecommendations = recommendationHistory.filter(
        item => selectedItems.includes(item.items[0].id)
      );

      for (const rec of selectedRecommendations) {
        const item = rec.items[0];
        await addPlaylistItem(user.uid, playlist.id, {
          id: item.id,
          title: item.title,
          artist: item.artist,
          thumbnail: item.thumbnail || item.poster_path,
          type: rec.type,
          addedAt: new Date(),
          details: {
            duration: '',
            releaseDate: item.release_date,
            rating: item.vote_average,
          }
        });
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
      loadPlaylists(); // Yeni listeyi göstermek için playlistleri yeniden yükle
    } catch (error) {
      console.error('Oynatma listesi oluşturulurken hata:', error);
      toast.error('Oynatma listesi oluşturulurken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-[#010101] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-300">Oynatma Listeleri</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
          >
            Yeni Liste Oluştur
          </button>
        </div>

        {/* Oynatma Listeleri */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMusic className="w-8 h-8 text-yellow-300/50" />
            </div>
            <h2 className="text-xl font-medium text-yellow-300 mb-2">
              Henüz oynatma listeniz yok
            </h2>
            <p className="text-zinc-400">
              Yeni bir liste oluşturarak müzik ve film önerilerinizi kaydedin
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="bg-zinc-900/30 rounded-xl border border-yellow-300/10 p-6 hover:border-yellow-300/30 transition-colors"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
                  {playlist.type === 'music' ? (
                    <FaMusic className="w-6 h-6 text-yellow-300" />
                  ) : (
                    <FaFilm className="w-6 h-6 text-yellow-300" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-yellow-300 mb-1">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="text-sm text-zinc-400 mb-3">{playlist.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span>{playlist.items?.length || 0} öğe</span>
                  {playlist.isPublic && (
                    <>
                      <span>•</span>
                      <span>Herkese açık</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Yeni Liste Oluşturma Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-yellow-300">
                  Yeni Oynatma Listesi
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-1">
                      Liste Adı
                    </label>
                    <input
                      type="text"
                      value={newPlaylistData.name}
                      onChange={(e) => setNewPlaylistData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: En Sevdiğim Şarkılar"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={newPlaylistData.description}
                      onChange={(e) => setNewPlaylistData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Liste hakkında kısa bir açıklama"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-300 h-24"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-300 mb-2">
                      Liste Türü
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setNewPlaylistData(prev => ({ ...prev, type: 'music' }))}
                        className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                          newPlaylistData.type === 'music'
                            ? 'bg-yellow-300 text-black'
                            : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'
                        }`}
                      >
                        <FaMusic />
                        Müzik
                      </button>
                      <button
                        onClick={() => setNewPlaylistData(prev => ({ ...prev, type: 'movie' }))}
                        className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                          newPlaylistData.type === 'movie'
                            ? 'bg-yellow-300 text-black'
                            : 'bg-zinc-800 text-yellow-300 border border-yellow-300/30'
                        }`}
                      >
                        <FaFilm />
                        Film
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newPlaylistData.isPublic}
                      onChange={(e) => setNewPlaylistData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 rounded border-zinc-700 text-yellow-300 focus:ring-yellow-300"
                    />
                    <label htmlFor="isPublic" className="text-sm text-zinc-400">
                      Bu listeyi herkese açık yap
                    </label>
                  </div>
                </div>

                {/* Geçmiş Öneriler */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-yellow-300">
                      Geçmiş Öneriler
                    </h3>
                    <span className="text-sm text-zinc-400">
                      {selectedItems.length} öğe seçildi
                    </span>
                  </div>

                  {isLoadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-300 mx-auto"></div>
                      <p className="mt-4 text-zinc-400">Öneriler yükleniyor...</p>
                    </div>
                  ) : recommendationHistory.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-800/50 rounded-lg">
                      <p className="text-zinc-400">
                        {newPlaylistData.type === 'music'
                          ? 'Henüz müzik önerisi almamışsınız'
                          : 'Henüz film önerisi almamışsınız'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {recommendationHistory.map((rec) => (
                        rec.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleItemSelection(item.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedItems.includes(item.id)
                                ? 'bg-yellow-300/10 border-yellow-300/30'
                                : 'bg-zinc-800/50 border-zinc-700 hover:border-yellow-300/20'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {item.thumbnail || item.poster_path ? (
                                <img
                                  src={item.thumbnail || `https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                                  {rec.type === 'music' ? (
                                    <FaMusic className="w-6 h-6 text-yellow-300" />
                                  ) : (
                                    <FaFilm className="w-6 h-6 text-yellow-300" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">
                                  {item.title}
                                </h4>
                                {item.artist && (
                                  <p className="text-sm text-zinc-400 truncate">
                                    {item.artist}
                                  </p>
                                )}
                              </div>
                              {selectedItems.includes(item.id) && (
                                <FaCheck className="w-5 h-5 text-yellow-300" />
                              )}
                            </div>
                          </div>
                        ))
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistData.name || selectedItems.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    !newPlaylistData.name || selectedItems.length === 0
                      ? 'bg-yellow-300/50 text-black cursor-not-allowed'
                      : 'bg-yellow-300 text-black hover:bg-yellow-400'
                  }`}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 