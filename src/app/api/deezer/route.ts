import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '10';

  try {
    const response = await fetch(`https://api.deezer.com/search?q=${query}&limit=${limit}&output=json`);
    
    if (!response.ok) {
      throw new Error(`Deezer API hatası: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Deezer API hatası:', error);
    return NextResponse.json(
      { error: 'Deezer API hatası' },
      { status: 500 }
    );
  }
} 