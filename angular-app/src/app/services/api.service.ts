import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AIInsight, AIChatMessage, RiskAnalysis, ForensiDocResult } from '../models/ai.model';
import { ChainSealRecord, ChatVerifySession, ChatVerifyMessage, DeepGuardSession, DeepGuardAnalysis, LiveIDVerification, NexusTask } from '../models/verification.model';
import { PipelineStage, SettingsData, EscalationResult } from '../models/system.model';
import { ActivityLog } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── AI Products ────────────────────────────────────────
  getInsights(stats?: Record<string, unknown>): Observable<{ insights: AIInsight[] }> {
    return this.http.post<{ insights: AIInsight[] }>(`${environment.apiUrl}/ai/insights`, { stats });
  }

  chat(message: string): Observable<{ response: string }> {
    return this.http.post<{ response: string }>(`${environment.apiUrl}/ai/chat`, { message });
  }

  riskAnalysis(data: { candidateName: string; documentType: string }): Observable<RiskAnalysis> {
    return this.http.post<RiskAnalysis>(`${environment.apiUrl}/ai/risk-analysis`, data);
  }

  forensiDoc(data: FormData): Observable<ForensiDocResult> {
    return this.http.post<ForensiDocResult>(`${environment.apiUrl}/ai/forensidoc`, data);
  }

  forensiDocAnalyze(data: { documentId: string }): Observable<ForensiDocResult> {
    return this.http.post<ForensiDocResult>(`${environment.apiUrl}/ai/forensidoc/analyze`, data);
  }

  // ── Verification Products ──────────────────────────────
  getChainSealRecords(): Observable<ChainSealRecord[]> {
    return this.http.get<ChainSealRecord[]>(`${environment.apiUrl}/chainseal`);
  }

  sealChainRecord(data: { recordId: string; recordType: string }): Observable<ChainSealRecord> {
    return this.http.post<ChainSealRecord>(`${environment.apiUrl}/chainseal`, data);
  }

  getChatVerifySessions(): Observable<ChatVerifySession[]> {
    return this.http.get<ChatVerifySession[]>(`${environment.apiUrl}/chatverify/sessions`);
  }

  createChatVerifySession(data: { candidateName: string }): Observable<ChatVerifySession> {
    return this.http.post<ChatVerifySession>(`${environment.apiUrl}/chatverify/sessions`, data);
  }

  chatVerifyChat(data: { sessionId: string; message: string }): Observable<ChatVerifyMessage> {
    return this.http.post<ChatVerifyMessage>(`${environment.apiUrl}/chatverify/chat`, data);
  }

  getDeepGuardSessions(): Observable<DeepGuardSession[]> {
    return this.http.get<DeepGuardSession[]>(`${environment.apiUrl}/deepguard/sessions`);
  }

  createDeepGuardSession(data: { name: string }): Observable<DeepGuardSession> {
    return this.http.post<DeepGuardSession>(`${environment.apiUrl}/deepguard/sessions`, data);
  }

  deepGuardAnalyze(data: { sessionId: string; videoData?: string }): Observable<DeepGuardAnalysis> {
    return this.http.post<DeepGuardAnalysis>(`${environment.apiUrl}/deepguard/analyze`, data);
  }

  liveIdAnalyze(data: { image?: string }): Observable<LiveIDVerification> {
    return this.http.post<LiveIDVerification>(`${environment.apiUrl}/liveid/analyze`, data);
  }

  getLiveIdVerifications(): Observable<LiveIDVerification[]> {
    return this.http.get<LiveIDVerification[]>(`${environment.apiUrl}/liveid/verifications`);
  }

  getNexusTasks(): Observable<NexusTask[]> {
    return this.http.get<NexusTask[]>(`${environment.apiUrl}/nexus/tasks`);
  }

  createNexusTask(data: { name: string; type: string }): Observable<NexusTask> {
    return this.http.post<NexusTask>(`${environment.apiUrl}/nexus/tasks`, data);
  }

  // ── Pipeline ───────────────────────────────────────────
  getPipeline(): Observable<PipelineStage[]> {
    return this.http.get<PipelineStage[]>(`${environment.apiUrl}/dashboard/pipeline`);
  }

  // ── Settings ───────────────────────────────────────────
  getSettings(): Observable<SettingsData> {
    return this.http.get<SettingsData>(`${environment.apiUrl}/settings`);
  }

  updateSettings(data: Partial<SettingsData>): Observable<SettingsData> {
    return this.http.put<SettingsData>(`${environment.apiUrl}/settings`, data);
  }

  // ── Escalation ─────────────────────────────────────────
  checkEscalation(data: { recordId: string }): Observable<EscalationResult> {
    return this.http.post<EscalationResult>(`${environment.apiUrl}/escalation/check`, data);
  }

  // ── Notifications ──────────────────────────────────────
  markNotificationRead(id: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }

  // ── Activity ───────────────────────────────────────────
  getActivity(limit?: number): Observable<ActivityLog[]> {
    const params: Record<string, string> = {};
    if (limit) params['limit'] = String(limit);
    return this.http.get<ActivityLog[]>(`${environment.apiUrl}/activity`, { params });
  }
}
