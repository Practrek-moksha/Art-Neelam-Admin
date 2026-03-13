export type Course = "Basic" | "Advanced" | "Professional";
export type PaymentMethod = "UPI" | "Cash" | "Bank Transfer" | "Cheque";
export type AttendanceStatus = "present" | "absent" | "bank_holiday" | "class_holiday";

export const BATCHES = [
  "Professional (10:00 AM - 11:30 AM)",
  "Advance + Basic (11:30 AM - 1:00 PM)",
  "Basic 1 (1:00 PM - 2:30 PM)",
  "Basic 2 (2:30 PM - 4:00 PM)",
];

export const EXPENSE_CATEGORIES = ["Art Supplies", "Utilities", "Rent", "Marketing", "Maintenance", "Salaries", "Equipment", "Other"];
