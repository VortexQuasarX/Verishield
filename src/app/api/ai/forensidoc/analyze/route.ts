// =====================================================
// VeriShield Pro - ForensiDoc Analyze API
// Real VLM-powered document forensic analysis (dedicated endpoint)
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
    const { documentImageBase64, analysisType } = body as {
      documentImageBase64?: string;
      analysisType?: string;
    };

    if (!documentImageBase64 || typeof documentImageBase64 !== 'string') {
      return NextResponse.json(
        {
          error: 'Document image data is required. Please provide a documentImageBase64 parameter.',
          hint: 'Supported formats: JPEG, PNG, WebP. The image should contain a document for forensic analysis.',
        },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const selectedAnalysis = analysisType || 'full_analysis';

    const prompt = `You are ForensiDoc AI, an advanced document forensics and analysis engine for VeriShield background verification platform. Analyze the provided document image thoroughly.

Analysis type: ${selectedAnalysis}

Perform the following analysis:

1. **Document Type Identification**: Identify the type of document (e.g., Government ID, PAN Card, Passport, Driver License, Educational Certificate, Employment Letter, Bank Statement, etc.)

2. **Text Extraction (OCR)**: Extract all visible text from the document accurately.

3. **Data Field Extraction**: Identify and extract key data fields (name, ID number, date of birth, issue date, expiry date, issuing authority, etc.)

4. **Forgery Detection**: Look for signs of tampering, including:
   - Inconsistent fonts or typography
   - Misaligned text or elements
   - Visible editing artifacts
   - Color inconsistencies
   - Blurred or pixelated areas
   - Unnatural shadows or lighting
   - Mismatched security features
   - Digital manipulation indicators

5. **Authenticity Assessment**: Provide an overall authenticity score (0-100).

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "documentType": "<identified document type>",
  "extractedText": "<all visible text from the document>",
  "extractedFields": [
    { "label": "<field name>", "value": "<extracted value>" }
  ],
  "forgeryIndicators": ["<list of forgery/tampering indicators found>"],
  "authenticityScore": <0-100>,
  "assessment": "<2-3 sentence professional assessment>"
}`;

    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: documentImageBase64 },
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
        documentType: String(parsed.documentType || 'Unknown Document'),
        extractedText: String(parsed.extractedText || ''),
        extractedFields: Array.isArray(parsed.extractedFields)
          ? parsed.extractedFields.map((f: Record<string, unknown>) => ({
              label: String(f.label || f.field || 'unknown'),
              value: String(f.value || ''),
            }))
          : [],
        forgeryIndicators: Array.isArray(parsed.forgeryIndicators)
          ? parsed.forgeryIndicators.map((f: unknown) =>
              typeof f === 'string' ? f : String((f as Record<string, unknown>)?.description || (f as Record<string, unknown>)?.type || 'Unknown indicator')
            )
          : [],
        authenticityScore: Math.min(100, Math.max(0, Number(parsed.authenticityScore) || 50)),
        assessment: String(parsed.assessment || parsed.overallAssessment || 'Document analysis completed.'),
      });
    } catch {
      return NextResponse.json({
        documentType: 'Document (Type Pending Review)',
        extractedText: rawResponse.substring(0, 2000),
        extractedFields: [],
        forgeryIndicators: ['Analysis parsing incomplete — manual review recommended'],
        authenticityScore: 50,
        assessment: 'ForensiDoc AI completed partial analysis. The document requires manual review by a verification specialist.',
      });
    }
  } catch (error) {
    console.error('ForensiDoc Analyze error:', error);
    return NextResponse.json(
      { error: 'Document analysis engine temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
