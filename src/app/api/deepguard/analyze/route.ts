// =====================================================
// VeriShield Pro - DeepGuard Analyze API
// Real VLM-powered deepfake & interview fraud detection
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getAI, applyDelay } from '@/lib/ai-sdk';

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    await applyDelay(request);

    const body = await request.json();
    const { imageBase64 } = body as { imageBase64?: string };

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required. Please provide an imageBase64 parameter.' },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const prompt = `You are DeepGuard AI, an advanced deepfake detection and interview fraud protection engine for the VeriShield background verification platform. Analyze the provided interview frame image for fraud indicators.

Perform the following analysis:

1. **Face Detection**: Is a face visible? How many faces are detected?
2. **Liveness Assessment**: Is this a live person or a replay/recording? Look for: natural skin texture, 3D depth cues, natural lighting, screen bezels, camera artifacts, printed photo edges. Score 0-100 where 100 = definitely live.
3. **Deepfake Probability**: Look for signs of AI-generated or digitally manipulated faces: unnatural skin smoothing, inconsistent lighting, blurry boundaries around face, unusual eye reflections, artifact around jaw/hairline. Score 0-100 where 100 = definitely NOT deepfake.
4. **Anomaly Detection**: Identify specific anomalies such as:
   - Multiple faces detected (indicates someone else present)
   - Face swap artifacts
   - Screen replay indicators (monitor edges, reflection, moire patterns)
   - Printed photo indicators (flat texture, paper edges)
   - 3D mask indicators (rigid features, mask edges)
   - Background anomalies (unusual or changing background)

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "faceDetected": true/false,
  "faceCount": <number of faces detected>,
  "livenessScore": <0-100>,
  "deepfakeProbability": <0-100 where 100 = NOT deepfake>,
  "anomalies": ["<list of detected anomalies>"],
  "assessment": "<2-3 sentence professional assessment of the fraud risk>"
}`;

    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    try {
      let jsonStr = rawResponse.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return NextResponse.json({
        faceDetected: Boolean(parsed.faceDetected),
        faceCount: Math.max(0, Number(parsed.faceCount) || 0),
        livenessScore: Math.min(100, Math.max(0, Number(parsed.livenessScore) || 0)),
        deepfakeProbability: Math.min(100, Math.max(0, Number(parsed.deepfakeProbability) || 0)),
        anomalies: Array.isArray(parsed.anomalies)
          ? parsed.anomalies.map(String)
          : [],
        assessment: String(parsed.assessment || 'Analysis completed.'),
      });
    } catch {
      return NextResponse.json({
        faceDetected: false,
        faceCount: 0,
        livenessScore: 30,
        deepfakeProbability: 50,
        anomalies: ['Analysis parsing incomplete — manual review recommended'],
        assessment: 'AI analysis could not complete full parsing. Manual review recommended.',
      });
    }
  } catch (error) {
    console.error('DeepGuard Analyze error:', error);
    return NextResponse.json(
      { error: 'Deepfake detection engine temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
