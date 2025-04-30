export interface MoodHistory {
  id: string;
  userId: string;
  text: string;
  mood: string;
  score: number;
  emotions: {
    label: string;
    score: number;
  }[];
  timestamp: Date;
}

export interface UserPreferences {
  contentType: 'yerli' | 'yabanci';
  language: 'tr' | 'en';
  theme: 'dark' | 'light';
  notifications: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  subscription: {
    name: string;
    status: 'active' | 'inactive' | 'cancelled';
    expiryDate: string;
  };
  socialAccounts: {
    platform: string;
    username: string;
    connected: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationHistory {
  id: string;
  userId: string;
  type: 'music' | 'movie';
  mood: string;
  items: {
    id: string;
    title: string;
    artist?: string;
    thumbnail?: string;
    overview?: string;
    poster_path?: string;
    release_date?: string;
    vote_average?: number;
  }[];
  timestamp: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  type: 'music' | 'movie';
  items: PlaylistItem[];
  isPublic: boolean;
  createdAt: Date;
}

export interface PlaylistItem {
  id: string;
  userId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  type: 'music' | 'movie';
  addedAt: Date;
  details?: {
    duration?: string;
    releaseDate?: string;
    rating?: number;
  };
} 