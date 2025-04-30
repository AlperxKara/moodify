import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || 'ba158563d9364b2a95e3e59154f6fc72';
  const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET || '53bebceaa61d4c49a2aeee7dc5076e25';
  const redirect_uri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/spotify';

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  return NextResponse.json(data);
} 