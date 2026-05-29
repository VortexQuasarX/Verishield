// System Models — Pipeline, Settings, Activity, Escalation

export interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
}

export interface SettingsData {
  defaultTurnaround: string;
  autoEscalation: boolean;
  apiKey: string;
  webhookUrl: string;
  emailAlerts: boolean;
  autoSealRecords: boolean;
}

export interface ActivityEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  category: string;
  details: string;
}

export interface EscalationResult {
  escalated: boolean;
  reason?: string;
}
