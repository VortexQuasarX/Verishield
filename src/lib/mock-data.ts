// =====================================================
// VeriShield Pro - Mock Data Generator
// Realistic enterprise verification records & marketing data
// =====================================================

import type {
  VerificationRecord, VerificationTrend, ActivityLog, AppNotification, AuthUser,
  VerificationCheck, Product, IndustrySegment, PricingPlan,
  PipelineStage, ChainBlock, AIRiskAnalysis, RiskFactor,
  NexusTask, NexusWorkflow, NexusWorkflowStage, NexusAction,
  IdentityCheck, InterviewSession,
  ChatMessage, ChatSession,
  LiveIDVerification, IDChallenge
} from '@/types';

// ---- Helpers ----
const candidateNames = [
  'Arjun Mehta', 'Priya Sharma', 'Rahul Verma', 'Ananya Desai', 'Vikram Patel',
  'Sneha Kulkarni', 'Rohan Gupta', 'Ishaan Reddy', 'Kavita Nair', 'Aditya Singh',
  'Deepa Joshi', 'Manish Kumar', 'Pooja Agarwal', 'Saurabh Mishra', 'Neha Saxena',
  'Amit Dubey', 'Ritu Pandey', 'Karan Malhotra', 'Shruti Iyer', 'Varun Khanna',
  'Divya Chauhan', 'Nikhil Bhatt', 'Meera Rao', 'Sanjay Pillai', 'Tanya Bose',
];

const companies = [
  'Tata Consultancy Services', 'Infosys Limited', 'Wipro Technologies', 'HCL Technologies',
  'Reliance Industries', 'ICICI Bank', 'HDFC Bank', 'Bharti Airtel', 'Mahindra Group',
  'Larsen & Toubro', 'Google India', 'Microsoft India', 'Amazon India', 'Flipkart',
  'Accenture India', 'Deloitte India', 'KPMG India', 'EY India', 'PwC India',
  'Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'Razorpay', 'Indium Software', 'MRF Tyres', 'Bluspring',
];

const verificationTypes = ['identity', 'employment', 'education', 'criminal', 'credit', 'reference', 'address', 'drug', 'global_database', 'address_validation'] as const;
const statuses = ['pending', 'in_progress', 'completed', 'failed', 'flagged'] as const;
const riskLevels = ['low', 'medium', 'high', 'critical'] as const;

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVerificationId(index: number): string {
  const prefix = 'VSH';
  const num = String(index + 1001).padStart(6, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}

function generateHash(): string {
  return '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ---- Verification Records ----
export function generateVerificationRecords(count: number = 50): VerificationRecord[] {
  const records: VerificationRecord[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const submittedDate = randomDate(sixMonthsAgo, now);
    const submitted = new Date(submittedDate);
    const etaDays = Math.floor(Math.random() * 14) + 2;
    const completionEta = new Date(submitted.getTime() + etaDays * 24 * 60 * 60 * 1000);

    const statusRand = Math.random();
    let status: typeof statuses[number];
    if (statusRand < 0.20) status = 'pending';
    else if (statusRand < 0.38) status = 'in_progress';
    else if (statusRand < 0.78) status = 'completed';
    else if (statusRand < 0.88) status = 'failed';
    else status = 'flagged';

    let riskLevel: typeof riskLevels[number];
    if (status === 'flagged') {
      riskLevel = Math.random() < 0.6 ? 'high' : 'critical';
    } else if (status === 'failed') {
      riskLevel = Math.random() < 0.5 ? 'medium' : 'high';
    } else {
      const riskRand = Math.random();
      if (riskRand < 0.55) riskLevel = 'low';
      else if (riskRand < 0.80) riskLevel = 'medium';
      else riskLevel = 'high';
    }

    const progress = status === 'completed' ? 100 : status === 'failed' ? 100 : status === 'flagged' ? 100 : status === 'pending' ? 0 : Math.floor(Math.random() * 80) + 10;

    records.push({
      id: `rec_${i}`,
      verificationId: generateVerificationId(i),
      candidateName: randomItem(candidateNames),
      company: randomItem(companies),
      verificationType: randomItem(verificationTypes),
      status,
      riskLevel,
      submittedDate,
      completionEta: completionEta.toISOString(),
      progress,
      chainHash: status === 'completed' ? generateHash() : undefined,
      notes: '',
      createdAt: submittedDate,
      updatedAt: submittedDate,
    });
  }

  return records.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
}

// ---- Trends ----
export function generateTrends(): VerificationTrend[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month) => ({
    month,
    completed: Math.floor(Math.random() * 80) + 40,
    pending: Math.floor(Math.random() * 30) + 10,
    flagged: Math.floor(Math.random() * 15) + 2,
    aiProcessed: Math.floor(Math.random() * 50) + 20,
  }));
}

