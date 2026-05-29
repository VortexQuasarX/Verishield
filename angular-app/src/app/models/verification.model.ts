// Verification Product Models — ChainSeal, ChatVerify, DeepGuard, LiveID, Nexus

export interface ChainSealRecord {
  id: string;
  hash: string;
  recordType: string;
  sealedAt: string;
  verified: boolean;
  previousHash: string;
}

export interface ChatVerifySession {
  id: string;
  candidateName: string;
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
  lastMessage?: string;
}

export interface ChatVerifyMessage {
  role: 'system' | 'agent' | 'candidate';
  content: string;
  timestamp: string;
}

export interface DeepGuardSession {
  id: string;
  name: string;
  status: 'pending' | 'analyzing' | 'completed';
  createdAt: string;
  deepfakeScore?: number;
  confidence?: number;
}

export interface DeepGuardAnalysis {
  deepfakeScore: number;
  confidence: number;
  frameAnalysis: DeepGuardFrame[];
  recommendation: string;
}

export interface DeepGuardFrame {
  frame: number;
  timestamp: string;
  score: number;
  flag: string;
}

export interface LiveIDVerification {
  id: string;
  candidateName: string;
  matchScore: number;
  livenessScore: number;
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
}

export interface NexusTask {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  logs: NexusTaskLog[];
}

export interface NexusTaskLog {
  timestamp: string;
  message: string;
  level: string;
}
