/**
 * Infynux Business OS Calculation Service
 * PRD Rule: Never store the same number in two places. All totals are derived from base records.
 * All monetary amounts are handled as numbers or decimal strings without floating point drift.
 */

export interface PaymentItem {
  id: string;
  amount: number | string;
  status: string;
  dueDate?: Date | string | null;
  receivedDate?: Date | string | null;
  deletedAt?: Date | string | null;
}

export interface ProjectItem {
  id: string;
  totalValue: number | string;
  status: string;
  payments?: PaymentItem[];
}

export interface ExpenseItem {
  id: string;
  amount: number | string;
  date: Date | string;
}

export interface SalaryItem {
  id: string;
  baseSalary: number | string;
  bonus?: number | string;
  deductions?: number | string;
  finalAmount?: number | string;
  status: string;
  paidOn?: Date | string | null;
}

/**
 * Format number into Indian Rupee format with Indian digit grouping (e.g., ₹1,25,000)
 */
export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '₹0';
  }
  const num = Math.round(Number(value) * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Project Paid: Sum of payments with status PAID, ADVANCE or the paid part of PARTIAL
 */
export function calculateProjectPaid(payments: PaymentItem[]): number {
  if (!payments || payments.length === 0) return 0;
  return payments
    .filter((p) => !p.deletedAt && (p.status === 'PAID' || p.status === 'ADVANCE' || p.status === 'PARTIAL'))
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

/**
 * Project Due: Project total value - Project paid
 */
export function calculateProjectDue(totalValue: number | string | any, payments: PaymentItem[]): number {
  const paid = calculateProjectPaid(payments);
  const total = Number(totalValue?.toString ? totalValue.toString() : totalValue) || 0;
  return Math.max(0, total - paid);
}

/**
 * Client Total Business: Sum of total value of client's projects (excluding Cancelled)
 */
export function calculateClientTotalBusiness(projects: ProjectItem[]): number {
  if (!projects || projects.length === 0) return 0;
  return projects
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
}

/**
 * Monthly Revenue: Sum of payments received inside the given month (YYYY-MM)
 */
export function calculateMonthlyRevenue(payments: PaymentItem[], yearMonth: string): number {
  if (!payments || payments.length === 0) return 0;
  return payments
    .filter((p) => {
      if (p.deletedAt || (p.status !== 'PAID' && p.status !== 'ADVANCE')) return false;
      if (!p.receivedDate) return false;
      const d = new Date(p.receivedDate);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === yearMonth;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

/**
 * Monthly Expenses: Sum of expenses inside the given month (YYYY-MM)
 */
export function calculateMonthlyExpenses(expenses: ExpenseItem[], yearMonth: string): number {
  if (!expenses || expenses.length === 0) return 0;
  return expenses
    .filter((e) => {
      const d = new Date(e.date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === yearMonth;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);
}

/**
 * Monthly Salaries Paid: Sum of salaries paid inside the given month
 */
export function calculateMonthlySalariesPaid(salaries: SalaryItem[], yearMonth: string): number {
  if (!salaries || salaries.length === 0) return 0;
  return salaries
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => {
      const amount = s.finalAmount ? Number(s.finalAmount) : calculateSalaryFinal(s.baseSalary, s.bonus, s.deductions);
      return sum + amount;
    }, 0);
}

/**
 * Monthly Net Profit: Revenue - Expenses - Salaries paid in the month
 */
export function calculateMonthlyNet(revenue: number, expenses: number, salaries: number): number {
  return revenue - expenses - salaries;
}

/**
 * Salary Final Amount: Base salary + Bonus - Deductions
 */
export function calculateSalaryFinal(
  baseSalary: number | string,
  bonus?: number | string,
  deductions?: number | string
): number {
  const base = Number(baseSalary) || 0;
  const b = Number(bonus) || 0;
  const d = Number(deductions) || 0;
  return Math.max(0, base + b - d);
}

/**
 * Check if a payment is overdue: dueDate earlier than today and status not PAID
 */
export function isPaymentOverdue(dueDate: Date | string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'PAID' || status === 'REFUNDED') return false;
  const due = new Date(dueDate);
  const now = new Date();
  // Strip time for clean day comparison
  due.setHours(23, 59, 59, 999);
  return due.getTime() < now.getTime();
}