// ---- Activity Logs ----
export function generateActivityLogs(count: number = 30): ActivityLog[] {
  const actions = [
    { action: 'User logged in', category: 'auth' as const },
    { action: 'Verification initiated', category: 'verification' as const },
    { action: 'Background check completed', category: 'verification' as const },
    { action: 'Risk flag raised', category: 'verification' as const },
    { action: 'User role updated', category: 'admin' as const },
    { action: 'New user created', category: 'admin' as const },
    { action: 'Report generated', category: 'system' as const },
    { action: 'Verification escalated', category: 'verification' as const },
    { action: 'Criminal check cleared', category: 'verification' as const },
    { action: 'AI risk analysis completed', category: 'ai' as const },
    { action: 'Employment history confirmed', category: 'verification' as const },
    { action: 'Identity verification failed', category: 'verification' as const },
    { action: 'Chain verification sealed', category: 'system' as const },
    { action: 'ForensiDoc scan completed', category: 'ai' as const },
    { action: 'System backup completed', category: 'system' as const },
  ];

  const now = new Date();
  const logs: ActivityLog[] = [];

  for (let i = 0; i < count; i++) {
    const entry = randomItem(actions);
    const hoursAgo = Math.floor(Math.random() * 168);
    const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    logs.push({
      id: `log_${i}`,
      userId: Math.random() < 0.5 ? 'usr_admin' : 'usr_user',
      userName: Math.random() < 0.5 ? 'Rajesh Kumar' : 'Anita Sharma',
      action: entry.action,
      details: `Automated log entry #${i + 1}`,
      category: entry.category,
      createdAt: date.toISOString(),
    });
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ---- Notifications ----
export function generateNotifications(): AppNotification[] {
  const now = new Date();
  return [
    {
      id: 'notif_1',
      title: 'High Risk Flag Detected',
      message: 'Verification MPC-001002-AB12 has been flagged with critical risk level.',
      type: 'error',
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_2',
      title: 'Verification Completed',
      message: 'Background check for Arjun Mehta at TCS has been completed successfully.',
      type: 'success',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_3',
      title: 'AI Risk Analysis Complete',
      message: 'CredScan AI has analyzed 15 new candidates. 2 require manual review.',
      type: 'info',
      isRead: false,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_4',
      title: 'Pending Review Required',
      message: '5 verifications are awaiting your review for the past 48 hours.',
      type: 'warning',
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_5',
      title: 'Chain Seal Confirmed',
      message: '12 verification records have been permanently sealed on the chain.',
      type: 'success',
      isRead: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// ---- Mock Users ----
export function generateMockUsers(): AuthUser[] {
  return [
    { id: 'usr_admin', email: 'admin@verishield.ai', name: 'Rajesh Kumar', role: 'admin', isActive: true, lastLogin: new Date().toISOString(), company: 'VeriShield' },
    { id: 'usr_user', email: 'user@verishield.ai', name: 'Anita Sharma', role: 'user', isActive: true, lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), company: 'TCS' },
    { id: 'usr_003', email: 'vikram.patel@tcs.com', name: 'Vikram Patel', role: 'user', isActive: true, lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), company: 'Infosys' },
    { id: 'usr_004', email: 'sneha.k@infosys.com', name: 'Sneha Kulkarni', role: 'user', isActive: true, lastLogin: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), company: 'Wipro' },
    { id: 'usr_005', email: 'rohan.gupta@wipro.com', name: 'Rohan Gupta', role: 'user', isActive: false, lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), company: 'HCL' },
    { id: 'usr_006', email: 'deepa.joshi@hcl.com', name: 'Deepa Joshi', role: 'admin', isActive: true, lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), company: 'VeriShield' },
  ];
}

// ---- Verification Checks (from website) ----
export const verificationChecks: VerificationCheck[] = [
  { id: 'identity', name: 'Identity Verification', slug: 'identity-verification', icon: 'IdCard', description: 'National ID, Tax ID, Passport & Voter ID verification with liveness detection', turnaround: '2-6 hours', category: 'essential' },
  { id: 'address', name: 'Address Verification', slug: 'address-verification', icon: 'MapPin', description: 'Physical address verification with geographic validation', turnaround: '3-7 days', category: 'essential' },
  { id: 'address_validation', name: 'Address Validation', slug: 'address-validation', icon: 'Home', description: 'Digital address validation against postal databases', turnaround: '1-2 hours', category: 'essential' },
  { id: 'education', name: 'Education Verification', slug: 'education-verification', icon: 'GraduationCap', description: 'Degree, diploma & certification verification from institutions', turnaround: '5-10 days', category: 'enhanced' },
  { id: 'employment', name: 'Employment Verification', slug: 'employment-verification', icon: 'Briefcase', description: 'Past employment history, dates, designation & salary verification', turnaround: '5-10 days', category: 'enhanced' },
  { id: 'criminal', name: 'Court Verification', slug: 'court-verification', icon: 'Gavel', description: 'Criminal record checks across district & high courts', turnaround: '3-7 days', category: 'enhanced' },
  { id: 'global_database', name: 'Global Database Check', slug: 'global-database-check', icon: 'Globe', description: 'International sanctions, watchlists & regulatory database screening', turnaround: '1-3 days', category: 'premium' },
  { id: 'drug', name: 'Drug Test', slug: 'drug-test', icon: 'FlaskConical', description: 'Standard 5-panel & 10-panel drug screening via certified labs', turnaround: '2-5 days', category: 'premium' },
  { id: 'credit', name: 'Credit Verification', slug: 'credit-verification', icon: 'CreditCard', description: 'CIBIL score & credit history check with consent', turnaround: '1-3 days', category: 'premium' },
  { id: 'reference', name: 'Reference Check', slug: 'reference-check', icon: 'Users', description: 'Professional & personal reference verification', turnaround: '3-5 days', category: 'enhanced' },
];

