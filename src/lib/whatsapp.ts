// WhatsApp messaging utility
// Admin number for receiving messages
const ADMIN_WHATSAPP = "919967701108";

export function openWhatsApp(phone: string, message?: string) {
  const clean = phone.replace(/[\s\-\+]/g, "");
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
    `Dear Parent,\n\nThis is a reminder that the fee of ₹${amount.toLocaleString()} for *${studentName}* is due${dueDate ? ` on ${new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : " soon"}.\n\nKindly complete the payment to continue uninterrupted classes at Art Neelam Academy.\n\n– Art Neelam Academy\nContact: +91 9967701108`,

  welcomeStudent: (studentName: string, course: string, batch: string) =>
    `Welcome to *Art Neelam Academy*! 🎨\n\nDear Parent,\n\nWe're delighted to have *${studentName}* join our ${course} course (${batch.split(" (")[0]} batch).\n\nLooking forward to a creative journey together! ✨`,

  birthdayWish: (studentName: string) =>
    `🎂 *Happy Birthday, ${studentName}!* 🎉\n\nWishing you a wonderful day filled with colors and creativity!\n\nFrom your Art Neelam Academy family 🎨❤️`,

  attendanceAlert: (studentName: string, date: string, status: string) =>
    `Attendance Update — *Art Neelam Academy*\n\nStudent: *${studentName}*\nDate: ${date}\nStatus: ${status === "absent" ? "❌ Absent" : status === "late" ? "⏰ Late" : "✅ Present"}\n\nPlease contact us for any queries.`,

  followUp: (leadName: string, course: string) =>
    `Hi *${leadName}*! 👋\n\nThank you for your interest in our *${course}* course at Art Neelam Academy.\n\nWould you like to schedule a free demo class? We'd love to show you what we do! 🎨\n\nReply to this message or call us anytime.`,

  notice: (title: string, body: string) =>
    `📢 *Notice — Art Neelam Academy*\n\n*${title}*\n\n${body}\n\nThank you! 🎨`,

  customMessage: (studentName: string) =>
    `Hi! Regarding *${studentName}* at Art Neelam Academy —\n\n`,

  parentCredentials: (parentName: string, studentName: string, email: string, password: string, portalUrl: string) =>
    `Dear *${parentName}*,\n\nYour parent portal login for *${studentName}* at Art Neelam Academy is ready! 🎨\n\n📧 *Login ID:* ${email}\n🔑 *Password:* ${password}\n🔗 *Portal:* ${portalUrl}\n\nYou can view attendance, fee status, notices & more.\n\n– Art Neelam Academy\nContact: +91 9967701108`,
};

export function getAdminNumber() {
  return ADMIN_WHATSAPP;
}
