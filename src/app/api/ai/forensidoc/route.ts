// =====================================================
// VeriShield Pro - ForensiDoc AI Document Analysis API
// Real VLM-powered document forensic analysis
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getAI, applyDelay } from '@/lib/ai-sdk';

interface ForgeryIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  confidence: number;
}

interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
}

interface DocumentAnalysisResult {
  documentType: string;
  documentCategory: string;
  extractedText: string;
  extractedFields: ExtractedField[];
  forgeryIndicators: ForgeryIndicator[];
  authenticityScore: number;
  overallAssessment: string;
  analysisType: string;
  analyzedAt: string;
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    await applyDelay(request);

    const body = await request.json();
    const { documentImageUrl, analysisType } = body as {
      documentImageUrl?: string;
      analysisType?: string;
    };

    if (!documentImageUrl || typeof documentImageUrl !== 'string') {
      return NextResponse.json(
        {
          error:
            'Document image URL is required. Please provide a documentImageUrl parameter with a valid image URL.',
          hint: 'Supported formats: JPEG, PNG, WebP. The image should contain a document for forensic analysis.',
        },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const selectedAnalysis = analysisType || 'comprehensive';

    const textPrompt = `You are ForensiDoc AI, an advanced document forensics and analysis engine for VeriShield background verification platform. Analyze the provided document image thoroughly.

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
  "documentCategory": "<identity|education|employment|financial|legal|other>",
  "extractedText": "<all visible text from the document>",
  "extractedFields": [
    { "field": "<field name>", "value": "<extracted value>", "confidence": <0-100> }
  ],
  "forgeryIndicators": [
    { "type": "<indicator type>", "severity": "<low|medium|high|critical>", "description": "<what was detected>", "location": "<where on the document>", "confidence": <0-100> }
  ],
  "authenticityScore": <0-100>,
  "overallAssessment": "<2-3 sentence professional assessment>"
}`;

    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            {
              type: 'image_url',
              image_url: { url: documentImageUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Parse the VLM response as JSON
    let analysisResult: DocumentAnalysisResult;
    try {
      let jsonStr = rawResponse.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      analysisResult = {
        documentType: String(parsed.documentType || 'Unknown Document'),
        documentCategory: String(parsed.documentCategory || 'other'),
        extractedText: String(parsed.extractedText || ''),
        extractedFields: Array.isArray(parsed.extractedFields)
          ? parsed.extractedFields.map((f: Record<string, unknown>) => ({
              field: String(f.field || 'unknown'),
              value: String(f.value || ''),
              confidence: Math.min(100, Math.max(0, Number(f.confidence) || 0)),
            }))
          : [],
        forgeryIndicators: Array.isArray(parsed.forgeryIndicators)
          ? parsed.forgeryIndicators.map((f: Record<string, unknown>) => ({
              type: String(f.type || 'unknown'),
              severity: ['low', 'medium', 'high', 'critical'].includes(
                String(f.severity)
              )
                ? String(f.severity)
                : 'medium',
              description: String(f.description || 'No description'),
              location: String(f.location || 'Unspecified'),
              confidence: Math.min(100, Math.max(0, Number(f.confidence) || 0)),
            }))
          : [],
        authenticityScore: Math.min(
          100,
          Math.max(0, Number(parsed.authenticityScore) || 50)
        ),
        overallAssessment: String(
          parsed.overallAssessment || 'Document analysis completed.'
        ),
        analysisType: selectedAnalysis,
        analyzedAt: new Date().toISOString(),
      };
    } catch {
      // Fallback if JSON parsing fails
      analysisResult = {
        documentType: 'Document (Type Pending Further Review)',
        documentCategory: 'other',
        extractedText: rawResponse.substring(0, 2000),
        extractedFields: [],
        forgeryIndicators: [
          {
            type: 'analysis_incomplete',
            severity: 'medium',
            description:
              'Automated forensic analysis could not complete full JSON parsing. Manual review recommended.',
            location: 'Full document',
            confidence: 40,
          },
        ],
        authenticityScore: 50,
        overallAssessment:
          'ForensiDoc AI completed partial analysis. The document requires manual review by a verification specialist to confirm authenticity and extract all data fields.',
        analysisType: selectedAnalysis,
        analyzedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('ForensiDoc AI Document Analysis error:', error);
    return NextResponse.json(
      {
        error:
          'Document analysis engine temporarily unavailable. Please try again.',
      },
      { status: 500 }
    );
  }
}
