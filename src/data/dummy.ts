export type LeadStatus = "new" | "follow-up" | "demo" | "converted" | "lost";
export type Course = "Basic" | "Advanced" | "Professional";
export type PaymentMethod = "UPI" | "Cash" | "Bank Transfer" | "Cheque";
export type AttendanceStatus = "present" | "absent" | "late";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  course: Course;
  status: LeadStatus;
  source: string;
  followUpDate: string;
  createdAt: string;
  notes: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  dob: string;
  schoolName: string;
  address: string;
  emergencyContact: string;
  fatherName: string;
  fatherContact: string;
  motherName: string;
  motherContact: string;
  guardianName?: string;
  whatsapp: string;
  email: string;
  course: Course;
  batch: string;
  enrollmentDate: string;
  validityStart: string;
  validityEnd: string;
  totalSessions: number;
  feeAmount: number;
  paymentPlan: string;
  photo?: string;
  status: "active" | "inactive";
}

export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  batch: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  installmentNo: number;
  totalInstallments: number;
  notes: string;
  status: "paid" | "pending" | "partial";
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  receipt?: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  date: string;
  audience: "all" | "parents" | "admin";
}

export const DUMMY_LEADS: Lead[] = [
  { id: "L001", name: "Priya Sharma", phone: "9876543210", email: "priya@gmail.com", course: "Basic", status: "new", source: "Website", followUpDate: "2024-02-20", createdAt: "2024-02-15", notes: "Interested in weekend batch" },
  { id: "L002", name: "Aryan Mehta", phone: "9812345678", email: "aryan@gmail.com", course: "Advanced", status: "follow-up", source: "Instagram", followUpDate: "2024-02-18", createdAt: "2024-02-10", notes: "Called once, scheduled demo" },
  { id: "L003", name: "Kavya Reddy", phone: "9988776655", email: "kavya@gmail.com", course: "Professional", status: "demo", source: "Referral", followUpDate: "2024-02-22", createdAt: "2024-02-08", notes: "Demo on Tuesday" },
  { id: "L004", name: "Rohan Gupta", phone: "9001122334", email: "rohan@gmail.com", course: "Basic", status: "converted", source: "Facebook", followUpDate: "2024-02-25", createdAt: "2024-02-05", notes: "Joined morning batch" },
  { id: "L005", name: "Sneha Joshi", phone: "9123456789", email: "sneha@gmail.com", course: "Advanced", status: "new", source: "Website", followUpDate: "2024-02-21", createdAt: "2024-02-14", notes: "Wants trial class first" },
  { id: "L006", name: "Dev Patel", phone: "9554433221", email: "dev@gmail.com", course: "Basic", status: "lost", source: "Walk-in", followUpDate: "2024-02-16", createdAt: "2024-02-01", notes: "Moved to another city" },
  { id: "L007", name: "Ananya Singh", phone: "9876001122", email: "ananya@gmail.com", course: "Professional", status: "follow-up", source: "Instagram", followUpDate: "2024-02-19", createdAt: "2024-02-12", notes: "Very interested, needs discount" },
  { id: "L008", name: "Vikram Nair", phone: "9334455667", email: "vikram@gmail.com", course: "Basic", status: "converted", source: "Referral", followUpDate: "2024-02-28", createdAt: "2024-02-06", notes: "Joined evening batch" },
];

