import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AIChatMessage } from '../models/ai.model';

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-widget.component.html',
  styleUrl: './ai-chat-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatWidgetComponent implements OnInit {
  isOpen = false;
  messages: AIChatMessage[] = [];
  inputMessage = '';
  isLoading = false;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.messages = [
      {
        role: 'assistant',
        content: 'Hello! I\'m the VeriShield AI assistant. How can I help you with verification, risk analysis, or any other queries?',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.inputMessage.trim() || this.isLoading) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      content: this.inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    this.messages.push(userMsg);
    this.inputMessage = '';
    this.isLoading = true;

    this.apiService.chat(userMsg.content).subscribe({
      next: (response) => {
        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
        });
        this.isLoading = false;
        this.scrollToBottom();
        this.cdr.markForCheck();
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });

    this.scrollToBottom();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}
