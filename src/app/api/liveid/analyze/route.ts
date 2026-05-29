// =====================================================
// VeriShield Pro - LiveID Analyze API
// Real VLM-powered identity verification analysis
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

    const prompt = `You are LiveID Verify, an advanced identity verification and liveness detection engine for the VeriShield background verification platform. Analyze the provided image for identity verification factors.

Perform the following analysis:

1. **Face Detection**: Is a face visible in the image? Is it clearly visible or partially obstructed?
2. **Image Quality**: Assess the overall image quality (lighting, resolution, focus). Score 0-100.
3. **Liveness Indicators**: Assess whether the image appears to be from a live person (natural lighting, 3D depth, skin texture, eye reflections) vs a printed photo, screen replay, or mask. Score 0-100.
4. **Anti-Spoofing Assessment**: Look for signs of spoofing: printed photos, screen reflections, 3D masks, deepfake artifacts, unusual textures. Score 0-100 where 100 = definitely no spoofing.
5. **Face Match Readiness**: Is the face suitable for biometric matching? (clear frontal view, both eyes visible, neutral expression). Score 0-100.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "faceDetected": true/false,
  "qualityScore": <0-100>,
  "livenessScore": <0-100>,
  "antiSpoofScore": <0-100>,
  "faceMatchScore": <0-100>,
  "assessment": "<2-3 sentence professional assessment of the identity verification result>"
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
        qualityScore: Math.min(100, Math.max(0, Number(parsed.qualityScore) || 0)),
        livenessScore: Math.min(100, Math.max(0, Number(parsed.livenessScore) || 0)),
        antiSpoofScore: Math.min(100, Math.max(0, Number(parsed.antiSpoofScore) || 0)),
        faceMatchScore: Math.min(100, Math.max(0, Number(parsed.faceMatchScore) || 0)),
        assessment: String(parsed.assessment || 'Analysis completed.'),
      });
    } catch {
      // Fallback if JSON parsing fails — return a conservative default
      return NextResponse.json({
        faceDetected: false,
        qualityScore: 30,
        livenessScore: 30,
        antiSpoofScore: 30,
        faceMatchScore: 30,
        assessment: 'AI analysis could not complete full parsing. Manual review recommended.',
      });
    }
  } catch (error) {
    console.error('LiveID Analyze error:', error);
    return NextResponse.json(
      { error: 'Identity verification engine temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
