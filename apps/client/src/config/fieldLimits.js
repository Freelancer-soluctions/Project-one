/**
 * Field Limits Configuration
 * Based on apps/server/prisma/schema.prisma
 * Used for maxLength attributes in shadcn UI components
 */

export const FIELD_LIMITS = {
  users: {
    name: 100,
    email: 254,
    password: 100,
    address: 250,
    city: 35,
    document: 128,
    socialSecurity: 128,
    state: 50,
    telephone: 15,
    zipcode: 9,
  },
  notes: {
    title: 50,
    content: 2000,
    color: 6,
  },
  noteColumns: {
    title: 15,
    code: 3,
  },
  news: {
    description: 400,
  },
  events: {
    title: 50,
    description: 200,
    speaker: 20,
    startTime: 5,
    endTime: 5,
  },
  products: {
    sku: 16,
    name: 80,
    description: 2000,
    barCode: 25,
  },
  productCategories: {
    code: 3,
    description: 50,
  },
  productProviders: {
    code: 3,
    name: 100,
    contactName: 60,
    contactEmail: 80,
    contactPhone: 15,
    address: 120,
  },
  productAttributes: {
    name: 50,
    description: 100,
  },
  warehouse: {
    name: 50,
    description: 120,
    address: 120,
  },
  stock: {
    lot: 50,
  },
  inventoryMovement: {
    reason: 200,
  },
  clients: {
    name: 100,
    email: 100,
    phone: 15,
    address: 120,
  },
  employees: {
    name: 100,
    lastName: 100,
    dni: 128,
    phone: 15,
    email: 100,
    address: 120,
    position: 100,
    department: 100,
    salary: 128,
  },
  payroll: {
    baseSalary: 128,
    extraHours: 128,
    deductions: 128,
    totalPayment: 128,
  },
  performanceEvaluation: {
    comments: 200,
  },
  permission: {
    type: 100,
  },
};

export default FIELD_LIMITS;