import { PrismaClient, Role, ProjectType, ProjectStatus, Priority, PaymentStatus, LeadStatus, EventType, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Infynux Business OS database seeding...');

  // 1. Seed or Update Default Admin
  const adminEmail = 'admin@infynux.com';
  const hashedPassword = await bcrypt.hash('Admin@Infynux2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Yogeshwaran',
      role: Role.ADMIN,
      passwordHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: 'Yogeshwaran',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Seed Business Settings
  const settingsCount = await prisma.businessSetting.count();
  if (settingsCount === 0) {
    await prisma.businessSetting.create({
      data: {
        businessName: 'INFYNUXSOLUTIONS',
        logoText: 'INFYNUX',
        currency: 'INR',
        financialYearStartMonth: 4,
        reminderDefaults: 60,
      },
    });
    console.log('✅ Default business settings created.');
  }

  // 3. Seed Sample Employees (Records for assignment & salaries)
  const devEmp = await prisma.employee.create({
    data: {
      name: 'Karthik Raja',
      roleTitle: 'Lead Fullstack Developer',
      email: 'karthik@infynux.com',
      phone: '+91 98765 43210',
      baseSalary: 65000.00,
    },
  });

  const designerEmp = await prisma.employee.create({
    data: {
      name: 'Priya Sharma',
      roleTitle: 'UI/UX & Brand Designer',
      email: 'priya@infynux.com',
      phone: '+91 98765 12345',
      baseSalary: 45000.00,
    },
  });
  console.log('✅ Sample employees seeded.');

  // 4. Seed Sample Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Rajesh Kumar',
      company: 'Apex Healthcare Pvt Ltd',
      phone: '+91 94432 11223',
      email: 'rajesh@apexhealth.in',
      address: 'Indiranagar, Bengaluru, Karnataka',
      notes: 'Leading diagnostics chain. Referred by Anand.',
      isActive: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Anita Verma',
      company: 'Zenith Logistics',
      phone: '+91 98112 33445',
      email: 'anita@zenithlogistics.com',
      address: 'Guindy, Chennai, Tamil Nadu',
      notes: 'Requires fleet tracking web dashboard and mobile driver app.',
      isActive: true,
    },
  });
  console.log('✅ Sample clients seeded.');

  // 5. Seed Sample Projects
  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      name: 'Apex Patient Portal & Booking Engine',
      projectType: ProjectType.WEBSITE,
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startDate: new Date('2026-09-01'),
      expectedEndDate: new Date('2026-11-15'),
      totalValue: 180000.00,
      assignedEmployeeId: devEmp.id,
      notes: 'Full patient self-service portal with lab report downloads.',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      clientId: client2.id,
      name: 'Zenith Dispatch Ops Dashboard',
      projectType: ProjectType.SAAS,
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startDate: new Date('2026-09-15'),
      expectedEndDate: new Date('2026-12-01'),
      totalValue: 250000.00,
      assignedEmployeeId: devEmp.id,
      notes: 'Real-time telemetry and dispatch dashboard.',
    },
  });
  console.log('✅ Sample projects seeded.');

  // 6. Seed Sample Payments (Ledger with Advance, Paid, Due)
  await prisma.payment.createMany({
    data: [
      {
        projectId: project1.id,
        label: 'Advance (30%)',
        amount: 60000.00,
        status: PaymentStatus.PAID,
        receivedDate: new Date('2026-09-05'),
        method: 'Bank Transfer (NEFT)',
        notes: 'Received into HDFC Current Account.',
      },
      {
        projectId: project1.id,
        label: 'Milestone 1 - Design & Architecture Approval',
        amount: 60000.00,
        status: PaymentStatus.PAID,
        receivedDate: new Date('2026-09-28'),
        method: 'Bank Transfer (IMPS)',
        notes: 'Milestone signed off.',
      },
      {
        projectId: project1.id,
        label: 'Final Settlement upon Launch',
        amount: 60000.00,
        status: PaymentStatus.DUE,
        dueDate: new Date('2026-11-20'),
        notes: 'Pending final deployment.',
      },
      {
        projectId: project2.id,
        label: 'Initial Booking Advance',
        amount: 100000.00,
        status: PaymentStatus.PAID,
        receivedDate: new Date('2026-09-18'),
        method: 'UPI / Direct Bank',
        notes: 'Kickoff approved.',
      },
      {
        projectId: project2.id,
        label: 'Sprint 2 Milestone Due',
        amount: 75000.00,
        status: PaymentStatus.DUE,
        dueDate: new Date('2026-10-10'),
        notes: 'Due this upcoming week.',
      },
    ],
  });
  console.log('✅ Sample payments ledger seeded.');

  // 7. Seed Sample Expenses
  await prisma.expense.createMany({
    data: [
      {
        date: new Date('2026-10-01'),
        category: 'Hosting',
        description: 'AWS Cloud & Supabase Pro Tier',
        amount: 4500.00,
        paymentMethod: 'Corporate Credit Card',
      },
      {
        date: new Date('2026-10-02'),
        category: 'Software',
        description: 'GitHub Copilot + Figma Organization Licenses',
        amount: 3200.00,
        paymentMethod: 'Credit Card',
      },
      {
        date: new Date('2026-10-02'),
        category: 'Internet',
        description: 'Office Airtel High-speed Fiber',
        amount: 1999.00,
        paymentMethod: 'UPI',
      },
    ],
  });
  console.log('✅ Sample expenses seeded.');

  // 8. Seed Sample Leads & CRM Pipeline
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Venkatesh Iyer',
      company: 'Iyer Superfoods',
      phone: '+91 97890 55443',
      email: 'venkat@iyersuperfoods.com',
      source: 'Referral',
      interestedService: ProjectType.WEBSITE,
      estimatedValue: 120000.00,
      status: LeadStatus.PROPOSAL_SENT,
      nextFollowUpAt: new Date('2026-10-05T10:00:00Z'),
      notes: 'Reviewed initial proposal. Need minor adjustments to payment schedule.',
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead1.id,
      dueAt: new Date('2026-10-05T10:00:00Z'),
      note: 'Call Venkat to finalize contract terms and close deal.',
      status: 'PENDING',
    },
  });
  console.log('✅ Sample leads and follow-ups seeded.');

  // 9. Seed Sample Events
  await prisma.event.createMany({
    data: [
      {
        type: EventType.MEETING,
        title: 'Sprint Demo & Scope Review',
        clientId: client1.id,
        projectId: project1.id,
        startAt: new Date('2026-10-03T11:00:00Z'),
        endAt: new Date('2026-10-03T12:00:00Z'),
        reminderMinutes: 30,
        status: EventStatus.SCHEDULED,
      },
      {
        type: EventType.FOLLOW_UP,
        title: 'Venkat (Iyer Superfoods) Proposal Follow-up',
        startAt: new Date('2026-10-05T10:00:00Z'),
        reminderMinutes: 15,
        status: EventStatus.SCHEDULED,
      },
    ],
  });

  // 10. Seed Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        entityType: 'PAYMENT',
        entityId: 'seed-payment-1',
        action: 'CREATE',
        summary: 'Payment of ₹60,000 recorded for Apex Healthcare (Advance)',
      },
      {
        entityType: 'CLIENT',
        entityId: client1.id,
        action: 'CREATE',
        summary: 'New client Apex Healthcare onboarded',
      },
      {
        entityType: 'PROJECT',
        entityId: project1.id,
        action: 'CREATE',
        summary: 'Project Apex Patient Portal initialized (₹1,80,000)',
      },
    ],
  });
  console.log('✅ Activity log seeded.');

  console.log('✨ Infynux Business OS database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
