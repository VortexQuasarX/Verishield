import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private router = inject(Router);

  mobileMenuOpen = false;

  navLinks = [
    { label: 'Features', anchor: 'features' },
    { label: 'AI Products', anchor: 'products' },
    { label: 'Security', anchor: 'how-it-works' },
  ];

  features = [
    { icon: '🛡️', title: 'Real-time Risk Scoring', desc: 'Advanced ML models analyze verification data in real-time to predict risk levels with 99.7% accuracy across all check types.' },
    { icon: '🔍', title: 'Document Forensics', desc: 'AI-powered tamper detection engine that identifies forged documents, manipulated images, and fraudulent credentials instantly.' },
    { icon: '🔗', title: 'Blockchain Audit Trail', desc: 'Every verification cryptographically sealed on-chain, ensuring tamper-proof immutable records with complete audit history.' },
    { icon: '📷', title: 'Identity Liveness', desc: 'Real-time liveness detection and biometric verification powered by multi-frame analysis and deepfake resistance technology.' },
    { icon: '💬', title: 'Candidate Chat Assist', desc: 'WhatsApp and in-app conversational AI that guides candidates through verification, reducing drop-offs by 73%.' },
    { icon: '🤖', title: 'Workflow Automation', desc: 'Intelligent orchestration engine that automates verification pipelines, escalations, and compliance checks end-to-end.' },
  ];

  products = [
    { icon: '🔍', name: 'CredScan AI', desc: 'AI-powered credential verification with real-time risk scoring', color: 'teal', route: '/dashboard/credscan' },
    { icon: '📄', name: 'ForensiDoc AI', desc: 'Document forensics and tamper detection engine', color: 'purple', route: '/dashboard/forensidoc' },
    { icon: '🤖', name: 'NexusAI Agent', desc: 'Autonomous verification task orchestration', color: 'blue', route: '/dashboard/nexus' },
    { icon: '📷', name: 'LiveID Verify', desc: 'Real-time liveness detection and identity verification', color: 'green', route: '/dashboard/liveid' },
    { icon: '💬', name: 'ChatVerify', desc: 'WhatsApp-based verification conversations', color: 'orange', route: '/dashboard/chatverify' },
    { icon: '🎥', name: 'DeepGuard AI', desc: 'Deepfake detection and video analysis', color: 'red', route: '/dashboard/deepguard' },
    { icon: '⛓️', name: 'ChainSeal', desc: 'Blockchain-sealed immutable verification records', color: 'gold', route: '/dashboard/chainseal' },
  ];

  stats = [
    { value: '10,000+', label: 'Verifications', suffix: '' },
    { value: '99.7%', label: 'Accuracy', suffix: '' },
    { value: '48hrs', label: 'Average TAT', suffix: '' },
    { value: '7', label: 'AI Products', suffix: '' },
  ];

  steps = [
    { num: '01', icon: '📋', title: 'Submit Request', desc: 'Upload documents or initiate verification through our intuitive dashboard, API, or WhatsApp integration.' },
    { num: '02', icon: '⚡', title: 'AI Verification', desc: 'Our multi-model AI pipeline analyzes, cross-references, and scores every verification across 7 specialized engines.' },
    { num: '03', icon: '📊', title: 'Get Report', desc: 'Receive comprehensive, blockchain-sealed verification reports with risk scores in as little as 48 hours.' },
  ];

  trustedCompanies = [
    'Tata Group', 'Infosys', 'Wipro', 'HDFC', 'Reliance', 'ICICI'
  ];

  footerLinks = {
    product: [
      { label: 'CredScan AI', route: '/dashboard/credscan' },
      { label: 'ForensiDoc AI', route: '/dashboard/forensidoc' },
      { label: 'NexusAI Agent', route: '/dashboard/nexus' },
      { label: 'LiveID Verify', route: '/dashboard/liveid' },
    ],
    company: [
      { label: 'About Us', route: '/login' },
      { label: 'Careers', route: '/login' },
      { label: 'Blog', route: '/login' },
      { label: 'Contact', route: '/login' },
    ],
    legal: [
      { label: 'Privacy Policy', route: '/login' },
      { label: 'Terms of Service', route: '/login' },
      { label: 'DPDP Compliance', route: '/login' },
      { label: 'Security', route: '/login' },
    ],
  };

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  smoothScrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  trackByFn(index: number, item: any): any {
    return item.name || item.title || item.label || index;
  }
}
