// =====================================================
// MPloyChek - Mock Data Generator
// Realistic enterprise verification records
// =====================================================

import type { VerificationRecord, VerificationTrend, ActivityLog, AppNotification, AuthUser } from '@/types';

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
  'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'Razorpay',
];

const verificationTypes = ['identity', 'employment', 'education', 'criminal', 'credit', 'reference', 'address'] as const;
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
  const prefix = 'MPC';
  const num = String(index + 1001).padStart(6, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}

export function generateVerificationRecords(count: number = 50): VerificationRecord[] {
  const records: VerificationRecord[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const submittedDate = randomDate(sixMonthsAgo, now);
    const submitted = new Date(submittedDate);
    const etaDays = Math.floor(Math.random() * 14) + 2;
    const completionEta = new Date(submitted.getTime() + etaDays * 24 * 60 * 60 * 1000);

    // Weighted status distribution
    const statusRand = Math.random();
    let status: typeof statuses[number];
    if (statusRand < 0.25) status = 'pending';
    else if (statusRand < 0.45) status = 'in_progress';
    else if (statusRand < 0.80) status = 'completed';
    else if (statusRand < 0.90) status = 'failed';
    else status = 'flagged';

    // Risk level weighted by status
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
      notes: '',
      createdAt: submittedDate,
      updatedAt: submittedDate,
    });
  }

  // Sort by date descending
  return records.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
}

export function generateTrends(): VerificationTrend[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month) => ({
    month,
    completed: Math.floor(Math.random() * 80) + 40,
    pending: Math.floor(Math.random() * 30) + 10,
    flagged: Math.floor(Math.random() * 15) + 2,
  }));
}

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
    { action: 'Education verification pending', category: 'verification' as const },
    { action: 'Employment history confirmed', category: 'verification' as const },
    { action: 'Identity verification failed', category: 'verification' as const },
    { action: 'Credit check initiated', category: 'verification' as const },
    { action: 'Address verification completed', category: 'verification' as const },
    { action: 'System backup completed', category: 'system' as const },
  ];

  const now = new Date();
  const logs: ActivityLog[] = [];

  for (let i = 0; i < count; i++) {
    const entry = randomItem(actions);
    const hoursAgo = Math.floor(Math.random() * 168); // last 7 days
    const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    logs.push({
      id: `log_${i}`,
      userId: Math.random() < 0.5 ? 'usr_admin' : 'usr_user',
      userName: Math.random() < 0.5 ? 'Admin User' : 'General User',
      action: entry.action,
      details: `Automated log entry #${i + 1}`,
      category: entry.category,
      createdAt: date.toISOString(),
    });
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

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
      title: 'Pending Review Required',
      message: '5 verifications are awaiting your review for the past 48 hours.',
      type: 'warning',
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_4',
      title: 'System Update',
      message: 'MPloyChek v2.4.0 has been deployed with improved AI verification models.',
      type: 'info',
      isRead: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_5',
      title: 'New User Registered',
      message: 'Priya Sharma has been added to the system by Admin.',
      type: 'info',
      isRead: true,
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockUsers(): AuthUser[] {
  return [
    {
      id: 'usr_admin',
      email: 'admin@mploychek.com',
      name: 'Rajesh Kumar',
      role: 'admin',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr_user',
      email: 'user@mploychek.com',
      name: 'Anita Sharma',
      role: 'user',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_003',
      email: 'vikram.patel@tcs.com',
      name: 'Vikram Patel',
      role: 'user',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_004',
      email: 'sneha.k@infosys.com',
      name: 'Sneha Kulkarni',
      role: 'user',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_005',
      email: 'rohan.gupta@wipro.com',
      name: 'Rohan Gupta',
      role: 'user',
      avatar: undefined,
      isActive: false,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_006',
      email: 'deepa.joshi@hcl.com',
      name: 'Deepa Joshi',
      role: 'admin',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_007',
      email: 'manish.kumar@accenture.com',
      name: 'Manish Kumar',
      role: 'user',
      avatar: undefined,
      isActive: true,
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'usr_008',
      email: 'pooja.agarwal@deloitte.com',
      name: 'Pooja Agarwal',
      role: 'user',
      avatar: undefined,
      isActive: false,
      lastLogin: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
