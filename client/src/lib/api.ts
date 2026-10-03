import {
  Client,
  Project,
  Payment,
  Lead,
  CalendarEvent,
  Expense,
  Employee,
  Salary,
  DashboardSummary,
  ActivityLog,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

// Seed Initial Mock State for instant preview prior to database connection
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Rajesh Kumar',
    company: 'Apex Healthcare Pvt Ltd',
    phone: '+91 94432 11223',
    email: 'rajesh@apexhealth.in',
    address: 'Indiranagar, Bengaluru, Karnataka',
    notes: 'Diagnostics chain. Key account.',
    isActive: true,
    createdAt: new Date('2026-08-15').toISOString(),
    metrics: {
      totalBusiness: 180000,
      totalPaid: 120000,
      totalPending: 60000,
      projectCount: 1,
    },
  },
  {
    id: 'c2',
    name: 'Anita Verma',
    company: 'Zenith Logistics',
    phone: '+91 98112 33445',
    email: 'anita@zenithlogistics.com',
    address: 'Guindy, Chennai, Tamil Nadu',
    notes: 'Fleet management telemetry and driver mobile app.',
    isActive: true,
    createdAt: new Date('2026-09-01').toISOString(),
    metrics: {
      totalBusiness: 250000,
      totalPaid: 100000,
      totalPending: 150000,
      projectCount: 1,
    },
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    name: 'Apex Patient Portal & Booking Engine',
    projectType: 'WEBSITE',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    startDate: '2026-09-01',
    expectedEndDate: '2026-11-15',
    totalValue: 180000,
    notes: 'Full patient self-service portal with lab report downloads.',
    createdAt: new Date('2026-09-01').toISOString(),
    client: { name: 'Rajesh Kumar', company: 'Apex Healthcare Pvt Ltd' },
    metrics: {
      amountPaid: 120000,
      amountDue: 60000,
      progressPercentage: 67,
    },
  },
  {
    id: 'p2',
    clientId: 'c2',
    name: 'Zenith Dispatch Ops Dashboard',
    projectType: 'SAAS',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    startDate: '2026-09-15',
    expectedEndDate: '2026-12-01',
    totalValue: 250000,
    notes: 'Real-time telemetry and dispatch dashboard.',
    createdAt: new Date('2026-09-15').toISOString(),
    client: { name: 'Anita Verma', company: 'Zenith Logistics' },
    metrics: {
      amountPaid: 100000,
      amountDue: 150000,
      progressPercentage: 40,
    },
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay1',
    projectId: 'p1',
    label: 'Advance (30%)',
    amount: 60000,
    status: 'PAID',
    receivedDate: '2026-09-05',
    method: 'Bank Transfer (NEFT)',
    notes: 'Received into HDFC Current Account.',
    createdAt: new Date('2026-09-05').toISOString(),
    project: {
      id: 'p1',
      name: 'Apex Patient Portal & Booking Engine',
      totalValue: 180000,
      client: { id: 'c1', name: 'Rajesh Kumar', company: 'Apex Healthcare' },
    },
  },
  {
    id: 'pay2',
    projectId: 'p1',
    label: 'Milestone 1 - Design & Architecture Approval',
    amount: 60000,
    status: 'PAID',
    receivedDate: '2026-09-28',
    method: 'Bank Transfer (IMPS)',
    notes: 'Milestone signed off.',
    createdAt: new Date('2026-09-28').toISOString(),
    project: {
      id: 'p1',
      name: 'Apex Patient Portal & Booking Engine',
      totalValue: 180000,
      client: { id: 'c1', name: 'Rajesh Kumar', company: 'Apex Healthcare' },
    },
  },
  {
    id: 'pay3',
    projectId: 'p1',
    label: 'Final Settlement upon Launch',
    amount: 60000,
    status: 'DUE',
    dueDate: '2026-11-20',
    notes: 'Pending final deployment.',
    createdAt: new Date('2026-09-01').toISOString(),
    project: {
      id: 'p1',
      name: 'Apex Patient Portal & Booking Engine',
      totalValue: 180000,
      client: { id: 'c1', name: 'Rajesh Kumar', company: 'Apex Healthcare' },
    },
  },
  {
    id: 'pay4',
    projectId: 'p2',
    label: 'Initial Booking Advance',
    amount: 100000,
    status: 'PAID',
    receivedDate: '2026-09-18',
    method: 'UPI / Direct Bank',
    notes: 'Kickoff approved.',
    createdAt: new Date('2026-09-18').toISOString(),
    project: {
      id: 'p2',
      name: 'Zenith Dispatch Ops Dashboard',
      totalValue: 250000,
      client: { id: 'c2', name: 'Anita Verma', company: 'Zenith Logistics' },
    },
  },
  {
    id: 'pay5',
    projectId: 'p2',
    label: 'Sprint 2 Milestone Due',
    amount: 75000,
    status: 'DUE',
    dueDate: '2026-10-08',
    notes: 'Due this upcoming week.',
    createdAt: new Date('2026-09-15').toISOString(),
    project: {
      id: 'p2',
      name: 'Zenith Dispatch Ops Dashboard',
      totalValue: 250000,
      client: { id: 'c2', name: 'Anita Verma', company: 'Zenith Logistics' },
    },
  },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Venkatesh Iyer',
    company: 'Iyer Superfoods',
    phone: '+91 97890 55443',
    email: 'venkat@iyersuperfoods.com',
    source: 'Referral',
    interestedService: 'WEBSITE',
    estimatedValue: 120000,
    status: 'PROPOSAL_SENT',
    nextFollowUpAt: '2026-10-05T10:00:00.000Z',
    notes: 'Reviewed initial proposal. Need minor adjustments to payment schedule.',
    createdAt: new Date('2026-09-20').toISOString(),
  },
  {
    id: 'l2',
    name: 'Rohit Shenoy',
    company: 'FinStack AI',
    phone: '+91 99001 22334',
    email: 'rohit@finstack.ai',
    source: 'Website',
    interestedService: 'SAAS',
    estimatedValue: 350000,
    status: 'DISCUSSION',
    nextFollowUpAt: '2026-10-09T14:30:00.000Z',
    notes: 'Discussion on architecture and LLM latency optimization.',
    createdAt: new Date('2026-09-25').toISOString(),
  },
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    type: 'MEETING',
    title: 'Sprint Demo & Scope Review',
    clientId: 'c1',
    projectId: 'p1',
    startAt: '2026-10-03T11:00:00.000Z',
    endAt: '2026-10-03T12:00:00.000Z',
    allDay: false,
    reminderMinutes: 30,
    status: 'SCHEDULED',
    client: { id: 'c1', name: 'Rajesh Kumar', company: 'Apex Healthcare' },
  },
  {
    id: 'e2',
    type: 'FOLLOW_UP',
    title: 'Venkat (Iyer Superfoods) Proposal Follow-up',
    startAt: '2026-10-05T10:00:00.000Z',
    allDay: false,
    reminderMinutes: 15,
    status: 'SCHEDULED',
  },
  {
    id: 'e3',
    type: 'PAYMENT',
    title: 'Payment Due: Sprint 2 Milestone (₹75,000) - Zenith Logistics',
    startAt: '2026-10-08T00:00:00.000Z',
    allDay: true,
    reminderMinutes: 1440,
    status: 'SCHEDULED',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    date: '2026-10-01',
    category: 'Hosting',
    description: 'AWS Cloud & Supabase Pro Tier',
    amount: 4500,
    paymentMethod: 'Corporate Credit Card',
    createdAt: new Date('2026-10-01').toISOString(),
  },
  {
    id: 'exp2',
    date: '2026-10-02',
    category: 'Software',
    description: 'GitHub Copilot + Figma Licenses',
    amount: 3200,
    paymentMethod: 'Credit Card',
    createdAt: new Date('2026-10-02').toISOString(),
  },
  {
    id: 'exp3',
    date: '2026-10-02',
    category: 'Internet',
    description: 'Office Airtel High-speed Fiber',
    amount: 1999,
    paymentMethod: 'UPI',
    createdAt: new Date('2026-10-02').toISOString(),
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp1',
    name: 'Karthik Raja',
    roleTitle: 'Lead Fullstack Developer',
    phone: '+91 98765 43210',
    email: 'karthik@infynux.com',
    baseSalary: 65000,
    isActive: true,
  },
  {
    id: 'emp2',
    name: 'Priya Sharma',
    roleTitle: 'UI/UX & Brand Designer',
    phone: '+91 98765 12345',
    email: 'priya@infynux.com',
    baseSalary: 45000,
    isActive: true,
  },
];

