// AI Engine Models — CredScan, ForensiDoc, AI Insights, Chat

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'efficiency' | 'compliance' | 'recommendation';
  confidence: number;
  createdAt: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: string;
  factors: RiskFactor[];
  recommendation: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
}

export interface ForensiDocResult {
  tamperDetected: boolean;
  authenticityScore: number;
  findings: ForensiDocFinding[];
  analyzedAt: string;
}

export interface ForensiDocFinding {
  type: string;
  description: string;
  severity: string;
}
