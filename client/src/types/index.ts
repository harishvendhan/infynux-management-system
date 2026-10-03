export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type ProjectType =
  | 'WEBSITE'
  | 'MOBILE_APP'
  | 'DIGITAL_MARKETING'
  | 'SAAS'
  | 'CLOUD_DEVOPS'
  | 'CONSULTING'
  | 'OTHER';

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CLIENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type PaymentStatus =
  | 'ADVANCE'
  | 'PAID'
  | 'PARTIAL'
  | 'DUE'
  | 'OVERDUE'
  | 'REFUNDED';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'DISCUSSION'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type EventType =
  | 'MEETING'
  | 'FOLLOW_UP'
  | 'PAYMENT'
  | 'TASK'
  | 'DEADLINE'
  | 'OTHER';

export type EventStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  convertedFromLeadId?: string | null;
  createdAt: string;
  metrics?: {
    totalBusiness: number;
    totalPaid: number;
    totalPending: number;
    projectCount: number;
  };
  projects?: Project[];
  followUps?: FollowUp[];
  events?: CalendarEvent[];
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  projectType: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string | null;
  expectedEndDate?: string | null;
  totalValue: number;
  assignedEmployeeId?: string | null;
  notes?: string | null;
  createdAt: string;
  client?: { id?: string; name: string; company?: string | null; phone?: string | null };
  assignedEmployee?: { id: string; name: string; roleTitle: string } | null;
  payments?: Payment[];
  metrics?: {
    amountPaid: number;
    amountDue: number;
    progressPercentage: number;
  };
}

export interface Payment {
  id: string;
  projectId: string;
  label: string;
  amount: number;
  dueDate?: string | null;
  receivedDate?: string | null;
  status: PaymentStatus;
  method?: string | null;
  notes?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
    totalValue: number;
    client?: { id?: string; name: string; company?: string | null; phone?: string | null };
  };
}

export interface Lead {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  interestedService?: ProjectType | null;
  estimatedValue?: number | null;
  status: LeadStatus;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  convertedClientId?: string | null;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  clientId?: string | null;
  leadId?: string | null;
  dueAt: string;
  note: string;
  status: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  notes?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  startAt: string;
  endAt?: string | null;
  allDay: boolean;
  reminderMinutes?: number | null;
  status: EventStatus;
  client?: { id: string; name: string; company?: string | null } | null;
  project?: { id: string; name: string } | null;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  employeeId?: string | null;
  notes?: string | null;
  createdAt?: string;
  employee?: { id: string; name: string; roleTitle: string } | null;
}

export interface Employee {
  id: string;
  name: string;
  roleTitle: string;
  phone?: string | null;
  email?: string | null;
  baseSalary: number;
  isActive: boolean;
}

export interface Salary {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  finalAmount: number;
  status: string;
  paidOn?: string | null;
  notes?: string | null;
  employee?: { id: string; name: string; roleTitle: string } | null;
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    revenueThisMonth: number;
    pendingAmount: number;
    expensesThisMonth: number;
    salariesPaidThisMonth: number;
    netProfit: number;
    activeClientsCount: number;
    activeProjectsCount: number;
  };
  todaysTasks: CalendarEvent[];
  upcomingPayments: Payment[];
  recentActivity: ActivityLog[];
}