// ---- Products (from website) ----
export const products: Product[] = [
  { id: 'credscan', name: 'CredScan AI', slug: 'credscan-ai', icon: 'Brain', description: 'AI-powered resume discrepancy detection and risk signal analysis', features: ['Resume parsing', 'Gap detection', 'Risk scoring', 'Auto-flagging'], status: 'live' },
  { id: 'liveid', name: 'LiveID Verify', slug: 'liveid-verify', icon: 'ShieldUser', description: 'Real-time liveness checks to prevent spoofing and impersonation', features: ['Face matching', 'Liveness detection', 'ID verification', 'Anti-spoofing'], status: 'live' },
  { id: 'chatverify', name: 'ChatVerify', slug: 'chatverify', icon: 'MessageCircle', description: 'Candidate-friendly verification flow via ChatVerify to reduce drop-offs', features: ['ChatVerify integration', 'Consent collection', 'Document upload', 'Status updates'], status: 'live' },
  { id: 'chainseal', name: 'ChainSeal', slug: 'chainseal', icon: 'Link', description: 'Tamper-resistant records for trusted outcomes and audit compliance', features: ['Immutable records', 'Hash verification', 'Audit trail', 'DPDP compliant'], status: 'live' },
  { id: 'forensidoc', name: 'ForensiDoc AI', slug: 'forensidoc-ai', icon: 'ShieldCheck', description: 'AI document validation workflows to catch errors and fraud early', features: ['OCR extraction', 'Forgery detection', 'Template matching', 'Auto-validation'], status: 'live' },
  { id: 'interview', name: 'Verified Interview Platform', slug: 'verified-interview', icon: 'Video', description: 'Structured screening and verification for better hiring outcomes', features: ['Video interviews', 'Identity verification', 'AI scoring', 'Recording & playback'], status: 'beta' },
];

// ---- Industry Segments (from website) ----
export const industrySegments: IndustrySegment[] = [
  {
    id: 'smb', name: 'Small Business / Startups', slug: 'small-business-startups', icon: 'Store',
    suggestedChecks: ['Identity', 'Address', 'Highest Education', 'Past Employment'],
    typicalRoles: ['Sales Executive', 'Customer Support', 'Ops Associate', 'Accounts/Admin'],
    priceRange: '₹700 – ₹1,200', priceCurrency: 'INR',
  },
  {
    id: 'bfsi', name: 'BFSI / NBFC', slug: 'bfsi-nbfc', icon: 'Building2',
    suggestedChecks: ['Identity', 'Address', 'Highest Education', 'Past Employment', 'Credit Check', 'Court Check'],
    typicalRoles: ['Relationship Manager', 'Loan Officer', 'Collections Agent', 'Branch Operations'],
    priceRange: '₹1,000 – ₹1,500', priceCurrency: 'INR',
  },
  {
    id: 'staffing', name: 'Staffing / Blue Collar', slug: 'staffing-blue-collar', icon: 'HardHat',
    suggestedChecks: ['Identity', 'Address', 'Driving License', 'Court Check'],
    typicalRoles: ['Driver', 'Housekeeping', 'Security Guard', 'Nurse'],
    priceRange: '₹300 – ₹600', priceCurrency: 'INR',
  },
  {
    id: 'it', name: 'IT and Corporate', slug: 'it-corporate', icon: 'Laptop',
    suggestedChecks: ['Identity', 'Address', 'Highest Education', 'Past Employment', 'Credit Check', 'Court Check', 'Global Database', 'Drug Check'],
    typicalRoles: ['Software Engineer', 'Data/Business Analyst', 'HR', 'Finance'],
    priceRange: '₹1,500 – ₹2,500', priceCurrency: 'INR',
  },
];