const INITIAL_SALARIES: Salary[] = [
  {
    id: 'sal1',
    employeeId: 'emp1',
    month: '2026-10',
    baseSalary: 65000,
    bonus: 5000,
    deductions: 2000,
    finalAmount: 68000,
    status: 'PAID',
    paidOn: '2026-10-01',
    notes: 'October salary and sprint performance bonus',
    employee: { id: 'emp1', name: 'Karthik Raja', roleTitle: 'Lead Fullstack Developer' },
  },
  {
    id: 'sal2',
    employeeId: 'emp2',
    month: '2026-10',
    baseSalary: 45000,
    bonus: 0,
    deductions: 0,
    finalAmount: 45000,
    status: 'PENDING',
    notes: 'Scheduled for disbursement',
    employee: { id: 'emp2', name: 'Priya Sharma', roleTitle: 'UI/UX Designer' },
  },
];

const INITIAL_ACTIVITY: ActivityLog[] = [
  {
    id: 'act1',
    entityType: 'PAYMENT',
    entityId: 'pay2',
    action: 'CREATE',
    summary: 'Payment of ₹60,000 received for Apex Healthcare (Milestone 1)',
    createdAt: '2026-09-28T14:20:00.000Z',
  },
  {
    id: 'act2',
    entityType: 'PAYMENT',
    entityId: 'pay4',
    action: 'CREATE',
    summary: 'Payment of ₹1,00,000 received for Zenith Logistics (Advance)',
    createdAt: '2026-09-18T10:15:00.000Z',
  },
  {
    id: 'act3',
    entityType: 'PROJECT',
    entityId: 'p2',
    action: 'CREATE',
    summary: 'Project Zenith Dispatch Ops Dashboard initialized (₹2,50,000)',
    createdAt: '2026-09-15T09:00:00.000Z',
  },
];

