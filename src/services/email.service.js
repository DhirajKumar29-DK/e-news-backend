import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return transporter;
}

/**
 * Send Reporter Approval Notification Email
 */
export const sendReporterApprovalEmail = async (reporter) => {
  const loginUrl = `${env.FRONTEND_URL}/reporter/login`;

  const mailOptions = {
    from: env.SMTP_FROM,
    to: reporter.email,
    subject: '🎉 Congratulations! Your Vartiq Reporter Account has been Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #dc2626; }
          .logo { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0; }
          .tagline { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-weight: 700; }
          .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
          .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; margin-bottom: 12px; }
          h1 { font-size: 20px; color: #0f172a; margin-top: 0; margin-bottom: 16px; font-weight: 800; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #dc2626, #e11d48); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25); }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VARTIQ NEWS</div>
            <div class="tagline">Editorial &amp; Contributor Desk</div>
          </div>
          <div class="content">
            <span class="badge">✓ Account Approved</span>
            <h1>Welcome to the Vartiq Newsroom, ${reporter.name}!</h1>
            <p>We are pleased to inform you that your reporter accreditation application and verification documents have been reviewed and <strong>APPROVED</strong> by our Editorial Board.</p>
            
            <p>Your reporter account is now fully active. You can immediately log in to your news desk to draft and submit breaking field reports, city news, and feature stories directly to our editorial queue.</p>

            <div class="btn-container">
              <a href="${loginUrl}" class="btn" target="_blank">Sign In &amp; Start Writing News &rarr;</a>
            </div>

            <div class="info-box">
              <strong>Your Accredited Details:</strong><br>
              &bull; <strong>Name:</strong> ${reporter.name}<br>
              &bull; <strong>Registered Email:</strong> ${reporter.email}<br>
              &bull; <strong>Role:</strong> Accredited Field Reporter<br>
              &bull; <strong>Status:</strong> Approved (Active)
            </div>

            <p style="font-size: 12px; color: #64748b;">
              <strong>What happens next?</strong> Once you submit an article from your desk, our editorial team will review it, make any necessary layout adjustments, and publish it live on the main website with your accredited byline.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Vartiq Newsroom. Editorial Verification &amp; Contributor Desk.<br>
            If you did not apply for a reporter account, please ignore this email.
          </div>
        </div>
      </body>
      </html>
    `
  };

  const client = getTransporter();
  if (client) {
    try {
      const info = await client.sendMail(mailOptions);
      console.log(`[EMAIL SENT] Approval email successfully delivered to ${reporter.email} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email to ${reporter.email}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    // Development fallback log
    console.log('\n======================================================');
    console.log(`[EMAIL DISPATCH SIMULATION (SMTP not configured in .env)]`);
    console.log(`To: ${reporter.email}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Login Link: ${loginUrl}`);
    console.log('Status: Reporter account successfully approved!');
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }
};

/**
 * Send Reporter Rejection Notification Email
 */
export const sendReporterRejectionEmail = async (reporter, reason) => {
  const mailOptions = {
    from: env.SMTP_FROM,
    to: reporter.email,
    subject: 'Update regarding your Vartiq Reporter Application',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #dc2626; margin-top: 0;">Application Status Update</h2>
          <p>Dear ${reporter.name},</p>
          <p>Thank you for your interest in joining Vartiq Newsroom as a reporter.</p>
          <p>After reviewing your application and submitted credentials, the Editorial Board is unable to approve your account at this time.</p>
          ${reason ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; font-size: 13px;"><strong>Reason:</strong> ${reason}</div>` : ''}
          <p style="font-size: 12px; color: #64748b;">You may re-apply with valid identity documentation in the future.</p>
        </div>
      </body>
      </html>
    `
  };

  const client = getTransporter();
  if (client) {
    try {
      await client.sendMail(mailOptions);
    } catch (err) {
      console.error('Failed to send rejection email:', err.message);
    }
  } else {
    console.log(`[EMAIL DISPATCH SIMULATION] Rejection Email to: ${reporter.email} | Reason: ${reason}`);
  }
};