export const DUMMY_STUDENTS: Student[] = [
  {
    id: "S001", rollNumber: "NAS-0001", name: "Aarav Kumar", dob: "2010-05-15", schoolName: "Delhi Public School",
    address: "123 Sector 12, Delhi", emergencyContact: "9876543210", fatherName: "Rajesh Kumar",
    fatherContact: "9876543210", motherName: "Sunita Kumar", motherContact: "9812345678",
    whatsapp: "9876543210", email: "rajesh.kumar@gmail.com", course: "Basic", batch: "Morning A",
    enrollmentDate: "2024-01-10", validityStart: "2024-01-10", validityEnd: "2024-07-10",
    totalSessions: 48, feeAmount: 12000, paymentPlan: "Quarterly", status: "active"
  },
  {
    id: "S002", rollNumber: "NAS-0002", name: "Diya Sharma", dob: "2012-08-22", schoolName: "Kendriya Vidyalaya",
    address: "45 MG Road, Gurgaon", emergencyContact: "9912345678", fatherName: "Amit Sharma",
    fatherContact: "9912345678", motherName: "Pooja Sharma", motherContact: "9998887776",
    whatsapp: "9912345678", email: "amit.sharma@gmail.com", course: "Advanced", batch: "Evening B",
    enrollmentDate: "2024-01-15", validityStart: "2024-01-15", validityEnd: "2025-01-15",
    totalSessions: 96, feeAmount: 24000, paymentPlan: "Monthly", status: "active"
  },
  {
    id: "S003", rollNumber: "NAS-0003", name: "Ishaan Patel", dob: "2009-11-30", schoolName: "Ryan International",
    address: "89 Vasant Kunj, Delhi", emergencyContact: "9745678901", fatherName: "Kiran Patel",
    fatherContact: "9745678901", motherName: "Mena Patel", motherContact: "9876001234",
    whatsapp: "9745678901", email: "kiran.patel@gmail.com", course: "Professional", batch: "Weekend",
    enrollmentDate: "2023-11-01", validityStart: "2023-11-01", validityEnd: "2024-11-01",
    totalSessions: 96, feeAmount: 36000, paymentPlan: "Lump Sum", status: "active"
  },
  {
    id: "S004", rollNumber: "NAS-0004", name: "Ananya Reddy", dob: "2011-03-08", schoolName: "Amity International",
    address: "22 Noida Sector 50", emergencyContact: "9654321098", fatherName: "Suresh Reddy",
    fatherContact: "9654321098", motherName: "Lakshmi Reddy", motherContact: "9765432109",
    whatsapp: "9654321098", email: "suresh.reddy@gmail.com", course: "Basic", batch: "Morning A",
    enrollmentDate: "2024-02-01", validityStart: "2024-02-01", validityEnd: "2024-08-01",
    totalSessions: 48, feeAmount: 12000, paymentPlan: "Quarterly", status: "active"
  },
  {
    id: "S005", rollNumber: "NAS-0005", name: "Rohan Joshi", dob: "2008-07-19", schoolName: "DPS Mathura Road",
    address: "56 Lajpat Nagar, Delhi", emergencyContact: "9543210987", fatherName: "Deepak Joshi",
    fatherContact: "9543210987", motherName: "Rekha Joshi", motherContact: "9432109876",
    whatsapp: "9543210987", email: "deepak.joshi@gmail.com", course: "Advanced", batch: "Evening B",
    enrollmentDate: "2023-10-15", validityStart: "2023-10-15", validityEnd: "2024-10-15",
    totalSessions: 96, feeAmount: 24000, paymentPlan: "Monthly", status: "active"
  },
];

export const DUMMY_ATTENDANCE: AttendanceRecord[] = [
  { studentId: "S001", date: "2024-02-19", status: "present", batch: "Morning A" },
  { studentId: "S002", date: "2024-02-19", status: "present", batch: "Evening B" },
  { studentId: "S003", date: "2024-02-19", status: "absent", batch: "Weekend" },
  { studentId: "S004", date: "2024-02-19", status: "late", batch: "Morning A" },
  { studentId: "S005", date: "2024-02-19", status: "present", batch: "Evening B" },
  { studentId: "S001", date: "2024-02-18", status: "present", batch: "Morning A" },
  { studentId: "S002", date: "2024-02-18", status: "absent", batch: "Evening B" },
  { studentId: "S004", date: "2024-02-18", status: "present", batch: "Morning A" },
  { studentId: "S005", date: "2024-02-18", status: "late", batch: "Evening B" },
  { studentId: "S001", date: "2024-02-17", status: "present", batch: "Morning A" },
  { studentId: "S002", date: "2024-02-17", status: "present", batch: "Evening B" },
  { studentId: "S003", date: "2024-02-17", status: "present", batch: "Weekend" },
  { studentId: "S004", date: "2024-02-17", status: "present", batch: "Morning A" },
];

