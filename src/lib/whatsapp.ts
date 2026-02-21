// WhatsApp messaging utility
// Admin number for receiving messages
const ADMIN_WHATSAPP = "919920546217";

export function openWhatsApp(phone: string, message?: string) {
  // Clean phone number - remove spaces, dashes, + prefix
  const clean = phone.replace(/[\s\-\+]/g, "");
  // Ensure Indian country code
  const number = clean.startsWith("91") ? clean : `91${clean}`;
  const url = message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
  window.open(url, "_blank");
}

export function messageAdmin(message: string) {
  openWhatsApp(ADMIN_WHATSAPP, message);
}

// Pre-built message templates
export const templates = {
  feeReminder: (studentName: string, amount: number, dueDate?: string) =>
    `Hi, this is a gentle reminder regarding the pending fee of ₹${amount.toLocaleString()} for *${studentName}* at Art Neelam Studio.${dueDate ? ` Due: ${dueDate}` : ""}\n\nPlease clear the dues at your earliest convenience. Thank you! 🎨`,

  welcomeStudent: (studentName: string, course: string, batch: string) =>
    `Welcome to *Art Neelam Studio*! 🎨\n\nDear Parent,\n\nWe're delighted to have *${studentName}* join our ${course} course (${batch} batch).\n\nLooking forward to a creative journey together! ✨`,

  birthdayWish: (studentName: string) =>
    `🎂 *Happy Birthday, ${studentName}!* 🎉\n\nWishing you a wonderful day filled with colors and creativity!\n\nFrom your Art Neelam Studio family 🎨❤️`,

  attendanceAlert: (studentName: string, date: string, status: string) =>
    `Attendance Update — *Art Neelam Studio*\n\nStudent: *${studentName}*\nDate: ${date}\nStatus: ${status === "absent" ? "❌ Absent" : status === "late" ? "⏰ Late" : "✅ Present"}\n\nPlease contact us for any queries.`,

  followUp: (leadName: string, course: string) =>
    `Hi *${leadName}*! 👋\n\nThank you for your interest in our *${course}* course at Art Neelam Studio.\n\nWould you like to schedule a free demo class? We'd love to show you what we do! 🎨\n\nReply to this message or call us anytime.`,

  notice: (title: string, body: string) =>
    `📢 *Notice — Art Neelam Studio*\n\n*${title}*\n\n${body}\n\nThank you! 🎨`,

  customMessage: (studentName: string) =>
    `Hi! Regarding *${studentName}* at Art Neelam Studio —\n\n`,
};

export function getAdminNumber() {
  return ADMIN_WHATSAPP;
}
