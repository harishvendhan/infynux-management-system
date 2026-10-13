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
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('infynux_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    localStorage.removeItem('infynux_token');
    localStorage.removeItem('infynux_user');
    window.dispatchEvent(new CustomEvent('infynux_unauthorized'));
    throw new Error('Your session has expired. Please log in again.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.error?.message || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return (json && json.data !== undefined ? json.data : json) as T;
}

// Automatically syncs any projects previously saved in local storage to Supabase
export async function syncLocalDraftsToSupabase(): Promise<void> {
  try {
    const localProjectsRaw = localStorage.getItem('infynux_projects');
    if (localProjectsRaw) {
      const localProjects = JSON.parse(localProjectsRaw);
      if (Array.isArray(localProjects)) {
        // Find user-created projects that are not hardcoded sample seeds
        const customProjects = localProjects.filter(
          (p: any) => p && p.id && (p.id.startsWith('p_') || !['p1', 'p2'].includes(p.id))
        );

        for (const proj of customProjects) {
          try {
            await api.createProject({
              name: proj.name,
              clientId: proj.clientId,
              projectType: proj.projectType || 'WEBSITE',
              status: proj.status || 'PLANNING',
              priority: proj.priority || 'MEDIUM',
              startDate: proj.startDate,
              expectedEndDate: proj.expectedEndDate,
              totalValue: Number(proj.totalValue || 0),
              notes: proj.notes,
            });
          } catch (e) {
            console.warn('Could not sync local project to Supabase:', proj.name, e);
          }
        }
      }
    }

    // Clean up all local fallback stores so data is strictly fetched from Supabase
    const keysToRemove = [
      'infynux_projects',
      'infynux_clients',
      'infynux_payments',
      'infynux_leads',
      'infynux_events',
      'infynux_expenses',
      'infynux_employees',
      'infynux_salaries',
      'infynux_activity',
    ];
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error('Error migrating local drafts to Supabase:', err);
  }
}

export const api = {
  // --- DASHBOARD ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary');
  },

  async getRevenueChart(): Promise<Array<{ month: string; revenue: number; expenses: number }>> {
    return request<Array<{ month: string; revenue: number; expenses: number }>>('/dashboard/revenue-chart');
  },

  async getDatabaseStatus(): Promise<{
    connected: boolean;
    provider: string;
    host?: string;
    usersCount?: number;
    projectsCount?: number;
    error?: string;
  }> {
    return request<{
      connected: boolean;
      provider: string;
      host?: string;
      usersCount?: number;
      projectsCount?: number;
      error?: string;
    }>('/dashboard/db-status');
  },

  // --- CLIENTS ---
  async getClients(search?: string, isActive?: boolean): Promise<Client[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Client[]>(`/clients${query}`);
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    return request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // --- PROJECTS ---
  async getProjects(status?: string): Promise<Project[]> {
    const query = status ? `?status=${status}` : '';
    return request<Project[]>(`/projects${query}`);
  },

  async getProjectById(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string): Promise<void> {
    return request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // --- PAYMENTS ---
  async getPayments(projectId?: string): Promise<Payment[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return request<Payment[]>(`/payments${query}`);
  },

  async getDuePaymentsGrouped(): Promise<{
    overdue: Payment[];
    dueThisWeek: Payment[];
    upcoming: Payment[];
    counts: {
      overdueCount: number;
      dueThisWeekCount: number;
      upcomingCount: number;
    };
  }> {
    return request<any>('/payments/due');
  },

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    return request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    return request<Payment>(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePayment(id: string): Promise<void> {
    return request<void>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    return request<Lead[]>('/leads');
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    return request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async convertLeadToClient(
    leadId: string,
    initialProjectName?: string,
    totalValue?: number
  ): Promise<{ client: Client; project: Project | null }> {
    return request<{ client: Client; project: Project | null }>(`/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify({ initialProjectName, totalValue }),
    });
  },

  // --- CALENDAR EVENTS ---
  async getEvents(): Promise<CalendarEvent[]> {
    return request<CalendarEvent[]>('/events');
  },

  async createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return request<CalendarEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return request<CalendarEvent>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: string): Promise<void> {
    return request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  // --- EXPENSES ---
  async getExpenses(): Promise<Expense[]> {
    return request<Expense[]>('/finance/expenses');
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    return request<Expense>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    return request<Expense>(`/finance/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return request<void>(`/finance/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  // --- EMPLOYEES & SALARIES ---
  async getEmployees(): Promise<Employee[]> {
    return request<Employee[]>('/finance/employees');
  },

  async createEmployee(data: {
    name: string;
    roleTitle: string;
    phone?: string | null;
    email?: string | null;
    baseSalary: number;
    isActive?: boolean;
  }): Promise<Employee> {
    return request<Employee>('/finance/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    return request<Employee>(`/finance/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteEmployee(id: string): Promise<void> {
    return request<void>(`/finance/employees/${id}`, {
      method: 'DELETE',
    });
  },

  async getSalaries(month?: string): Promise<Salary[]> {
    const query = month ? `?month=${month}` : '';
    return request<Salary[]>(`/finance/salaries${query}`);
  },

  async createSalary(data: Partial<Salary>): Promise<Salary> {
    return request<Salary>('/finance/salaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSalary(id: string, data: Partial<Salary>): Promise<Salary> {
    return request<Salary>(`/finance/salaries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSalary(id: string): Promise<void> {
    return request<void>(`/finance/salaries/${id}`, {
      method: 'DELETE',
    });
  },
};
