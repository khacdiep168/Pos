import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = 'Hải Đăng', apiUrl = 'http://127.0.0.1:8000/v1' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    const trimmedUrl = apiUrl.replace(/\/+$/, '');
    const endpoint = `${trimmedUrl}/audio/speech`;

    // Attempt to synthesize with VieNeu-TTS server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast response/fallback

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'vieneu-v3-turbo',
          voice: voice,
          input: text,
          response_format: 'wav',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400', // Cache repeated audio clips for instant playback
            'X-TTS-Engine': 'VieNeu-TTS-v3-Turbo',
            'X-TTS-Voice': encodeURIComponent(voice),
          },
        });
      } else {
        const errText = await response.text();
        return NextResponse.json(
          {
            success: false,
            fallback: true,
            error: `VieNeu-TTS responded with status ${response.status}: ${errText}`,
          },
          { status: 200 }
        );
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      // Server unreachable or timed out -> Signal client to fall back to browser Web Speech API
      return NextResponse.json(
        {
          success: false,
          fallback: true,
          message: 'VieNeu-TTS server is offline, falling back to browser Web Speech API',
          detail: fetchErr?.message || 'Connection failed',
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        error: err?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiUrl = (searchParams.get('apiUrl') || 'http://127.0.0.1:8000/v1').replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${apiUrl}/models`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return NextResponse.json({
        online: true,
        engine: 'VieNeu-TTS v3 Turbo (48kHz)',
        apiUrl,
        presetVoices: [
          { id: 'Hải Đăng', label: 'Hải Đăng (Nam - Phát thanh viên, ấm áp - Mặc định)' },
          { id: 'Mai Anh', label: 'Mai Anh (Nữ - Truyền cảm, dịu dàng)' },
          { id: 'Thùy Dung', label: 'Thùy Dung (Nữ - Miền Nam thân thiện)' },
          { id: 'Thiện Minh', label: 'Thiện Minh (Nam - Trầm ấm, dứt khoát)' },
          { id: 'Trúc Ly', label: 'Trúc Ly (Nữ - Tươi vui, nhanh nhẹn)' },
          { id: 'Quang Sơn', label: 'Quang Sơn (Nam - Miền Trung dõng dạc)' },
          { id: 'Ngọc Huyền', label: 'Ngọc Huyền (Nữ - Miền Bắc nhẹ nhàng)' },
          { id: 'Ngọc Trân', label: 'Ngọc Trân (Nữ - Miền Trung trong trẻo)' },
        ],
      });
    }

    return NextResponse.json({ online: false, apiUrl });
  } catch {
    return NextResponse.json({ online: false, apiUrl });
  }
}
