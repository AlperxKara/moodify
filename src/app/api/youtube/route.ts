import { NextResponse } from 'next/server';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '50';
    const regionCode = searchParams.get('regionCode') || 'TR';

    if (!query) {
      return NextResponse.json({ error: 'Arama sorgusu gerekli' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YouTube API anahtarı bulunamadı!');
      return NextResponse.json(
        { error: 'YouTube API anahtarı yapılandırma hatası' },
        { status: 500 }
      );
    }

    const youtubeParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: limit,
      q: query,
      key: apiKey,
      regionCode: regionCode,
      videoDuration: 'medium',
      videoEmbeddable: 'true'
    });

    const response = await fetch(`${YOUTUBE_API_URL}/search?${youtubeParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API hatası: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('YouTube API hatası:', error);
    return NextResponse.json(
      { error: 'YouTube API hatası oluştu' },
      { status: 500 }
    );
  }
} 