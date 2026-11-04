import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Gmail & Custom SMTP Transporter Cache
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


/**
 * Send Advertisement Approval & Live Publication Email
 */
export const sendAdApprovalEmail = async (ad) => {
  if (!ad.advertiserEmail) {
    console.log('[EMAIL SKIP] No email provided for ad approval notification.');
    return { success: false, reason: 'No advertiser email' };
  }

  const siteUrl = env.FRONTEND_URL || 'http://localhost:3000';
  const mailOptions = {
    from: env.SMTP_FROM || 'Vartiq Media <no-reply@vartiq.com>',
    to: ad.advertiserEmail,
    subject: `🎉 बधाई हो! आपका विज्ञापन Live हो गया है - ${ad.title}`,
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
            <div class="tagline">Local Business Ad Studio</div>
          </div>
          <div class="content">
            <span class="badge">✓ Payment Verified &amp; Published Live</span>
            <h1>बधाई हो ${ad.advertiserName || 'प्रिय विज्ञापनदाता'}!</h1>
            <p>आपकी पेमेंट (₹${ad.amountPaid || 599}) सफलतापूर्वक सत्यापित हो गई है और आपका विज्ञापन <strong>Live</strong> पब्लिश कर दिया गया है।</p>
            
            <div class="info-box">
              <strong>विज्ञापन विवरण:</strong><br>
              &bull; <strong>शीर्षक:</strong> ${ad.title}<br>
              &bull; <strong>स्थान / स्लॉट:</strong> ${ad.slot}<br>
              &bull; <strong>लक्षित क्षेत्र:</strong> ${ad.targetDistrict || 'सभी पाठक'}<br>
              &bull; <strong>पेमेंट संदर्भ (UTR):</strong> ${ad.paymentRefNumber || 'N/A'}<br>
              &bull; <strong>वैधता:</strong> 30 दिन (पूर्ण माह प्रचार)
            </div>

            <div class="btn-container">
              <a href="${siteUrl}" class="btn" target="_blank">वेबसाइट पर विज्ञापन देखें &rarr;</a>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              हमारे 50,000+ पाठक अब आपके विज्ञापन को देख रहे हैं। किसी भी सहायता के लिए हमारी सपोर्ट टीम से संपर्क करें।
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Vartiq Media Network. All Rights Reserved.
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
      console.log(`[EMAIL SENT] Ad Approval email sent to ${ad.advertiserEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send ad email to ${ad.advertiserEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log('\n======================================================');
    console.log(`[EMAIL DISPATCH SIMULATION (SMTP not configured)]`);
    console.log(`To: ${ad.advertiserEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Status: Ad Verified & Published Live!`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }
};

/**
 * Send Advertisement Rejection Email
 */
export const sendAdRejectionEmail = async (ad, reason) => {
  if (!ad.advertiserEmail) return { success: false };

  const mailOptions = {
    from: env.SMTP_FROM || 'Vartiq Media <no-reply@vartiq.com>',
    to: ad.advertiserEmail,
    subject: `विज्ञापन स्थिति सूचना - ${ad.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #dc2626; margin-top: 0;">विज्ञापन अस्वीकृति सूचना</h2>
          <p>प्रिय ${ad.advertiserName || 'विज्ञापनदाता'},</p>
          <p>आपके द्वारा सबमिट किए गए विज्ञापन <strong>"${ad.title}"</strong> की समीक्षा के बाद उसे स्वीकार नहीं किया जा सका।</p>
          ${reason ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; font-size: 13px;"><strong>कारण:</strong> ${reason}</div>` : ''}
          <p style="font-size: 12px; color: #64748b;">यदि आपका कोई प्रश्न है अथवा पेमेंट रिफंड से संबंधित जानकारी चाहिए तो हमारी सहायता टीम से संपर्क करें।</p>
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
      console.error('Failed to send ad rejection email:', err.message);
    }
  } else {
    console.log(`[EMAIL DISPATCH SIMULATION] Ad Rejection Email to: ${ad.advertiserEmail} | Reason: ${reason}`);
  }
};

/**
 * Send Reporter Registration OTP Verification Email
 */
export const sendReporterOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: env.SMTP_FROM || 'Vartiq Newsroom <no-reply@vartiq.com>',
    to: email,
    subject: `🔐 Your Verification Code: ${otp} - Vartiq News Reporter Verification`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #dc2626; }
          .logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0; }
          .tagline { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; font-weight: 700; }
          .content { padding: 32px 24px; text-align: center; }
          .title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
          .desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
          .otp-box { background: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 28px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #dc2626; margin: 0 auto 20px auto; display: inline-block; font-family: monospace; }
          .warning { font-size: 11px; color: #94a3b8; line-height: 1.4; margin-top: 16px; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VARTIQ NEWS</div>
            <div class="tagline">Reporter Accreditation Desk</div>
          </div>
          <div class="content">
            <div class="title">Email Verification Code</div>
            <p class="desc">Please use the 6-digit verification code below to verify your email address for reporter registration.</p>
            <div class="otp-box">${otp}</div>
            <p class="warning">⚠️ This OTP is valid for 10 minutes. For your security, do not share this code with anyone.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Vartiq Newsroom. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  const client = getTransporter();
  if (client) {
    try {
      await client.sendMail(mailOptions);
      console.log(`[EMAIL DISPATCH SUCCESS] Reporter OTP sent to: ${email}`);
    } catch (err) {
      console.error('[EMAIL DISPATCH ERROR] Failed to send reporter OTP email:', err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`✉️ [SIMULATED EMAIL OTP] To: ${email} | OTP: ${otp}`);
    console.log(`======================================================\n`);
  }
};

/**
 * Send Password Reset Email with Direct 1-Click Reset Link
 */
export const sendPasswordResetEmail = async (user, resetUrl) => {
  const mailOptions = {
    from: env.SMTP_FROM || '"Vartiq Newsroom" <dhirajhzp62@gmail.com>',
    to: user.email,
    subject: '🔐 Reset Your Vartiq Reporter Account Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #dc2626; }
          .logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0; }
          .tagline { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; font-weight: 700; }
          .content { padding: 32px 24px; text-align: center; line-height: 1.6; }
          .icon-badge { display: inline-flex; width: 48px; height: 48px; border-radius: 14px; background: #fef2f2; border: 1px solid #fee2e2; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
          .desc { font-size: 13px; color: #475569; margin: 0 0 24px 0; }
          .btn-container { margin: 28px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #dc2626, #e11d48); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3); }
          .link-fallback { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 11px; color: #64748b; word-break: break-all; text-align: left; margin: 20px 0; }
          .warning { font-size: 11px; color: #94a3b8; margin-top: 20px; line-height: 1.5; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VARTIQ NEWS</div>
            <div class="tagline">Security &amp; Reporter Desk</div>
          </div>
          <div class="content">
            <div class="icon-badge">🔐</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="desc">
              Hello <strong>${user.name || 'Reporter'}</strong>,<br>
              We received a request to reset your password for your Vartiq reporter desk account. Click the button below to choose a new password:
            </p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset My Password &rarr;</a>
            </div>
            <div class="link-fallback">
              <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
            </div>
            <p class="warning">
              ⚠️ This password reset link is valid for <strong>1 hour</strong>.<br>
              If you did not request this password reset, please ignore this email. Your account remains completely secure.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Vartiq Newsroom. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  const client = getTransporter();
  if (client) {
    try {
      await client.sendMail(mailOptions);
      console.log(`[EMAIL DISPATCH SUCCESS] Password reset email sent to: ${user.email}`);
    } catch (err) {
      console.error('[EMAIL DISPATCH ERROR] Failed to send password reset email:', err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`✉️ [SIMULATED RESET EMAIL] To: ${user.email} | URL: ${resetUrl}`);
    console.log(`======================================================\n`);
  }
};