// ---- Pricing Plans (from website) ----
export const pricingPlans: PricingPlan[] = [
  {
    id: 'small', name: 'Small', price: 20000, currency: '₹', credits: 21000, candidates: 21,
    features: ['21,000 Credits', '~21 Candidates', 'Dedicated Support', '1 Year Validity'],
    popular: true, type: 'prepaid',
  },
  {
    id: 'medium', name: 'Medium', price: 30000, currency: '₹', credits: 31500, candidates: 31,
    features: ['31,500 Credits', '~31 Candidates', '24/7 Support', '1 Year Validity'],
    type: 'prepaid',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 0, currency: '₹', credits: 0, candidates: 0,
    features: ['Post-paid billing', 'Volume discounts', 'Dedicated Account Manager', 'Custom integrations'],
    type: 'postpaid',
  },
];

// ---- Pipeline Stages ----
export function generatePipeline(): PipelineStage[] {
  return [
    { name: 'Submitted', count: 42, percentage: 100, color: '#6366f1' },
    { name: 'Consent Given', count: 38, percentage: 90, color: '#8b5cf6' },
    { name: 'In Verification', count: 28, percentage: 67, color: '#f59e0b' },
    { name: 'QC Review', count: 18, percentage: 43, color: '#ec4899' },
    { name: 'Completed', count: 35, percentage: 83, color: '#10b981' },
  ];
}

// ---- Chain Mock ----
export function generateChainData(): ChainBlock[] {
  const blocks: ChainBlock[] = [];
  let previousHash = '0x0000000000000000';

  for (let i = 0; i < 8; i++) {
    const hash = generateHash();
    blocks.push({
      index: i,
      hash,
      previousHash,
      timestamp: new Date(Date.now() - (8 - i) * 3600000).toISOString(),
      data: i === 0 ? 'Genesis Block' : `Verification sealed: VSH-${String(1001 + i).padStart(6, '0')}-${randomItem(['AB', 'CD', 'EF', 'GH'])}${Math.floor(Math.random() * 99)}`,
      nonce: Math.floor(Math.random() * 99999),
      verificationId: i === 0 ? undefined : `VSH-${String(1001 + i).padStart(6, '0')}`,
    });
    previousHash = hash;
  }

  return blocks;
}

// ---- AI Risk Analysis Mock ----
export function generateAIRiskAnalysis(candidateName: string): AIRiskAnalysis {
  const riskScore = Math.floor(Math.random() * 100);
  const factors: RiskFactor[] = [];

  if (Math.random() > 0.5) factors.push({ category: 'Employment Gap', severity: 'medium', description: 'Unexplained 8-month gap in employment history (2022-2023)', confidence: 0.87 });
  if (Math.random() > 0.3) factors.push({ category: 'Education Mismatch', severity: 'low', description: 'Degree field slightly different from claimed specialization', confidence: 0.72 });
  if (Math.random() > 0.7) factors.push({ category: 'Identity Discrepancy', severity: 'high', description: 'ID name variation detected — minor spelling difference', confidence: 0.94 });
  if (Math.random() > 0.6) factors.push({ category: 'Court Record', severity: 'critical', description: 'Civil case found in district court records (2021)', confidence: 0.91 });
  if (Math.random() > 0.4) factors.push({ category: 'Credit Alert', severity: 'medium', description: 'CIBIL score below threshold (624/900)', confidence: 0.85 });

  if (factors.length === 0) {
    factors.push({ category: 'Clean Record', severity: 'low', description: 'No discrepancies detected across all verification checks', confidence: 0.96 });
  }

  return {
    candidateName,
    overallRiskScore: riskScore,
    riskFactors: factors,
    recommendations: [
      riskScore > 70 ? 'Escalate to senior HR for manual review' : 'Proceed with standard onboarding',
      'Cross-verify employment dates with EPFO records',
      'Request additional documentation for flagged areas',
    ],
    timestamp: new Date().toISOString(),
  };
}

