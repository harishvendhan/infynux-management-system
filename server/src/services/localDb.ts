import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.resolve(__dirname, '../../data/db.json');

// Default initial seed state matching PRD and sample data
function getInitialData() {
  const adminPasswordHash = bcrypt.hashSync('Admin@Infynux2026!', 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const ymString = `${currentYear}-${currentMonth}`;

  return {
    users: [
      {
        id: 'admin-infynux-1',
        email: 'admin@infynux.com',
        name: 'Yogeshwaran',
        role: 'ADMIN',
        passwordHash: adminPasswordHash,
        createdAt: new Date('2026-08-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    businessSettings: [
      {
        id: 'bs-1',
        businessName: 'INFYNUXSOLUTIONS',
        logoText: 'INFYNUX',
        currency: 'INR',
        financialYearStartMonth: 4,
        reminderDefaults: 60,
        updatedAt: new Date().toISOString(),
      },
    ],
    employees: [
      {
        id: 'emp1',
        name: 'Karthik Raja',
        roleTitle: 'Lead Fullstack Developer',
        email: 'karthik@infynux.com',
        phone: '+91 98765 43210',
        baseSalary: 65000,
        isActive: true,
        createdAt: new Date('2026-08-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp2',
        name: 'Priya Sharma',
        roleTitle: 'UI/UX & Brand Designer',
        email: 'priya@infynux.com',
        phone: '+91 98765 12345',
        baseSalary: 45000,
        isActive: true,
        createdAt: new Date('2026-08-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    clients: [
      {
        id: 'c1',
        name: 'Rajesh Kumar',
        company: 'Apex Healthcare Pvt Ltd',
        phone: '+91 94432 11223',
        email: 'rajesh@apexhealth.in',
        address: 'Indiranagar, Bengaluru, Karnataka',
        notes: 'Leading diagnostics chain. Referred by Anand.',
        isActive: true,
        convertedFromLeadId: null,
        createdAt: new Date('2026-08-15T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'c2',
        name: 'Anita Verma',
        company: 'Zenith Logistics',
        phone: '+91 98112 33445',
        email: 'anita@zenithlogistics.com',
        address: 'Guindy, Chennai, Tamil Nadu',
        notes: 'Requires fleet tracking web dashboard and mobile driver app.',
        isActive: true,
        convertedFromLeadId: null,
        createdAt: new Date('2026-09-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    projects: [
      {
        id: 'p1',
        clientId: 'c1',
        name: 'Apex Patient Portal & Booking Engine',
        projectType: 'WEBSITE',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: '2026-09-01T00:00:00Z',
        expectedEndDate: '2026-11-15T00:00:00Z',
        totalValue: 180000,
        assignedEmployeeId: 'emp1',
        notes: 'Full patient self-service portal with lab report downloads.',
        createdAt: new Date('2026-09-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        clientId: 'c2',
        name: 'Zenith Dispatch Ops Dashboard',
        projectType: 'SAAS',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: '2026-09-15T00:00:00Z',
        expectedEndDate: '2026-12-01T00:00:00Z',
        totalValue: 250000,
        assignedEmployeeId: 'emp1',
        notes: 'Real-time telemetry and dispatch dashboard.',
        createdAt: new Date('2026-09-15T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    payments: [
      {
        id: 'pay1',
        projectId: 'p1',
        label: 'Advance (30%)',
        amount: 60000,
        dueDate: null,
        receivedDate: '2026-09-05T10:00:00Z',
        status: 'PAID',
        method: 'Bank Transfer (NEFT)',
        notes: 'Received into HDFC Current Account.',
        deletedAt: null,
        createdAt: new Date('2026-09-05T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pay2',
        projectId: 'p1',
        label: 'Milestone 1 - Design & Architecture Approval',
        amount: 60000,
        dueDate: null,
        receivedDate: '2026-09-28T10:00:00Z',
        status: 'PAID',
        method: 'Bank Transfer (IMPS)',
        notes: 'Milestone signed off.',
        deletedAt: null,
        createdAt: new Date('2026-09-28T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pay3',
        projectId: 'p1',
        label: 'Final Settlement upon Launch',
        amount: 60000,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        receivedDate: null,
        status: 'DUE',
        method: null,
        notes: 'Pending final deployment.',
        deletedAt: null,
        createdAt: new Date('2026-09-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pay4',
        projectId: 'p2',
        label: 'Initial Booking Advance',
        amount: 100000,
        dueDate: null,
        receivedDate: '2026-09-18T10:00:00Z',
        status: 'PAID',
        method: 'UPI / Direct Bank',
        notes: 'Kickoff approved.',
        deletedAt: null,
        createdAt: new Date('2026-09-18T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pay5',
        projectId: 'p2',
        label: 'Sprint 2 Milestone Due',
        amount: 75000,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        receivedDate: null,
        status: 'DUE',
        method: null,
        notes: 'Due this upcoming week.',
        deletedAt: null,
        createdAt: new Date('2026-09-15T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    expenses: [
      {
        id: 'exp1',
        date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        category: 'Hosting',
        description: 'AWS Cloud & Supabase Pro Tier',
        amount: 4500,
        paymentMethod: 'Corporate Credit Card',
        employeeId: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp2',
        date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
        category: 'Software',
        description: 'GitHub Copilot + Figma Organization Licenses',
        amount: 3200,
        paymentMethod: 'Credit Card',
        employeeId: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp3',
        date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
        category: 'Internet',
        description: 'Office Airtel High-speed Fiber',
        amount: 1999,
        paymentMethod: 'UPI',
        employeeId: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    salaries: [
      {
        id: 'sal1',
        employeeId: 'emp1',
        month: ymString,
        baseSalary: 65000,
        bonus: 0,
        deductions: 0,
        finalAmount: 65000,
        status: 'PENDING',
        paidOn: null,
        notes: 'Monthly payroll',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sal2',
        employeeId: 'emp2',
        month: ymString,
        baseSalary: 45000,
        bonus: 0,
        deductions: 0,
        finalAmount: 45000,
        status: 'PENDING',
        paidOn: null,
        notes: 'Monthly payroll',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    leads: [
      {
        id: 'lead1',
        name: 'Venkatesh Iyer',
        company: 'Iyer Superfoods',
        phone: '+91 97890 55443',
        email: 'venkat@iyersuperfoods.com',
        source: 'Referral',
        interestedService: 'WEBSITE',
        estimatedValue: 120000,
        status: 'PROPOSAL_SENT',
        nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Reviewed initial proposal. Need minor adjustments to payment schedule.',
        convertedClientId: null,
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    followUps: [
      {
        id: 'fu1',
        clientId: null,
        leadId: 'lead1',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        note: 'Call Venkat to finalize contract terms and close deal.',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'ev1',
        type: 'MEETING',
        title: 'Sprint Demo & Scope Review',
        notes: 'Review milestone progress with Apex Healthcare team',
        clientId: 'c1',
        projectId: 'p1',
        startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0).toISOString(),
        endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0).toISOString(),
        allDay: false,
        reminderMinutes: 30,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ev2',
        type: 'FOLLOW_UP',
        title: 'Venkat (Iyer Superfoods) Proposal Follow-up',
        notes: 'Check feedback on proposal',
        clientId: null,
        projectId: null,
        startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30, 0).toISOString(),
        endAt: null,
        allDay: false,
        reminderMinutes: 15,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activityLogs: [
      {
        id: 'act1',
        entityType: 'PROJECT',
        entityId: 'p1',
        action: 'CREATE',
        summary: 'Created new project "Apex Patient Portal & Booking Engine" for Apex Healthcare Pvt Ltd',
        createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
      },
      {
        id: 'act2',
        entityType: 'PAYMENT',
        entityId: 'pay1',
        action: 'UPDATE',
        summary: 'Recorded PAID payment "Advance (30%)" of ₹60,000 for project "Apex Patient Portal & Booking Engine"',
        createdAt: new Date('2026-09-05T14:30:00Z').toISOString(),
      },
      {
        id: 'act3',
        entityType: 'PAYMENT',
        entityId: 'pay4',
        action: 'UPDATE',
        summary: 'Recorded PAID payment "Initial Booking Advance" of ₹1,00,000 for project "Zenith Dispatch Ops Dashboard"',
        createdAt: new Date('2026-09-18T11:15:00Z').toISOString(),
      },
    ],
  };
}

class LocalDatabase {
  private data: any = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('⚠️ Could not load local db file, using fresh initial seed:', err);
      this.data = getInitialData();
    }
  }

  private save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local db:', err);
    }
  }

  public getRawData() {
    return this.data;
  }

  // Model helper builder
  private createModelOps(collectionName: string) {
    return {
      findMany: async (args: any = {}) => {
        let list: any[] = [...(this.data[collectionName] || [])];
        const where = args.where || {};

        list = list.filter((item) => this.matchWhere(item, where));

        // Sorting
        if (args.orderBy) {
          const orderRules = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
          list.sort((a, b) => {
            for (const rule of orderRules) {
              const [key, dir] = Object.entries(rule)[0] as [string, string];
              const valA = a[key];
              const valB = b[key];
              if (valA === valB) continue;
              if (valA === null || valA === undefined) return 1;
              if (valB === null || valB === undefined) return -1;
              const cmp = valA < valB ? -1 : 1;
              return dir.toLowerCase() === 'desc' ? -cmp : cmp;
            }
            return 0;
          });
        }

        // Pagination
        if (args.skip) {
          list = list.slice(args.skip);
        }
        if (args.take) {
          list = list.slice(0, args.take);
        }

        // Include relations
        return list.map((item) => this.resolveIncludes(collectionName, item, args.include, args.select));
      },

      findUnique: async (args: any = {}) => {
        const where = args.where || {};
        const item = (this.data[collectionName] || []).find((entry: any) => {
          for (const [k, v] of Object.entries(where)) {
            if (entry[k] !== v) return false;
          }
          return true;
        });
        if (!item) return null;
        return this.resolveIncludes(collectionName, item, args.include, args.select);
      },

      findFirst: async (args: any = {}) => {
        const list = await this.createModelOps(collectionName).findMany({ ...args, take: 1 });
        return list.length > 0 ? list[0] : null;
      },

      count: async (args: any = {}) => {
        const where = args.where || {};
        const list = (this.data[collectionName] || []).filter((item: any) => this.matchWhere(item, where));
        return list.length;
      },

      create: async (args: any = {}) => {
        const id = args.data.id || `${collectionName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newItem = {
          id,
          ...args.data,
          createdAt: args.data.createdAt ? new Date(args.data.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (!this.data[collectionName]) this.data[collectionName] = [];
        this.data[collectionName].push(newItem);
        this.save();
        return this.resolveIncludes(collectionName, newItem, args.include, args.select);
      },

      createMany: async (args: any = {}) => {
        const items = args.data || [];
        const created: any[] = [];
        for (const d of items) {
          const id = d.id || `${collectionName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newItem = {
            id,
            ...d,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.data[collectionName].push(newItem);
          created.push(newItem);
        }
        this.save();
        return { count: created.length };
      },

      update: async (args: any = {}) => {
        const where = args.where || {};
        const list = this.data[collectionName] || [];
        const index = list.findIndex((entry: any) => {
          for (const [k, v] of Object.entries(where)) {
            if (entry[k] !== v) return false;
          }
          return true;
        });

        if (index === -1) {
          throw new Error(`Record to update not found in ${collectionName}`);
        }

        const existing = list[index];
        const updated = {
          ...existing,
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        list[index] = updated;
        this.save();
        return this.resolveIncludes(collectionName, updated, args.include, args.select);
      },

      updateMany: async (args: any = {}) => {
        const where = args.where || {};
        const list = this.data[collectionName] || [];
        let count = 0;
        for (let i = 0; i < list.length; i++) {
          if (this.matchWhere(list[i], where)) {
            list[i] = { ...list[i], ...args.data, updatedAt: new Date().toISOString() };
            count++;
          }
        }
        if (count > 0) this.save();
        return { count };
      },

      delete: async (args: any = {}) => {
        const where = args.where || {};
        const list = this.data[collectionName] || [];
        const index = list.findIndex((entry: any) => {
          for (const [k, v] of Object.entries(where)) {
            if (entry[k] !== v) return false;
          }
          return true;
        });

        if (index === -1) {
          throw new Error(`Record to delete not found in ${collectionName}`);
        }

        const removed = list.splice(index, 1)[0];
        this.save();
        return removed;
      },

      deleteMany: async (args: any = {}) => {
        const where = args.where || {};
        const list = this.data[collectionName] || [];
        const initialLen = list.length;
        this.data[collectionName] = list.filter((item: any) => !this.matchWhere(item, where));
        const count = initialLen - this.data[collectionName].length;
        if (count > 0) this.save();
        return { count };
      },

      upsert: async (args: any = {}) => {
        const where = args.where || {};
        const list = this.data[collectionName] || [];
        const index = list.findIndex((entry: any) => {
          for (const [k, v] of Object.entries(where)) {
            if (entry[k] !== v) return false;
          }
          return true;
        });

        if (index !== -1) {
          const updated = { ...list[index], ...args.update, updatedAt: new Date().toISOString() };
          list[index] = updated;
          this.save();
          return this.resolveIncludes(collectionName, updated, args.include, args.select);
        } else {
          return this.createModelOps(collectionName).create({
            data: { ...where, ...args.create },
            include: args.include,
            select: args.select,
          });
        }
      },
    };
  }

  private matchWhere(item: any, where: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;

    for (const [key, condition] of Object.entries(where)) {
      if (condition === undefined) continue;

      // Special handling for relation filters (e.g., project: { clientId })
      if (key === 'project' && typeof condition === 'object' && condition !== null) {
        const proj = (this.data.projects || []).find((p: any) => p.id === item.projectId);
        if (!proj) return false;
        if (!this.matchWhere(proj, condition)) return false;
        continue;
      }
      if (key === 'projects' && typeof condition === 'object' && condition !== null) {
        const projs = (this.data.projects || []).filter((p: any) => p.clientId === item.id);
        if ((condition as any).some) {
          const hasSome = projs.some((p: any) => this.matchWhere(p, (condition as any).some));
          if (!hasSome) return false;
          continue;
        }
      }

      const itemVal = item[key];

      if (condition === null) {
        if (itemVal !== null && itemVal !== undefined) return false;
        continue;
      }

      if (typeof condition === 'object' && !(condition instanceof Date)) {
        if ('in' in condition && Array.isArray(condition.in)) {
          if (!condition.in.includes(itemVal)) return false;
        }
        if ('not' in condition) {
          if (condition.not === null) {
            if (itemVal === null || itemVal === undefined) return false;
          } else if (itemVal === condition.not) {
            return false;
          }
        }
        if ('notIn' in condition && Array.isArray(condition.notIn)) {
          if (condition.notIn.includes(itemVal)) return false;
        }
        if ('gte' in condition) {
          const comp = (condition as any).gte instanceof Date ? (condition as any).gte.getTime() : new Date(String((condition as any).gte)).getTime();
          const target = itemVal instanceof Date ? itemVal.getTime() : new Date(String(itemVal)).getTime();
          if (isNaN(target) || target < comp) return false;
        }
        if ('lte' in condition) {
          const comp = (condition as any).lte instanceof Date ? (condition as any).lte.getTime() : new Date(String((condition as any).lte)).getTime();
          const target = itemVal instanceof Date ? itemVal.getTime() : new Date(String(itemVal)).getTime();
          if (isNaN(target) || target > comp) return false;
        }
        if ('gt' in condition) {
          const comp = (condition as any).gt instanceof Date ? (condition as any).gt.getTime() : new Date(String((condition as any).gt)).getTime();
          const target = itemVal instanceof Date ? itemVal.getTime() : new Date(String(itemVal)).getTime();
          if (isNaN(target) || target <= comp) return false;
        }
        if ('lt' in condition) {
          const comp = (condition as any).lt instanceof Date ? (condition as any).lt.getTime() : new Date(String((condition as any).lt)).getTime();
          const target = itemVal instanceof Date ? itemVal.getTime() : new Date(String(itemVal)).getTime();
          if (isNaN(target) || target >= comp) return false;
        }
        if ('contains' in condition) {
          const str = String(itemVal || '').toLowerCase();
          const target = String(condition.contains).toLowerCase();
          if (!str.includes(target)) return false;
        }
      } else {
        if (itemVal !== condition) return false;
      }
    }

    return true;
  }

  private resolveIncludes(collectionName: string, item: any, include?: any, select?: any): any {
    if (!item) return item;
    let res = { ...item };

    if (include) {
      if (include.client) {
        const client = (this.data.clients || []).find((c: any) => c.id === item.clientId);
        res.client = client
          ? this.resolveIncludes('clients', client, include.client.include, include.client.select)
          : null;
      }
      if (include.project) {
        const project = (this.data.projects || []).find((p: any) => p.id === item.projectId);
        res.project = project
          ? this.resolveIncludes('projects', project, include.project.include, include.project.select)
          : null;
      }
      if (include.projects) {
        const projs = (this.data.projects || []).filter((p: any) => p.clientId === item.id);
        const where = include.projects.where;
        const filtered = where ? projs.filter((p: any) => this.matchWhere(p, where)) : projs;
        res.projects = filtered.map((p: any) =>
          this.resolveIncludes('projects', p, include.projects.include, include.projects.select)
        );
      }
      if (include.payments) {
        const pays = (this.data.payments || []).filter((p: any) => p.projectId === item.id);
        const where = include.payments.where;
        const filtered = where ? pays.filter((p: any) => this.matchWhere(p, where)) : pays;
        res.payments = filtered.map((p: any) =>
          this.resolveIncludes('payments', p, include.payments.include, include.payments.select)
        );
      }
      if (include.assignedEmployee || include.employee) {
        const empId = item.assignedEmployeeId || item.employeeId;
        const emp = (this.data.employees || []).find((e: any) => e.id === empId);
        if (include.assignedEmployee) res.assignedEmployee = emp || null;
        if (include.employee) res.employee = emp || null;
      }
      if (include.followUps) {
        const fus = (this.data.followUps || []).filter(
          (f: any) => (item.id && f.leadId === item.id) || f.clientId === item.id
        );
        res.followUps = fus;
      }
      if (include.events) {
        const evs = (this.data.events || []).filter(
          (e: any) => (item.id && e.clientId === item.id) || e.projectId === item.id
        );
        res.events = evs;
      }
    }

    if (select) {
      const selected: any = {};
      for (const [key, val] of Object.entries(select)) {
        if (val) {
          selected[key] = res[key];
        }
      }
      return selected;
    }

    return res;
  }

  // Model accessors
  public user = this.createModelOps('users');
  public businessSetting = this.createModelOps('businessSettings');
  public employee = this.createModelOps('employees');
  public client = this.createModelOps('clients');
  public project = this.createModelOps('projects');
  public payment = this.createModelOps('payments');
  public expense = this.createModelOps('expenses');
  public salary = this.createModelOps('salaries');
  public lead = this.createModelOps('leads');
  public followUp = this.createModelOps('followUps');
  public event = this.createModelOps('events');
  public activityLog = this.createModelOps('activityLogs');

  public $transaction = async (fnOrArray: any) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(this);
    }
    if (Array.isArray(fnOrArray)) {
      const results = [];
      for (const p of fnOrArray) {
        results.push(await p);
      }
      return results;
    }
    return null;
  };

  public $queryRaw = async (...args: any[]) => {
    return [{ 1: 1 }];
  };
}

export const localDb = new LocalDatabase();