// In-Memory store backed by localStorage
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`infynux_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`infynux_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

function recalculateProjectAndClientMetrics(): void {
  try {
    const projects = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    const payments = getLocal<Payment[]>('payments', INITIAL_PAYMENTS);
    const clients = getLocal<Client[]>('clients', INITIAL_CLIENTS);

    const updatedProjects = projects.map((p) => {
      // Find all payments for this project that are not deleted
      const projPayments = payments.filter((pay) => pay.projectId === p.id && !pay.deletedAt);
      const amountPaid = projPayments
        .filter((pay) => pay.status === 'PAID' || pay.status === 'ADVANCE' || pay.status === 'PARTIAL')
        .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
      const totalVal = Number(p.totalValue || 0);
      const amountDue = Math.max(0, totalVal - amountPaid);
      const progressPercentage =
        totalVal > 0 ? Math.min(100, Math.round((amountPaid / totalVal) * 100)) : 0;

      return {
        ...p,
        metrics: {
          amountPaid,
          amountDue,
          progressPercentage,
        },
      };
    });

    setLocal('projects', updatedProjects);

    const updatedClients = clients.map((c) => {
      const clientProjects = updatedProjects.filter((p) => p.clientId === c.id);
      const totalBusiness = clientProjects
        .filter((p) => p.status !== 'CANCELLED')
        .reduce((sum, p) => sum + Number(p.totalValue || 0), 0);
      const totalPaid = clientProjects.reduce((sum, p) => sum + Number(p.metrics?.amountPaid || 0), 0);
      const totalPending = Math.max(0, totalBusiness - totalPaid);

      return {
        ...c,
        metrics: {
          totalBusiness,
          totalPaid,
          totalPending,
          projectCount: clientProjects.length,
        },
      };
    });

    setLocal('clients', updatedClients);
  } catch (err) {
    console.error('Failed to recalculate metrics', err);
  }
}