// ---- NexusAI Agent Mock Data ----
export function generateNexusTasks(count: number = 12): NexusTask[] {
  const taskTemplates = [
    { type: 'sla_prediction' as const, title: 'SLA Delay Prediction', description: 'Predicting potential SLA breach for verification MPC-001045' },
    { type: 'auto_escalation' as const, title: 'Auto-Escalation Triggered', description: 'Verification MPC-001038 exceeds 48hr SLA — escalated to senior verifier' },
    { type: 'candidate_communication' as const, title: 'Candidate Message Sent', description: 'Automated consent request sent to candidate via ChatVerify' },
    { type: 'verification_lifecycle' as const, title: 'Lifecycle Management', description: 'Managing end-to-end verification flow for batch verification-2024-089' },
    { type: 'anomaly_detection' as const, title: 'Anomaly Detected', description: 'Unusual pattern detected in employment dates — overlapping tenures' },
    { type: 'report_generation' as const, title: 'Report Generation', description: 'Auto-generating comprehensive verification report for client' },
  ];

  const now = new Date();
  const tasks: NexusTask[] = [];

  for (let i = 0; i < count; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const hoursAgo = Math.floor(Math.random() * 72);
    const statusRand = Math.random();
    const status = statusRand < 0.3 ? 'running' : statusRand < 0.5 ? 'completed' : statusRand < 0.7 ? 'idle' : statusRand < 0.85 ? 'paused' : 'error';
    const priorityRand = Math.random();
    const priority = priorityRand < 0.3 ? 'low' : priorityRand < 0.6 ? 'medium' : priorityRand < 0.85 ? 'high' : 'critical';

    const actions: NexusAction[] = [];
    if (template.type === 'auto_escalation') {
      actions.push({ id: `act_${i}_1`, type: 'auto_escalate', label: 'Escalate to Senior', description: 'Escalated to senior verifier due to SLA breach risk', executedAt: status === 'completed' ? new Date(now.getTime() - hoursAgo * 3600000 + 3600000).toISOString() : undefined, result: status === 'completed' ? 'Assigned to Vikram Patel' : undefined });
    }
    if (template.type === 'candidate_communication') {
      actions.push({ id: `act_${i}_2`, type: 'send_message', label: 'Send Consent Request', description: 'ChatVerify message sent for consent collection', executedAt: status === 'completed' ? new Date(now.getTime() - hoursAgo * 3600000 + 1800000).toISOString() : undefined, result: status === 'completed' ? 'Consent received' : undefined });
    }
    if (template.type === 'sla_prediction') {
      actions.push({ id: `act_${i}_3`, type: 'flag_review', label: 'Flag for Review', description: 'Flag verification for manual review due to predicted delay', executedAt: undefined });
    }

    tasks.push({
      id: `nexus_task_${i}`,
      type: template.type,
      title: template.title,
      description: template.description,
      status,
      priority,
      progress: status === 'completed' ? 100 : status === 'running' ? Math.floor(Math.random() * 70) + 20 : status === 'idle' ? 0 : Math.floor(Math.random() * 50),
      assignedTo: Math.random() > 0.3 ? randomItem(['NexusAI Agent', 'Vikram Patel', 'Sneha Kulkarni', 'System Auto']) : undefined,
      candidateName: randomItem(candidateNames),
      verificationId: generateVerificationId(i + 50),
      slaDeadline: new Date(now.getTime() + (Math.floor(Math.random() * 72) - 24) * 3600000).toISOString(),
      predictedDelay: Math.random() > 0.5 ? Math.floor(Math.random() * 48) + 4 : undefined,
      createdAt: new Date(now.getTime() - hoursAgo * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - (hoursAgo - 1) * 3600000).toISOString(),
      actions,
    });
  }

  return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function generateNexusWorkflows(): NexusWorkflow[] {
  const now = new Date();
  return [
    {
      id: 'wf_1', candidateName: 'Arjun Mehta', verificationId: 'MPC-001045-AB12',
      stages: [
        { name: 'Consent Collection', status: 'completed', duration: '2h', assignee: 'NexusAI' },
        { name: 'Identity Verification', status: 'completed', duration: '4h', assignee: 'ID Verify API' },
        { name: 'Employment Check', status: 'in_progress', duration: '3d (est.)', assignee: 'EPFO Agent' },
        { name: 'Education Verification', status: 'pending', assignee: 'University API' },
        { name: 'Court Records', status: 'pending', assignee: 'E-Courts API' },
        { name: 'Final Report', status: 'pending', assignee: 'NexusAI' },
      ],
      currentStage: 2, overallProgress: 45, slaStatus: 'on_track',
      predictedCompletion: new Date(now.getTime() + 4 * 86400000).toISOString(),
    },
    {
      id: 'wf_2', candidateName: 'Priya Sharma', verificationId: 'MPC-001038-CD34',
      stages: [
        { name: 'Consent Collection', status: 'completed', duration: '1h', assignee: 'ChatVerify Bot' },
        { name: 'Identity Verification', status: 'completed', duration: '6h', assignee: 'ID Verify API' },
        { name: 'Employment Check', status: 'completed', duration: '5d', assignee: 'EPFO Agent' },
        { name: 'Education Verification', status: 'completed', duration: '4d', assignee: 'University API' },
        { name: 'Court Records', status: 'in_progress', duration: '2d (est.)', assignee: 'E-Courts API', notes: 'SLA at risk — delayed court response' },
        { name: 'Final Report', status: 'pending', assignee: 'NexusAI' },
      ],
      currentStage: 4, overallProgress: 78, slaStatus: 'at_risk',
      predictedCompletion: new Date(now.getTime() + 2 * 86400000).toISOString(),
    },
    {
      id: 'wf_3', candidateName: 'Rahul Verma', verificationId: 'MPC-001050-EF56',
      stages: [
        { name: 'Consent Collection', status: 'completed', duration: '3h', assignee: 'NexusAI' },
        { name: 'Identity Verification', status: 'completed', duration: '5h', assignee: 'ID Verify API' },
        { name: 'Employment Check', status: 'completed', duration: '6d', assignee: 'EPFO Agent' },
        { name: 'Education Verification', status: 'completed', duration: '5d', assignee: 'University API' },
        { name: 'Court Records', status: 'completed', duration: '3d', assignee: 'E-Courts API' },
        { name: 'Final Report', status: 'completed', duration: '1h', assignee: 'NexusAI' },
      ],
      currentStage: 5, overallProgress: 100, slaStatus: 'on_track',
      predictedCompletion: new Date(now.getTime() - 86400000).toISOString(),
    },
  ];
}

// ---- Deepfake & Interview Fraud Mock Data ----
export function generateDeepGuardChecks(): IdentityCheck[] {
  const now = new Date();
  return [
    {
      id: 'live_1', candidateName: 'Arjun Mehta', verificationId: 'MPC-001045-AB12',
      status: 'passed', challengeType: 'blink', confidenceScore: 97.3, faceMatchScore: 94.8,
      identityVerified: true, panVerified: true, alerts: [], timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: 'live_2', candidateName: 'Priya Sharma', verificationId: 'MPC-001038-CD34',
      status: 'passed', challengeType: 'turn_head', confidenceScore: 95.1, faceMatchScore: 91.2,
      identityVerified: true, panVerified: true, alerts: [], timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
    {
      id: 'live_3', candidateName: 'Rahul Verma', verificationId: 'MPC-001050-EF56',
      status: 'suspected_spoof', challengeType: 'smile', confidenceScore: 42.7, faceMatchScore: 38.5,
      identityVerified: false, panVerified: false, alerts: ['face_mismatch', 'fraud_suspected'],
      timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
    },
    {
      id: 'live_4', candidateName: 'Ananya Desai', verificationId: 'MPC-001052-GH78',
      status: 'failed', challengeType: 'nod', confidenceScore: 55.2, faceMatchScore: 62.1,
      identityVerified: true, panVerified: false, alerts: ['face_mismatch'],
      timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      id: 'live_5', candidateName: 'Vikram Patel', verificationId: 'MPC-001055-IJ90',
      status: 'in_progress', challengeType: 'read_text', confidenceScore: 0, faceMatchScore: 0,
      identityVerified: false, panVerified: false, alerts: [], timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
    },
  ];
}

export function generateInterviewSessions(): InterviewSession[] {
  const now = new Date();
  return [
    {
      id: 'int_1', candidateName: 'Arjun Mehta', position: 'Software Engineer', startTime: new Date(now.getTime() - 3600000).toISOString(),
      duration: 45, status: 'live', identityVerified: true, checkPassed: true, alertCount: 0,
      alerts: [], fraudScore: 2.1, integrityScore: 97.8,
    },
    {
      id: 'int_2', candidateName: 'Sneha Kulkarni', position: 'Data Analyst', startTime: new Date(now.getTime() - 7200000).toISOString(),
      duration: 32, status: 'flagged', identityVerified: true, checkPassed: true, alertCount: 3,
      alerts: ['tab_switch', 'tab_switch', 'audio_anomaly'], fraudScore: 8.4, integrityScore: 72.3,
    },
    {
      id: 'int_3', candidateName: 'Rahul Verma', position: 'HR Manager', startTime: new Date(now.getTime() - 86400000).toISOString(),
      duration: 28, status: 'completed', identityVerified: true, checkPassed: true, alertCount: 0,
      alerts: [], fraudScore: 1.8, integrityScore: 98.1,
    },
    {
      id: 'int_4', candidateName: 'Ananya Desai', position: 'Product Designer', startTime: new Date(now.getTime() - 2 * 86400000).toISOString(),
      duration: 15, status: 'flagged', identityVerified: false, checkPassed: false, alertCount: 5,
      alerts: ['face_mismatch', 'fraud_suspected', 'multiple_faces', 'face_swap', 'audio_anomaly'], fraudScore: 87.3, integrityScore: 12.4,
    },
    {
      id: 'int_5', candidateName: 'Ishaan Reddy', position: 'Backend Developer', startTime: new Date(now.getTime() + 3600000).toISOString(),
      duration: 0, status: 'scheduled', identityVerified: false, checkPassed: false, alertCount: 0,
      alerts: [], fraudScore: 0, integrityScore: 0,
    },
  ];
}

// ---- ChatVerify Mock Data ----
export function generateChatSessions(): ChatSession[] {
  const now = new Date();
  return [
    {
      id: 'wa_1', candidateName: 'Arjun Mehta', candidatePhone: '+91 98765 43210', verificationId: 'MPC-001045-AB12',
      status: 'completed', consentGiven: true, documentsUploaded: ['Government ID', 'PAN Card', 'Experience Letter'],
      lastActivity: new Date(now.getTime() - 3600000).toISOString(), createdAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
      messages: [
        { id: 'msg_1', type: 'greeting', content: 'Hi Arjun! Welcome to VeriShield Verification. We need to verify your background for your new role at TCS.', timestamp: new Date(now.getTime() - 72 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_2', type: 'otp', content: 'Your verification OTP is 4829. Valid for 5 minutes.', timestamp: new Date(now.getTime() - 71.5 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_3', type: 'consent_request', content: 'Please provide consent for background verification. Reply "AGREE" to proceed.', timestamp: new Date(now.getTime() - 71 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_4', type: 'consent_request', content: 'AGREE', timestamp: new Date(now.getTime() - 70 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_5', type: 'document_upload', content: 'Please upload your Government ID (front & back).', timestamp: new Date(now.getTime() - 69 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_6', type: 'document_upload', content: '📎 Government ID uploaded', timestamp: new Date(now.getTime() - 68 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_7', type: 'document_upload', content: 'Please upload your PAN Card.', timestamp: new Date(now.getTime() - 67 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_8', type: 'document_upload', content: '📎 PAN Card uploaded', timestamp: new Date(now.getTime() - 66 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_9', type: 'liveness_link', content: 'Complete your liveness check: https://verishield.ai/verify/live/abc123', timestamp: new Date(now.getTime() - 65 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_10', type: 'status_update', content: 'Identity verification: ✅ Passed. Employment check: 🔄 In progress.', timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_11', type: 'completion', content: '🎉 Verification complete! All checks passed. Report sent to your employer.', timestamp: new Date(now.getTime() - 3600000).toISOString(), isFromCandidate: false, status: 'read' },
      ],
    },
    {
      id: 'wa_2', candidateName: 'Priya Sharma', candidatePhone: '+91 87654 32109', verificationId: 'MPC-001038-CD34',
      status: 'verification_in_progress', consentGiven: true, documentsUploaded: ['Government ID', 'PAN Card'],
      lastActivity: new Date(now.getTime() - 4 * 3600000).toISOString(), createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      messages: [
        { id: 'msg_20', type: 'greeting', content: 'Hi Priya! Welcome to VeriShield Verification.', timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
        { id: 'msg_21', type: 'otp', content: 'Your verification OTP is 7351.', timestamp: new Date(now.getTime() - 47.5 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_22', type: 'consent_request', content: 'Please provide consent for background verification. Reply "AGREE" to proceed.', timestamp: new Date(now.getTime() - 47 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_23', type: 'consent_request', content: 'AGREE', timestamp: new Date(now.getTime() - 46 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_24', type: 'document_upload', content: 'Please upload your Government ID.', timestamp: new Date(now.getTime() - 45 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_25', type: 'document_upload', content: '📎 Government ID uploaded', timestamp: new Date(now.getTime() - 44 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_26', type: 'document_upload', content: 'Please upload your PAN Card.', timestamp: new Date(now.getTime() - 43 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_27', type: 'document_upload', content: '📎 PAN Card uploaded', timestamp: new Date(now.getTime() - 42 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_28', type: 'status_update', content: 'Identity verification: ✅ Passed. Employment check: 🔄 In progress. Education: ⏳ Pending.', timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
      ],
    },
    {
      id: 'wa_3', candidateName: 'Rahul Verma', candidatePhone: '+91 76543 21098', verificationId: 'MPC-001050-EF56',
      status: 'dropped_off', consentGiven: false, documentsUploaded: [],
      lastActivity: new Date(now.getTime() - 96 * 3600000).toISOString(), createdAt: new Date(now.getTime() - 120 * 3600000).toISOString(),
      messages: [
        { id: 'msg_30', type: 'greeting', content: 'Hi Rahul! Welcome to VeriShield Verification.', timestamp: new Date(now.getTime() - 120 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
        { id: 'msg_31', type: 'otp', content: 'Your verification OTP is 9284.', timestamp: new Date(now.getTime() - 119 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
        { id: 'msg_32', type: 'consent_request', content: 'Please provide consent for background verification. Reply "AGREE" to proceed.', timestamp: new Date(now.getTime() - 118 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
        { id: 'msg_33', type: 'reminder', content: 'Hi Rahul, your verification is pending. Please provide consent to proceed.', timestamp: new Date(now.getTime() - 96 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
      ],
    },
    {
      id: 'wa_4', candidateName: 'Ananya Desai', candidatePhone: '+91 65432 10987', verificationId: 'MPC-001052-GH78',
      status: 'documents_uploaded', consentGiven: true, documentsUploaded: ['Government ID', 'PAN Card', 'Degree Certificate'],
      lastActivity: new Date(now.getTime() - 12 * 3600000).toISOString(), createdAt: new Date(now.getTime() - 36 * 3600000).toISOString(),
      messages: [
        { id: 'msg_40', type: 'greeting', content: 'Hi Ananya! Welcome to VeriShield Verification.', timestamp: new Date(now.getTime() - 36 * 3600000).toISOString(), isFromCandidate: false, status: 'read' },
        { id: 'msg_41', type: 'consent_request', content: 'AGREE', timestamp: new Date(now.getTime() - 35 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_42', type: 'document_upload', content: '📎 Government ID uploaded', timestamp: new Date(now.getTime() - 34 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_43', type: 'document_upload', content: '📎 PAN Card uploaded', timestamp: new Date(now.getTime() - 33 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_44', type: 'document_upload', content: '📎 Degree Certificate uploaded', timestamp: new Date(now.getTime() - 32 * 3600000).toISOString(), isFromCandidate: true, status: 'read' },
        { id: 'msg_45', type: 'liveness_link', content: 'Complete your liveness check: https://verishield.ai/verify/live/def456', timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(), isFromCandidate: false, status: 'delivered' },
      ],
    },
  ];
}

// ---- LiveID Verify Mock Data ----
export function generateLiveIDVerifications(): LiveIDVerification[] {
  const now = new Date();
  return [
    {
      id: 'liveid_1', candidateName: 'Arjun Mehta', idNumber: 'XXXX XXXX 4521', status: 'verified',
      checkPassed: true, faceMatchScore: 96.8, idMatchScore: 94.2, currentStep: 'result',
      challenges: [
        { type: 'blink', instruction: 'Please blink your eyes slowly', completed: true, passed: true, confidence: 98.2 },
        { type: 'turn_left', instruction: 'Slowly turn your head to the left', completed: true, passed: true, confidence: 95.7 },
        { type: 'smile', instruction: 'Please smile naturally', completed: true, passed: true, confidence: 97.1 },
      ],
      antiSpoofScore: 98.5, photoCaptured: true,
      idDataMatch: { name: true, dob: true, gender: true, photo: true, address: true },
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: 'liveid_2', candidateName: 'Priya Sharma', idNumber: 'XXXX XXXX 7834', status: 'verified',
      checkPassed: true, faceMatchScore: 93.4, idMatchScore: 91.8, currentStep: 'result',
      challenges: [
        { type: 'blink', instruction: 'Please blink your eyes slowly', completed: true, passed: true, confidence: 96.5 },
        { type: 'turn_right', instruction: 'Slowly turn your head to the right', completed: true, passed: true, confidence: 94.2 },
        { type: 'nod', instruction: 'Please nod your head slowly', completed: true, passed: true, confidence: 92.8 },
      ],
      antiSpoofScore: 96.1, photoCaptured: true,
      idDataMatch: { name: true, dob: true, gender: true, photo: true, address: false },
      timestamp: new Date(now.getTime() - 6 * 3600000).toISOString(),
    },
    {
      id: 'liveid_3', candidateName: 'Rahul Verma', idNumber: 'XXXX XXXX 1256', status: 'mismatch',
      checkPassed: false, faceMatchScore: 34.2, idMatchScore: 28.7, currentStep: 'result',
      challenges: [
        { type: 'blink', instruction: 'Please blink your eyes slowly', completed: true, passed: true, confidence: 89.3 },
        { type: 'turn_left', instruction: 'Slowly turn your head to the left', completed: true, passed: false, confidence: 31.4 },
        { type: 'smile', instruction: 'Please smile naturally', completed: true, passed: false, confidence: 25.6 },
      ],
      antiSpoofScore: 22.4, photoCaptured: true,
      idDataMatch: { name: false, dob: true, gender: true, photo: false, address: true },
      timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      id: 'liveid_4', candidateName: 'Ananya Desai', idNumber: 'XXXX XXXX 9067', status: 'verifying',
      checkPassed: true, faceMatchScore: 88.5, idMatchScore: 0, currentStep: 'id_verify',
      challenges: [
        { type: 'blink', instruction: 'Please blink your eyes slowly', completed: true, passed: true, confidence: 94.8 },
        { type: 'raise_eyebrows', instruction: 'Raise your eyebrows', completed: true, passed: true, confidence: 91.2 },
        { type: 'nod', instruction: 'Please nod your head slowly', completed: true, passed: true, confidence: 90.5 },
      ],
      antiSpoofScore: 93.7, photoCaptured: true,
      idDataMatch: { name: true, dob: true, gender: true, photo: false, address: false },
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
  ];
}
