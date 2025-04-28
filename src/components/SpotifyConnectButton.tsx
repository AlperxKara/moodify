import React from 'react';
import { getSpotifyAuthUrl, checkSpotifyToken, clearSpotifyToken } from '../lib/spotify';

const SpotifyConnectButton: React.FC = () => {
  const isConnected = checkSpotifyToken();

  const handleConnect = () => {
    window.location.href = getSpotifyAuthUrl();
  };

  const handleDisconnect = () => {
    clearSpotifyToken();
    window.location.reload();
  };

  return (
    <div style={{ margin: '16px 0' }}>
      {isConnected ? (
        <>
          <button style={{ background: '#1DB954', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={handleDisconnect}>
            Spotify Bağlantısını Kapat
          </button>
          <span style={{ marginLeft: 12, color: '#1DB954' }}>Spotify bağlı!</span>
        </>
      ) : (
        <button style={{ background: '#1DB954', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={handleConnect}>
          Spotify'a Bağlan
        </button>
      )}
    </div>
  );
};

export default SpotifyConnectButton; 