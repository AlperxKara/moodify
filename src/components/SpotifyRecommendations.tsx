import React, { useState } from 'react';
import { getLastFmTopTracks, LastFmTrack } from '../lib/lastfm';

const emotions = [
  'mutlu',
  'üzgün',
  'kızgın',
  'sakin',
  'heyecanlı',
  'endişeli',
  'yorgun',
  'stresli'
];

const LastFmRecommendations: React.FC = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('mutlu');
  const [tracks, setTracks] = useState<LastFmTrack[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);
    setTracks(null);
    try {
      const data = await getLastFmTopTracks(selectedEmotion, 10);
      setTracks(data);
    } catch (err: any) {
      setError(err.message || 'Şarkı önerileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{ marginBottom: 12 }}>
        <label>Duygu seçin: </label>
        <select value={selectedEmotion} onChange={e => setSelectedEmotion(e.target.value)}>
          {emotions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button 
          style={{ 
            marginLeft: 12, 
            background: '#d51007', 
            color: 'white', 
            padding: '6px 16px', 
            border: 'none', 
            borderRadius: 4, 
            cursor: 'pointer' 
          }} 
          onClick={handleGetRecommendations} 
          disabled={loading}
        >
          {loading ? 'Yükleniyor...' : 'Müzik Öner'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {tracks && (
        <div>
          <h4>Last.fm Önerileri:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tracks.map((track, index) => (
              <li key={`${track.name}-${index}`} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                <img 
                  src={track.image[2]?.['#text']} 
                  alt={track.name} 
                  style={{ width: 56, height: 56, borderRadius: 8, marginRight: 12 }} 
                />
                <div>
                  <div><b>{track.name}</b> - {track.artist.name}</div>
                  <a href={track.url} target="_blank" rel="noopener noreferrer">Last.fm'de Aç</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LastFmRecommendations; 