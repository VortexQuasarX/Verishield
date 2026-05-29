import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NexusTask } from '../../models/verification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nexus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nexus.component.html',
  styleUrl: './nexus.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NexusComponent implements OnInit, OnDestroy {
  tasks: NexusTask[] = [];
  loading = true;
  agentStatus: 'active' | 'idle' = 'idle';
  showNewTaskForm = false;
  newTaskName = '';
  newTaskType = 'verification';
  creatingTask = false;
  selectedTask: NexusTask | null = null;

  taskTypes = [
    { value: 'verification', label: 'Verification Pipeline' },
    { value: 'risk_analysis', label: 'Risk Analysis' },
    { value: 'document_check', label: 'Document Check' },
    { value: 'compliance_scan', label: 'Compliance Scan' },
    { value: 'bulk_process', label: 'Bulk Processing' },
  ];

  private sub = new Subscription();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadTasks(): void {
    this.loading = true;
    this.sub.add(
      this.apiService.getNexusTasks().subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.loading = false;
          this.updateAgentStatus();
          this.cdr.markForCheck();
        },
        error: () => {
          this.tasks = this.getMockTasks();
          this.loading = false;
          this.updateAgentStatus();
          this.cdr.markForCheck();
        },
      })
    );
  }

  getMockTasks(): NexusTask[] {
    return [
      {
        id: 'task-001',
        name: 'Employment Verification Batch',
        type: 'verification',
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 1800000).toISOString(),
        logs: [
          { timestamp: new Date(Date.now() - 3600000).toISOString(), message: 'Task initiated', level: 'info' },
          { timestamp: new Date(Date.now() - 2700000).toISOString(), message: 'Processing 15 records', level: 'info' },
          { timestamp: new Date(Date.now() - 1800000).toISOString(), message: 'All records verified successfully', level: 'success' },
        ],
      },
      {
        id: 'task-002',
        name: 'Risk Analysis - Q1 Pipeline',
        type: 'risk_analysis',
        status: 'running',
        progress: 67,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        logs: [
          { timestamp: new Date(Date.now() - 1800000).toISOString(), message: 'Task initiated', level: 'info' },
          { timestamp: new Date(Date.now() - 900000).toISOString(), message: 'Analyzing 48 records', level: 'info' },
          { timestamp: new Date(Date.now() - 300000).toISOString(), message: '3 high-risk flags detected', level: 'warning' },
        ],
      },
      {
        id: 'task-003',
        name: 'Compliance Scan - DPDP',
        type: 'compliance_scan',
        status: 'pending',
        progress: 0,
        createdAt: new Date(Date.now() - 600000).toISOString(),
        logs: [
          { timestamp: new Date(Date.now() - 600000).toISOString(), message: 'Task queued', level: 'info' },
        ],
      },
    ];
  }

  updateAgentStatus(): void {
    this.agentStatus = this.tasks.some(t => t.status === 'running') ? 'active' : 'idle';
  }

  openNewTaskForm(): void {
    this.showNewTaskForm = true;
  }

  closeNewTaskForm(): void {
    this.showNewTaskForm = false;
    this.newTaskName = '';
    this.newTaskType = 'verification';
  }

  createTask(): void {
    if (!this.newTaskName.trim()) return;
    this.creatingTask = true;

    this.sub.add(
      this.apiService.createNexusTask({
        name: this.newTaskName,
        type: this.newTaskType,
      }).subscribe({
        next: () => {
          this.creatingTask = false;
          this.showNewTaskForm = false;
          this.loadTasks();
          this.cdr.markForCheck();
        },
        error: () => {
          const newTask: NexusTask = {
            id: 'task-' + Date.now(),
            name: this.newTaskName,
            type: this.newTaskType,
            status: 'running',
            progress: 0,
            createdAt: new Date().toISOString(),
            logs: [{ timestamp: new Date().toISOString(), message: 'Task initiated', level: 'info' }],
          };
          this.tasks.unshift(newTask);
          this.creatingTask = false;
          this.showNewTaskForm = false;
          this.updateAgentStatus();
          this.cdr.markForCheck();
        },
      })
    );
  }

  selectTask(task: NexusTask): void {
    this.selectedTask = this.selectedTask?.id === task.id ? null : task;
  }

  getStatusBadgeClass(status: string): string {
    return `badge badge-${status}`;
  }

  getLogLevelClass(level: string): string {
    return `log-${level}`;
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  getTaskTypeLabel(type: string): string {
    const found = this.taskTypes.find(t => t.value === type);
    return found ? found.label : type;
  }
}
