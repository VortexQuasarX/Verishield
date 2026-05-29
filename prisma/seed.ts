import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed ChatSessions with messages
  const session1 = await prisma.chatSession.create({
    data: {
      candidateName: 'Priya Sharma',
      candidatePhone: '+91-9876543210',
      verificationId: 'VER-2024-001',
      status: 'completed',
      consentGiven: true,
      documentsUploaded: 'aadhaar,pan',
      lastActivity: new Date(Date.now() - 2 * 3600000),
      messages: {
        create: [
          { type: 'text', content: 'Hello! Welcome to VeriShield verification process.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 5 * 3600000) },
          { type: 'text', content: 'Hi, I am ready to proceed with my verification.', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 4.8 * 3600000) },
          { type: 'consent', content: 'Please provide consent for identity verification.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 4.5 * 3600000) },
          { type: 'text', content: 'I consent to the verification process.', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 4.2 * 3600000) },
          { type: 'document_request', content: 'Please upload your Aadhaar card and PAN card.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 4 * 3600000) },
          { type: 'document', content: 'Uploaded: aadhaar_front.jpg', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 3.5 * 3600000) },
          { type: 'document', content: 'Uploaded: pan_card.jpg', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 3.2 * 3600000) },
          { type: 'text', content: 'Documents received. Verification is in progress.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 3 * 3600000) },
          { type: 'text', content: 'Thank you for the update!', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 2.5 * 3600000) },
          { type: 'text', content: 'Your verification has been completed successfully. Thank you!', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 2 * 3600000) },
        ],
      },
    },
  });

  const session2 = await prisma.chatSession.create({
    data: {
      candidateName: 'Rahul Verma',
      candidatePhone: '+91-9123456789',
      verificationId: 'VER-2024-002',
      status: 'active',
      consentGiven: true,
      documentsUploaded: 'aadhaar',
      lastActivity: new Date(Date.now() - 1 * 3600000),
      messages: {
        create: [
          { type: 'text', content: 'Welcome to VeriShield! We need to verify your identity.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 3 * 3600000) },
          { type: 'text', content: 'Sure, what do I need to do?', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 2.8 * 3600000) },
          { type: 'consent', content: 'Please review and accept our terms to proceed.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 2.5 * 3600000) },
          { type: 'text', content: 'I accept the terms.', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 2.2 * 3600000) },
          { type: 'document_request', content: 'Please upload your Aadhaar card.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 2 * 3600000) },
          { type: 'document', content: 'Uploaded: aadhaar_card.pdf', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 1.5 * 3600000) },
          { type: 'text', content: 'We also need your PAN card to complete the verification.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 1 * 3600000) },
        ],
      },
    },
  });

  const session3 = await prisma.chatSession.create({
    data: {
      candidateName: 'Ananya Desai',
      candidatePhone: '+91-9988776655',
      status: 'dropped_off',
      consentGiven: false,
      lastActivity: new Date(Date.now() - 24 * 3600000),
      messages: {
        create: [
          { type: 'text', content: 'Hello! This is VeriShield reaching out for your background verification.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 48 * 3600000) },
          { type: 'text', content: 'Hi, I was told about this. How long will it take?', isFromCandidate: true, status: 'read', createdAt: new Date(Date.now() - 47 * 3600000) },
          { type: 'text', content: 'The process typically takes 15-20 minutes. Shall we begin?', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 46.5 * 3600000) },
          { type: 'consent', content: 'Please provide your consent to start the verification.', isFromCandidate: false, status: 'delivered', createdAt: new Date(Date.now() - 46 * 3600000) },
        ],
      },
    },
  });

  console.log('Created 3 chat sessions with messages:', session1.id, session2.id, session3.id);

  // Seed DeepGuardChecks
  const dgChecks = await Promise.all([
    prisma.deepGuardCheck.create({
      data: {
        candidateName: 'Arjun Mehta',
        verificationId: 'VER-2024-003',
        status: 'verified',
        challengeType: 'face_match',
        confidenceScore: 97.3,
        faceMatchScore: 95.8,
        identityVerified: true,
        alerts: 'Identity check passed — Arjun Mehta (97.3% confidence)',
        createdAt: new Date(Date.now() - 3600000),
      },
    }),
    prisma.deepGuardCheck.create({
      data: {
        candidateName: 'Ananya Desai',
        verificationId: 'VER-2024-004',
        status: 'flagged',
        challengeType: 'liveness',
        confidenceScore: 42.1,
        faceMatchScore: 38.5,
        identityVerified: false,
        deepfakeScore: 87.3,
        alerts: 'Fraud suspected — Ananya Desai interview (87.3% fraud score)',
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    }),
    prisma.deepGuardCheck.create({
      data: {
        candidateName: 'Sneha Kulkarni',
        verificationId: 'VER-2024-005',
        status: 'suspected_spoof',
        challengeType: 'face_match',
        confidenceScore: 55.2,
        faceMatchScore: 51.0,
        identityVerified: false,
        deepfakeScore: 62.4,
        alerts: 'Tab switch detected — Sneha Kulkarni (2nd occurrence)',
        createdAt: new Date(Date.now() - 7200000),
      },
    }),
    prisma.deepGuardCheck.create({
      data: {
        candidateName: 'Rahul Verma',
        verificationId: 'VER-2024-002',
        status: 'failed',
        challengeType: 'face_match',
        confidenceScore: 38.5,
        faceMatchScore: 38.5,
        identityVerified: false,
        alerts: 'Face mismatch — Rahul Verma (38.5% match score)',
        createdAt: new Date(Date.now() - 8 * 3600000),
      },
    }),
    prisma.deepGuardCheck.create({
      data: {
        candidateName: 'Priya Sharma',
        verificationId: 'VER-2024-001',
        status: 'verified',
        challengeType: 'liveness',
        confidenceScore: 98.1,
        faceMatchScore: 96.2,
        identityVerified: true,
        alerts: 'Identity verified — Priya Sharma (ID + Tax ID matched)',
        createdAt: new Date(Date.now() - 5 * 3600000),
      },
    }),
  ]);

  console.log('Created 5 deep guard checks:', dgChecks.map(c => c.id).join(', '));

  // Seed LiveIDRecords
  const liveIdRecords = await Promise.all([
    prisma.liveIDRecord.create({
      data: {
        candidateName: 'Priya Sharma',
        idNumber: 'XXXX XXXX 4321',
        status: 'verified',
        checkPassed: true,
        faceMatchScore: 96.7,
        idMatchScore: 98.2,
        livenessScore: 94.5,
        antiSpoofScore: 97.1,
        photoCaptured: true,
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
    }),
    prisma.liveIDRecord.create({
      data: {
        candidateName: 'Rahul Verma',
        idNumber: 'XXXX XXXX 8765',
        status: 'mismatch',
        checkPassed: false,
        faceMatchScore: 38.5,
        idMatchScore: 72.1,
        livenessScore: 85.3,
        antiSpoofScore: 22.4,
        photoCaptured: true,
        createdAt: new Date(Date.now() - 6 * 3600000),
      },
    }),
    prisma.liveIDRecord.create({
      data: {
        candidateName: 'Arjun Mehta',
        idNumber: 'XXXX XXXX 1234',
        status: 'verified',
        checkPassed: true,
        faceMatchScore: 95.8,
        idMatchScore: 99.1,
        livenessScore: 97.3,
        antiSpoofScore: 98.5,
        photoCaptured: true,
        createdAt: new Date(Date.now() - 1 * 3600000),
      },
    }),
    prisma.liveIDRecord.create({
      data: {
        candidateName: 'Sneha Kulkarni',
        idNumber: 'XXXX XXXX 5678',
        status: 'pending',
        checkPassed: false,
        faceMatchScore: 0,
        idMatchScore: 0,
        livenessScore: 0,
        photoCaptured: false,
        createdAt: new Date(Date.now() - 30 * 60000),
      },
    }),
  ]);

  console.log('Created 4 live ID records:', liveIdRecords.map(r => r.id).join(', '));

  // Seed NexusTaskRecords
  const nexusTasks = await Promise.all([
    prisma.nexusTaskRecord.create({
      data: {
        name: 'Auto-escalate high-risk verifications',
        type: 'auto_escalation',
        status: 'running',
        progress: 65,
        candidateName: 'Ananya Desai',
        verificationId: 'VER-2024-004',
        logs: 'Detected fraud score > 80%. Auto-escalating to senior analyst.',
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
    }),
    prisma.nexusTaskRecord.create({
      data: {
        name: 'Send verification reminder to candidate',
        type: 'candidate_communication',
        status: 'completed',
        progress: 100,
        candidateName: 'Sneha Kulkarni',
        verificationId: 'VER-2024-005',
        logs: 'SMS reminder sent successfully.',
        createdAt: new Date(Date.now() - 4 * 3600000),
      },
    }),
    prisma.nexusTaskRecord.create({
      data: {
        name: 'SLA breach prediction analysis',
        type: 'sla_monitoring',
        status: 'running',
        progress: 40,
        logs: 'Analyzing 12 active verifications for SLA risk.',
        createdAt: new Date(Date.now() - 1 * 3600000),
      },
    }),
    prisma.nexusTaskRecord.create({
      data: {
        name: 'Document quality check',
        type: 'document_verification',
        status: 'completed',
        progress: 100,
        candidateName: 'Priya Sharma',
        verificationId: 'VER-2024-001',
        logs: 'All documents passed quality threshold.',
        createdAt: new Date(Date.now() - 8 * 3600000),
      },
    }),
    prisma.nexusTaskRecord.create({
      data: {
        name: 'Cross-reference employment history',
        type: 'background_check',
        status: 'pending',
        progress: 0,
        candidateName: 'Rahul Verma',
        verificationId: 'VER-2024-002',
        createdAt: new Date(Date.now() - 30 * 60000),
      },
    }),
    prisma.nexusTaskRecord.create({
      data: {
        name: 'Auto-assign pending verifications',
        type: 'auto_escalation',
        status: 'completed',
        progress: 100,
        logs: 'Assigned 3 verifications to available analysts.',
        createdAt: new Date(Date.now() - 12 * 3600000),
      },
    }),
  ]);

  console.log('Created 6 nexus task records:', nexusTasks.map(t => t.id).join(', '));

  // Seed Notifications
  const userId = 'admin'; // default admin user id
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId,
        title: 'Fraud Alert',
        message: 'Deepfake detected in Ananya Desai interview session (87.3% fraud score). Immediate review required.',
        type: 'critical',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'Verification Completed',
        message: 'Priya Sharma verification has been completed successfully.',
        type: 'success',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'SLA At Risk',
        message: '3 verifications are approaching SLA breach. Consider reassigning resources.',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 3600000),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'New Verification Request',
        message: 'Sneha Kulkarni has submitted documents for verification.',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60000),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'Identity Mismatch',
        message: 'Rahul Verma face match score below threshold (38.5%). Manual review needed.',
        type: 'error',
        isRead: true,
        createdAt: new Date(Date.now() - 8 * 3600000),
      },
    }),
  ]);

  console.log('Created 5 notifications:', notifications.map(n => n.id).join(', '));

  // Seed ActivityLogs
  const activityLogs = await Promise.all([
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Login', details: 'Admin logged in from 192.168.1.1', category: 'auth', createdAt: new Date(Date.now() - 1 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Verification Started', details: 'Started verification for Priya Sharma (VER-2024-001)', category: 'verification', createdAt: new Date(Date.now() - 5 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Document Reviewed', details: 'Reviewed Aadhaar card for Rahul Verma', category: 'document', createdAt: new Date(Date.now() - 6 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Fraud Alert Triggered', details: 'Deepfake detected in Ananya Desai session', category: 'security', createdAt: new Date(Date.now() - 2 * 86400000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Verification Completed', details: 'Completed verification for Priya Sharma (VER-2024-001)', category: 'verification', createdAt: new Date(Date.now() - 2 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Consent Received', details: 'Rahul Verma provided consent for verification', category: 'consent', createdAt: new Date(Date.now() - 4 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'LiveID Check', details: 'Arjun Mehta passed LiveID verification (97.3% liveness)', category: 'verification', createdAt: new Date(Date.now() - 1 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Nexus Task Created', details: 'Auto-escalation task created for high-risk verification', category: 'automation', createdAt: new Date(Date.now() - 2 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'Settings Updated', details: 'Updated API key rotation settings', category: 'settings', createdAt: new Date(Date.now() - 10 * 3600000) } }),
    prisma.activityLog.create({ data: { userId: 'admin', userName: 'Admin', action: 'SLA Warning', details: '3 verifications approaching SLA breach', category: 'sla', createdAt: new Date(Date.now() - 45 * 60000) } }),
  ]);

  console.log('Created 10 activity logs:', activityLogs.map(a => a.id).join(', '));

  console.log('\n✅ All seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