// API Helper that checks live backend or falls back seamlessly
export const api = {
  // --- DASHBOARD ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    recalculateProjectAndClientMetrics();
    // Fallback computed from local state
    const clients = getLocal<Client[]>('clients', INITIAL_CLIENTS);
    const projects = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    const payments = getLocal<Payment[]>('payments', INITIAL_PAYMENTS);
    const expenses = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    const events = getLocal<CalendarEvent[]>('events', INITIAL_EVENTS);
    const activity = getLocal<ActivityLog[]>('activity', INITIAL_ACTIVITY);

    const revenueThisMonth = payments
      .filter((p) => p.status === 'PAID' || p.status === 'ADVANCE')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = payments
      .filter((p) => p.status === 'DUE' || p.status === 'OVERDUE' || p.status === 'PARTIAL')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const expensesThisMonth = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const salaries = getLocal<Salary[]>('salaries', INITIAL_SALARIES);
    const salariesPaidThisMonth = salaries
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + Number(s.finalAmount), 0);
    const netProfit = revenueThisMonth - expensesThisMonth - salariesPaidThisMonth;

    return {
      kpis: {
        revenueThisMonth,
        pendingAmount,
        expensesThisMonth,
        salariesPaidThisMonth,
        netProfit,
        activeClientsCount: clients.filter((c) => c.isActive).length,
        activeProjectsCount: projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length,
      },
      todaysTasks: events,
      upcomingPayments: payments.filter((p) => p.status === 'DUE' || p.status === 'OVERDUE'),
      recentActivity: activity,
    };
  },

  async getRevenueChart() {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/revenue-chart`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return [
      { month: 'May', revenue: 65000, expenses: 12000 },
      { month: 'Jun', revenue: 95000, expenses: 14500 },
      { month: 'Jul', revenue: 140000, expenses: 18000 },
      { month: 'Aug', revenue: 110000, expenses: 15200 },
      { month: 'Sep', revenue: 220000, expenses: 22400 },
      { month: 'Oct', revenue: 160000, expenses: 9699 },
    ];
  },

  // --- CLIENTS ---
  async getClients(search?: string, isActive?: boolean): Promise<Client[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('isActive', String(isActive));
      const res = await fetch(`${API_BASE_URL}/clients?${params}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    recalculateProjectAndClientMetrics();
    let list = getLocal<Client[]>('clients', INITIAL_CLIENTS);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }
    if (isActive !== undefined) {
      list = list.filter((c) => c.isActive === isActive);
    }
    return list;
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Client[]>('clients', INITIAL_CLIENTS);
    const newClient: Client = {
      id: 'c_' + Date.now(),
      name: data.name || 'New Client',
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      metrics: {
        totalBusiness: 0,
        totalPaid: 0,
        totalPending: 0,
        projectCount: 0,
      },
    };
    list.unshift(newClient);
    setLocal('clients', list);
    return newClient;
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Client[]>('clients', INITIAL_CLIENTS);
    const index = list.findIndex((c) => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      setLocal('clients', list);
      return list[index];
    }
    throw new Error('Client not found');
  },

  // --- PROJECTS ---
  async getProjects(status?: string): Promise<Project[]> {
    try {
      const url = status ? `${API_BASE_URL}/projects?status=${status}` : `${API_BASE_URL}/projects`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    recalculateProjectAndClientMetrics();
    let list = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    if (status === 'ACTIVE') {
      list = list.filter((p) => p.status !== 'ARCHIVED');
    } else if (status) {
      list = list.filter((p) => p.status === status);
    }
    return list;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    const clients = getLocal<Client[]>('clients', INITIAL_CLIENTS);
    const client = clients.find((c) => c.id === data.clientId);

    const newProject: Project = {
      id: 'p_' + Date.now(),
      clientId: data.clientId || '',
      name: data.name || 'Untitled Project',
      projectType: data.projectType || 'WEBSITE',
      status: data.status || 'PLANNING',
      priority: data.priority || 'MEDIUM',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      expectedEndDate: data.expectedEndDate || null,
      totalValue: Number(data.totalValue || 0),
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      client: { name: client?.name || 'Client', company: client?.company },
      metrics: {
        amountPaid: 0,
        amountDue: Number(data.totalValue || 0),
        progressPercentage: 0,
      },
    };
    list.unshift(newProject);
    setLocal('projects', list);
    recalculateProjectAndClientMetrics();
    return newProject;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      setLocal('projects', list);
      recalculateProjectAndClientMetrics();
      return list[index];
    }
    throw new Error('Project not found');
  },

  // --- PAYMENTS ---
  async getPayments(projectId?: string): Promise<Payment[]> {
    try {
      const url = projectId ? `${API_BASE_URL}/payments?projectId=${projectId}` : `${API_BASE_URL}/payments`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let list = getLocal<Payment[]>('payments', INITIAL_PAYMENTS).filter((p) => !p.deletedAt);
    if (projectId) {
      list = list.filter((p) => p.projectId === projectId);
    }
    return list;
  },

  async getDuePaymentsGrouped() {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/due`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Payment[]>('payments', INITIAL_PAYMENTS).filter((p) => !p.deletedAt);
    const unpaid = list.filter((p) => p.status === 'DUE' || p.status === 'OVERDUE' || p.status === 'PARTIAL');
    return {
      overdue: unpaid.filter((p) => p.status === 'OVERDUE'),
      dueThisWeek: unpaid.filter((p) => p.status === 'DUE'),
      upcoming: unpaid.filter((p) => p.status === 'PARTIAL'),
      counts: {
        overdueCount: unpaid.filter((p) => p.status === 'OVERDUE').length,
        dueThisWeekCount: unpaid.filter((p) => p.status === 'DUE').length,
        upcomingCount: unpaid.filter((p) => p.status === 'PARTIAL').length,
      },
    };
  },

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Payment[]>('payments', INITIAL_PAYMENTS);
    const projects = getLocal<Project[]>('projects', INITIAL_PROJECTS);
    const project = projects.find((p) => p.id === data.projectId);

    const isPaid = data.status === 'PAID' || data.status === 'ADVANCE';
    const newPayment: Payment = {
      id: 'pay_' + Date.now(),
      projectId: data.projectId || '',
      label: data.label || 'Payment',
      amount: Number(data.amount || 0),
      dueDate: data.dueDate || null,
      receivedDate: data.receivedDate || (isPaid ? new Date().toISOString().split('T')[0] : null),
      status: data.status || 'DUE',
      method: data.method || null,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      project: {
        id: project?.id || '',
        name: project?.name || 'Project',
        totalValue: project?.totalValue || 0,
        client: project?.client,
      },
    };
    list.unshift(newPayment);
    setLocal('payments', list);
    recalculateProjectAndClientMetrics();
    return newPayment;
  },

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Payment[]>('payments', INITIAL_PAYMENTS);
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      const isPaid = data.status === 'PAID';
      list[index] = {
        ...list[index],
        ...data,
        receivedDate:
          data.receivedDate !== undefined
            ? data.receivedDate
            : isPaid && !list[index].receivedDate
            ? new Date().toISOString().split('T')[0]
            : list[index].receivedDate,
      };
      setLocal('payments', list);
      recalculateProjectAndClientMetrics();
      return list[index];
    }
    throw new Error('Payment not found');
  },

  async deletePayment(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        return;
      }
    } catch {}

    const list = getLocal<Payment[]>('payments', INITIAL_PAYMENTS);
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index].deletedAt = new Date().toISOString();
      setLocal('payments', list);
      recalculateProjectAndClientMetrics();
    }
  },

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return getLocal<Lead[]>('leads', INITIAL_LEADS);
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Lead[]>('leads', INITIAL_LEADS);
    const newLead: Lead = {
      id: 'l_' + Date.now(),
      name: data.name || 'New Lead',
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      source: data.source || 'Website',
      interestedService: data.interestedService || 'WEBSITE',
      estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : null,
      status: data.status || 'NEW',
      nextFollowUpAt: data.nextFollowUpAt || null,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newLead);
    setLocal('leads', list);
    return newLead;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Lead[]>('leads', INITIAL_LEADS);
    const index = list.findIndex((l) => l.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      setLocal('leads', list);
      return list[index];
    }
    throw new Error('Lead not found');
  },

  async convertLeadToClient(leadId: string, initialProjectName?: string, totalValue?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialProjectName, totalValue }),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const leads = getLocal<Lead[]>('leads', INITIAL_LEADS);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    lead.status = 'WON';
    setLocal('leads', leads);

    const client = await this.createClient({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      notes: `Converted from Lead. ${lead.notes || ''}`,
    });

    let project = null;
    if (initialProjectName || totalValue) {
      project = await this.createProject({
        clientId: client.id,
        name: initialProjectName || `${lead.name} - Project`,
        totalValue: totalValue || lead.estimatedValue || 0,
        status: 'IN_PROGRESS',
      });
    }

    return { client, project };
  },

  // --- CALENDAR EVENTS ---
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return getLocal<CalendarEvent[]>('events', INITIAL_EVENTS);
  },

  async createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<CalendarEvent[]>('events', INITIAL_EVENTS);
    const newEvent: CalendarEvent = {
      id: 'e_' + Date.now(),
      type: data.type || 'MEETING',
      title: data.title || 'Event',
      notes: data.notes || null,
      startAt: data.startAt || new Date().toISOString(),
      endAt: data.endAt || null,
      allDay: data.allDay || false,
      reminderMinutes: data.reminderMinutes || 30,
      status: data.status || 'SCHEDULED',
    };
    list.push(newEvent);
    setLocal('events', list);
    return newEvent;
  },

  // --- EXPENSES ---
  async getExpenses(): Promise<Expense[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/expenses`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    const newExpense: Expense = {
      id: 'exp_' + Date.now(),
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'Other',
      description: data.description || 'Expense',
      amount: Number(data.amount || 0),
      paymentMethod: data.paymentMethod || 'Credit Card',
      notes: data.notes || null,
    };
    list.unshift(newExpense);
    setLocal('expenses', list);
    return newExpense;
  },

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    const index = list.findIndex((e) => e.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      setLocal('expenses', list);
      return list[index];
    }
    throw new Error('Expense not found');
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {}

    let list = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    list = list.filter((e) => e.id !== id);
    setLocal('expenses', list);
  },

  // --- EMPLOYEES & SALARIES ---
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/employees`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    return getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
  },

  async getSalaries(month?: string): Promise<Salary[]> {
    try {
      const url = month ? `${API_BASE_URL}/finance/salaries?month=${month}` : `${API_BASE_URL}/finance/salaries`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let list = getLocal<Salary[]>('salaries', INITIAL_SALARIES);
    if (month) {
      list = list.filter((s) => s.month === month);
    }
    return list;
  },

  async createSalary(data: Partial<Salary>): Promise<Salary> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/salaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Salary[]>('salaries', INITIAL_SALARIES);
    const employees = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === data.employeeId);

    const base = Number(data.baseSalary || emp?.baseSalary || 0);
    const bonus = Number(data.bonus || 0);
    const deductions = Number(data.deductions || 0);
    const finalAmount = Math.max(0, base + bonus - deductions);

    const newSalary: Salary = {
      id: 'sal_' + Date.now(),
      employeeId: data.employeeId || emp?.id || '',
      month: data.month || '2026-10',
      baseSalary: base,
      bonus,
      deductions,
      finalAmount,
      status: data.status || 'PENDING',
      paidOn: data.paidOn || null,
      notes: data.notes || null,
      employee: emp ? { id: emp.id, name: emp.name, roleTitle: emp.roleTitle } : undefined,
    };
    list.unshift(newSalary);
    setLocal('salaries', list);
    return newSalary;
  },

  async updateSalary(id: string, data: Partial<Salary>): Promise<Salary> {
    try {
      const res = await fetch(`${API_BASE_URL}/finance/salaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const list = getLocal<Salary[]>('salaries', INITIAL_SALARIES);
    const index = list.findIndex((s) => s.id === id);
    if (index !== -1) {
      const existing = list[index];
      const base = data.baseSalary !== undefined ? Number(data.baseSalary) : Number(existing.baseSalary);
      const bonus = data.bonus !== undefined ? Number(data.bonus) : Number(existing.bonus);
      const deductions = data.deductions !== undefined ? Number(data.deductions) : Number(existing.deductions);
      const finalAmount = Math.max(0, base + bonus - deductions);

      list[index] = {
        ...existing,
        ...data,
        baseSalary: base,
        bonus,
        deductions,
        finalAmount,
      };
      setLocal('salaries', list);
      return list[index];
    }
    throw new Error('Salary not found');
  },

  async deleteSalary(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/finance/salaries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {}

    let list = getLocal<Salary[]>('salaries', INITIAL_SALARIES);
    list = list.filter((s) => s.id !== id);
    setLocal('salaries', list);
  },
};
