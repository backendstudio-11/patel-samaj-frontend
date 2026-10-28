export interface UserProfileDTO {
  fullName: string;
  mobileNumber: string;
  email?: string;
  roleName?: string;
}

export interface UserDTO {
  userId: number;
  fullName: string;
  mobileNumber: string;
  isActive: boolean;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  userId?: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  isActive: boolean;
  roleName?: string;
}

export interface Donor {
  donorId: number;
  fullName: string;
  amount: number;
  donationDate: string; // ISO date string
  remarks?: string;
}

export interface Item {
  itemId: number;
  itemName: string;
  currentPrice: number;
  description?: string;
}

export interface EventItem {
  itemId: number;
  itemName: string;
  quantity: number;
  priceAtBooking: number;
}

export enum EventStatus {
  PENDING = 1,
  APPROVED = 2,
  IN_PROGRESS = 3,
  CLOSED = 4,
  REJECTED = 5,
}

export interface PaginationDTO {
  search: string;
  page: number;
  size: number;
}

export interface Event {
  eventId: number;
  familyHeadName: string;
  contactNumber: string;
  email: string;
  eventType: string;
  startDate: string; 
  endDate: string; 
  statusId: EventStatus | number | null;
  isClosed: boolean | null;
  totalAmount: number;
  items: EventItem[];
  remarks?: string;
  paidAmount?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Expense {
  expenseId: number;
  amount: number;
  expenseDate: string; // ISO date string
  category?: string;
  description?: string;
}

export interface DailyExpenseSummary {
  date: string;
  totalAmount: number;
}

export interface DashboardStats {
  totalDonors: number;
  activeEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  inProgressEvents: number;
  totalExpenses: number;
}
