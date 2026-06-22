import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Semipack Malaysia Careers <careers@semipack.com.my>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export function applicationConfirmationEmail(name: string, jobTitle: string) {
  return {
    subject: `Application Received - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Thank You for Your Application</h2>
        <p>Dear ${name},</p>
        <p>We have received your application for the <strong>${jobTitle}</strong> position at Semipack Malaysia Sdn Bhd.</p>
        <p>Our recruitment team will review your application and get back to you within 5-7 business days.</p>
        <p>Best regards,<br/>Human Resources<br/>Semipack Malaysia Sdn Bhd</p>
      </div>
    `,
  };
}

export function interviewInviteEmail(
  name: string,
  jobTitle: string,
  interviewType: string,
  date: string,
  time: string,
  duration: number,
  meetingLink: string,
  interviewerName: string
) {
  return {
    subject: `Interview Invitation - ${jobTitle} (${interviewType})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Interview Invitation</h2>
        <p>Dear ${name},</p>
        <p>We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position.</p>
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Round:</td><td>${interviewType}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Date:</td><td>${date}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Time:</td><td>${time}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Duration:</td><td>${duration} minutes</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Interviewer:</td><td>${interviewerName}</td></tr>
        </table>
        <p><a href="${meetingLink}" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px;">Join Meeting</a></p>
        <p>Please confirm your attendance by replying to this email.</p>
        <p>Best regards,<br/>Human Resources<br/>Semipack Malaysia Sdn Bhd</p>
      </div>
    `,
  };
}

export function rejectionEmail(name: string, jobTitle: string, reason?: string) {
  return {
    subject: `Application Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Application Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at Semipack Malaysia Sdn Bhd.</p>
        <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
        ${reason ? `<p><em>Feedback: ${reason}</em></p>` : ""}
        <p>We encourage you to apply for future openings that match your skills and experience.</p>
        <p>We wish you all the best in your career.</p>
        <p>Best regards,<br/>Human Resources<br/>Semipack Malaysia Sdn Bhd</p>
      </div>
    `,
  };
}

export function offerEmail(
  name: string,
  jobTitle: string,
  salary: number,
  startDate: string,
  expiryDate: string
) {
  return {
    subject: `Job Offer - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Congratulations! Job Offer</h2>
        <p>Dear ${name},</p>
        <p>We are delighted to extend an offer for the <strong>${jobTitle}</strong> position at Semipack Malaysia Sdn Bhd.</p>
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Position:</td><td>${jobTitle}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Monthly Salary:</td><td>RM ${salary.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Start Date:</td><td>${startDate}</td></tr>
          <tr><td style="padding: 8px 16px 8px 0; font-weight: bold;">Offer Valid Until:</td><td>${expiryDate}</td></tr>
        </table>
        <p>Please reply to this email to accept or discuss the offer. The offer expires on ${expiryDate}.</p>
        <p>We look forward to welcoming you to the team!</p>
        <p>Best regards,<br/>Human Resources<br/>Semipack Malaysia Sdn Bhd</p>
      </div>
    `,
  };
}

export function noReplyAutoRejectEmail(name: string, jobTitle: string) {
  return {
    subject: `Application Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Application Update</h2>
        <p>Dear ${name},</p>
        <p>We noticed that we haven't heard back from you regarding the <strong>${jobTitle}</strong> position at Semipack Malaysia Sdn Bhd.</p>
        <p>As we have not received a response within 7 days, we have closed your application. If you are still interested, please feel free to reapply.</p>
        <p>Best regards,<br/>Human Resources<br/>Semipack Malaysia Sdn Bhd</p>
      </div>
    `,
  };
}
