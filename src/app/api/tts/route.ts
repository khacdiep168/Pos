import { NextRequest, NextResponse } from 'next/server';

// In-memory audio cache for repeated announcements (e.g. common orders / table announcements)
const audioCache = new Map<string, { buffer: ArrayBuffer; contentType: string; time: number }>();
const MAX_CACHE_SIZE = 60;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const HF_SPACE_BASE = 'https://pnnbao-ump-vieneu-tts-v3-turbo.hf.space';

/**
 * Synthesize speech via official VieNeu-TTS v3 Turbo Hugging Face Space
 */
async function synthesizeViaHFSpace(text: string, voice: string): Promise<ArrayBuffer | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for cloud generation

  try {
    // 1. Initiate job
    const postRes = await fetch(`${HF_SPACE_BASE}/gradio_api/call/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          text,
          voice,
          null, // ref_audio
          0.8,  // temperature
          25,   // top_k
          0.95, // top_p
          1.2,  // repetition_penalty
          300,  // max_new_frames
          256,  // max_chars
        ],
      }),
      signal: controller.signal,
    });

    if (!postRes.ok) {
      clearTimeout(timeoutId);
      return null;
    }

    const { event_id } = await postRes.json();
    if (!event_id) {
      clearTimeout(timeoutId);
      return null;
    }

    // 2. Await SSE result
    const getRes = await fetch(`${HF_SPACE_BASE}/gradio_api/call/synthesize/${event_id}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!getRes.ok) return null;

    const sseText = await getRes.text();
    const match = sseText.match(/"url":\s*"([^"]+)"/);
    if (!match || !match[1]) return null;

    const audioUrl = match[1];

    // 3. Download the generated WAV audio
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) return null;

    return await audioRes.arrayBuffer();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[VieNeu HF Space] Generation failed or timed out:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = 'Hải Đăng', apiUrl = 'http://127.0.0.1:8000/v1' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    const cacheKey = `${voice}:${text.trim()}`;

    // Check in-memory cache first
    const cached = audioCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400',
          'X-TTS-Engine': 'VieNeu-TTS-v3-Turbo',
          'X-TTS-Provider': 'cache-hit',
          'X-TTS-Voice': encodeURIComponent(voice),
        },
      });
    }

    const trimmedUrl = apiUrl.replace(/\/+$/, '');
    const localEndpoint = `${trimmedUrl}/audio/speech`;

    // 1. Attempt local / custom VieNeu-TTS server first (ultra-fast, 115ms)
    let localSucceeded = false;
    try {
      const localController = new AbortController();
      const localTimeout = setTimeout(() => localController.abort(), 3500);

      const response = await fetch(localEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'vieneu-v3-turbo',
          voice: voice,
          input: text,
          response_format: 'wav',
        }),
        signal: localController.signal,
      });

      clearTimeout(localTimeout);

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        localSucceeded = true;

        // Store in cache
        if (audioCache.size >= MAX_CACHE_SIZE) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, { buffer: audioBuffer, contentType: 'audio/wav', time: Date.now() });

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400',
            'X-TTS-Engine': 'VieNeu-TTS-v3-Turbo',
            'X-TTS-Provider': 'local-server',
            'X-TTS-Voice': encodeURIComponent(voice),
          },
        });
      }
    } catch {
      // Local server unreachable, proceeds to Cloud Hugging Face Space
    }

    // 2. Fallback to official VieNeu-TTS v3 Turbo Cloud Space (works seamlessly on Vercel & Mobile)
    if (!localSucceeded) {
      const cloudBuffer = await synthesizeViaHFSpace(text, voice);
      if (cloudBuffer && cloudBuffer.byteLength > 0) {
        if (audioCache.size >= MAX_CACHE_SIZE) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, { buffer: cloudBuffer, contentType: 'audio/wav', time: Date.now() });

        return new NextResponse(cloudBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=86400',
            'X-TTS-Engine': 'VieNeu-TTS-v3-Turbo',
            'X-TTS-Provider': 'cloud-hf-space',
            'X-TTS-Voice': encodeURIComponent(voice),
          },
        });
      }
    }

    // 3. If both local and cloud fail, signal client to use browser speech synthesis
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        message: 'Tất cả nguồn VieNeu-TTS đều không khả dụng, chuyển sang Web Speech API dự phòng',
      },
      { status: 200 }
    );
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

  const presetVoices = [
    { id: 'Hải Đăng', label: 'Hải Đăng (Nam - Phát thanh viên, ấm áp - Mặc định)' },
    { id: 'Mai Anh', label: 'Mai Anh (Nữ - Truyền cảm, dịu dàng)' },
    { id: 'Thùy Dung', label: 'Thùy Dung (Nữ - Miền Nam thân thiện)' },
    { id: 'Thiện Minh', label: 'Thiện Minh (Nam - Trầm ấm, dứt khoát)' },
    { id: 'Trúc Ly', label: 'Trúc Ly (Nữ - Tươi vui, nhanh nhẹn)' },
    { id: 'Quang Sơn', label: 'Quang Sơn (Nam - Miền Trung dõng dạc)' },
    { id: 'Ngọc Huyền', label: 'Ngọc Huyền (Nữ - Miền Bắc nhẹ nhàng)' },
    { id: 'Ngọc Trân', label: 'Ngọc Trân (Nữ - Miền Trung trong trẻo)' },
  ];

  // 1. Check local server
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return NextResponse.json({
        online: true,
        provider: 'local',
        message: 'Máy chủ VieNeu-TTS cục bộ (Port 8000) đang trực tuyến',
        engine: 'VieNeu-TTS v3 Turbo (48kHz Local)',
        apiUrl,
        presetVoices,
      });
    }
  } catch {
    // Local server not online
  }

  // 2. Check Cloud Hugging Face Space
  try {
    const hfController = new AbortController();
    const hfTimeout = setTimeout(() => hfController.abort(), 2000);

    const hfRes = await fetch(`${HF_SPACE_BASE}/config`, {
      method: 'GET',
      signal: hfController.signal,
    });
    clearTimeout(hfTimeout);

    if (hfRes.ok) {
      return NextResponse.json({
        online: true,
        provider: 'cloud',
        message: 'VieNeu-TTS v3 Turbo AI Cloud (Hugging Face) sẵn sàng',
        engine: 'VieNeu-TTS v3 Turbo (48kHz Cloud)',
        apiUrl: HF_SPACE_BASE,
        presetVoices,
      });
    }
  } catch {
    // Cloud also unreachable
  }

  return NextResponse.json({
    online: false,
    provider: 'none',
    message: 'Chưa phát hiện server VieNeu-TTS. Sẽ sử dụng giọng đọc trình duyệt tự nhiên.',
    apiUrl,
    presetVoices,
  });
}
