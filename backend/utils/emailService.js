const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("[Email] SMTP ERROR:", error.message);
  } else {
    console.log("[Email] SMTP SERVER IS READY ✓");
  }
});

/**
 * Send a task assignment notification email to a volunteer.
 * Errors are caught and logged silently — assignment flow is never blocked.
 */
async function sendAssignmentEmail(to, volunteerName, need) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set. Skipping email.");
    return;
  }

  const subject = "New Task Assigned – ReliefLink";
  const message = `
Hi ${volunteerName || "Volunteer"},

You have been assigned a new task on ReliefLink.

Title: ${need.title}
Description: ${need.description || "N/A"}
Location: ${need.address || "N/A"}
Urgency: ${need.urgency ? need.urgency.toUpperCase() : "N/A"}
People Affected: ${need.peopleAffected || "N/A"}

Please log in to your ReliefLink dashboard for full details and to mark the task as complete once done.

Thank you for your service,
The ReliefLink Team
  `.trim();

  try {
    await transporter.sendMail({
      from: `"ReliefLink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
    });
    console.log(`[Email] Assignment notification sent to ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    // Silent fail — do NOT re-throw
  }
}

module.exports = { sendAssignmentEmail };