export const DUMMY_PAYMENTS: Payment[] = [
  { id: "P001", studentId: "S001", studentName: "Aarav Kumar", amount: 4000, method: "UPI", date: "2024-01-10", installmentNo: 1, totalInstallments: 3, notes: "First installment", status: "paid" },
  { id: "P002", studentId: "S002", studentName: "Diya Sharma", amount: 2000, method: "Cash", date: "2024-01-15", installmentNo: 1, totalInstallments: 12, notes: "Monthly fee Jan", status: "paid" },
  { id: "P003", studentId: "S003", studentName: "Ishaan Patel", amount: 36000, method: "Bank Transfer", date: "2023-11-01", installmentNo: 1, totalInstallments: 1, notes: "Full payment", status: "paid" },
  { id: "P004", studentId: "S004", studentName: "Ananya Reddy", amount: 4000, method: "UPI", date: "2024-02-01", installmentNo: 1, totalInstallments: 3, notes: "First installment", status: "paid" },
  { id: "P005", studentId: "S005", studentName: "Rohan Joshi", amount: 2000, method: "Cash", date: "2024-02-01", installmentNo: 5, totalInstallments: 12, notes: "Monthly fee Feb", status: "paid" },
  { id: "P006", studentId: "S001", studentName: "Aarav Kumar", amount: 4000, method: "UPI", date: "2024-04-10", installmentNo: 2, totalInstallments: 3, notes: "Second installment", status: "pending" },
  { id: "P007", studentId: "S002", studentName: "Diya Sharma", amount: 2000, method: "Cash", date: "2024-02-15", installmentNo: 2, totalInstallments: 12, notes: "Monthly fee Feb", status: "pending" },
];

export const DUMMY_EXPENSES: Expense[] = [
  { id: "E001", category: "Art Supplies", description: "Acrylic paints and brushes", amount: 3500, date: "2024-02-10", method: "UPI" },
  { id: "E002", category: "Utilities", description: "Electricity bill", amount: 1800, date: "2024-02-05", method: "Bank Transfer" },
  { id: "E003", category: "Rent", description: "Studio rent for February", amount: 15000, date: "2024-02-01", method: "Bank Transfer" },
  { id: "E004", category: "Marketing", description: "Instagram ads", amount: 2000, date: "2024-02-08", method: "UPI" },
  { id: "E005", category: "Art Supplies", description: "Canvas frames (pack of 10)", amount: 2200, date: "2024-02-12", method: "Cash" },
  { id: "E006", category: "Maintenance", description: "AC servicing", amount: 800, date: "2024-02-15", method: "Cash" },
];

export const DUMMY_NOTICES: Notice[] = [
  { id: "N001", title: "Holi Celebration Class", body: "Join us for a special Holi-themed art class on March 20th! Bring your creativity and festive spirit.", date: "2024-02-19", audience: "all" },
  { id: "N002", title: "Fee Reminder", body: "February installments are due by 25th February. Please ensure timely payment to avoid any inconvenience.", date: "2024-02-15", audience: "parents" },
  { id: "N003", title: "Summer Camp Registration Open", body: "Exciting summer art camp starting April 15th. Limited seats available. Register early!", date: "2024-02-10", audience: "all" },
];

export const BATCHES = [
  "Professional (10:00 AM - 11:30 AM)",
  "Advance + Basic (11:30 AM - 1:00 PM)",
  "Basic 1 (1:00 PM - 2:30 PM)",
  "Basic 2 (2:30 PM - 4:00 PM)",
];
export const EXPENSE_CATEGORIES = ["Art Supplies", "Utilities", "Rent", "Marketing", "Maintenance", "Salaries", "Equipment", "Other"];
