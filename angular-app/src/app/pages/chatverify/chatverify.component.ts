import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ChatVerifySession, ChatVerifyMessage } from '../../models/verification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatverify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatverify.component.html',
  styleUrl: './chatverify.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatVerifyComponent implements OnInit, OnDestroy {
  sessions: ChatVerifySession[] = [];
  selectedSession: ChatVerifySession | null = null;
  messages: ChatVerifyMessage[] = [];
  inputMessage = '';
  loading = true;
  sending = false;
  showNewSession = false;
  newCandidateName = '';
  creatingSession = false;

  private sub = new Subscription();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadSessions();
    }, 0);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadSessions(): void {
    this.loading = true;
    this.sub.add(
      this.apiService.getChatVerifySessions().subscribe({
        next: (sessions: any) => {
          // API now returns ChatVerifySession[] directly
          if (Array.isArray(sessions)) {
            this.sessions = sessions;
          } else {
            // Fallback: unwrap if wrapped
            const raw = sessions?.data?.sessions || sessions?.data || [];
            this.sessions = Array.isArray(raw) ? raw : [];
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.sessions = [];
          this.loading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  selectSession(session: ChatVerifySession): void {
    this.selectedSession = session;
    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.selectedSession) return;
    this.messages = [
      { role: 'system', content: 'Verification session started for ' + this.selectedSession.candidateName, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { role: 'agent', content: 'Hello! I\'m reaching out from VeriShield for employment verification. Could you please confirm your employment at TechCorp India?', timestamp: new Date(Date.now() - 3500000).toISOString() },
      { role: 'candidate', content: 'Yes, I worked at TechCorp India from Jan 2022 to Dec 2023.', timestamp: new Date(Date.now() - 3000000).toISOString() },
      { role: 'agent', content: 'Thank you for confirming. Can you also verify your designation was Senior Software Engineer?', timestamp: new Date(Date.now() - 2500000).toISOString() },
      { role: 'candidate', content: 'That\'s correct. I was a Senior Software Engineer in the Platform team.', timestamp: new Date(Date.now() - 2000000).toISOString() },
      { role: 'agent', content: 'Great! One more question - can you confirm your employee ID was TC-2022-1547?', timestamp: new Date(Date.now() - 1500000).toISOString() },
    ];
  }

  sendMessage(): void {
    if (!this.inputMessage.trim() || !this.selectedSession || this.sending) return;

    const msg = this.inputMessage.trim();
    this.inputMessage = '';
    this.sending = true;

    this.messages.push({
      role: 'agent',
      content: msg,
      timestamp: new Date().toISOString(),
    });

    this.sub.add(
      this.apiService.chatVerifyChat({
        sessionId: this.selectedSession.id,
        message: msg,
      }).subscribe({
        next: (response: any) => {
          // API returns { reply, timestamp } - map to ChatVerifyMessage
          this.messages.push({
            role: 'candidate',
            content: response.reply || response.content || 'Thank you for the message.',
            timestamp: response.timestamp || new Date().toISOString(),
          });
          this.sending = false;
          this.scrollToBottom();
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.push({
            role: 'candidate',
            content: 'Thank you for the message. I\'ll respond shortly.',
            timestamp: new Date().toISOString(),
          });
          this.sending = false;
          this.scrollToBottom();
          this.cdr.markForCheck();
        },
      })
    );

    this.scrollToBottom();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  openNewSessionForm(): void {
    this.showNewSession = true;
  }

  closeNewSessionForm(): void {
    this.showNewSession = false;
    this.newCandidateName = '';
  }

  createSession(): void {
    if (!this.newCandidateName.trim()) return;
    this.creatingSession = true;

    this.sub.add(
      this.apiService.createChatVerifySession({ candidateName: this.newCandidateName }).subscribe({
        next: (newSession: any) => {
          // API now returns ChatVerifySession directly
          const session = newSession?.data || newSession;
          if (session?.id) {
            this.sessions.unshift({
              id: session.id,
              candidateName: session.candidateName || this.newCandidateName,
              status: session.status || 'active',
              createdAt: session.createdAt || new Date().toISOString(),
            });
          }
          this.creatingSession = false;
          this.showNewSession = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.sessions.unshift({
            id: 'cv-' + Date.now(),
            candidateName: this.newCandidateName,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
          this.creatingSession = false;
          this.showNewSession = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  getStatusBadgeClass(status: string): string {
    return `badge badge-${status === 'active' ? 'in_progress' : status}`;
  }

  getVerificationStatus(session: ChatVerifySession): string {
    switch (session.status) {
      case 'active': return 'In Progress';
      case 'completed': return 'Verified';
      case 'pending': return 'Awaiting Response';
      default: return session.status;
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
