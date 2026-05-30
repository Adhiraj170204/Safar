import nodemailer from "nodemailer";

// Lazy initialization to ensure env vars are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"Safar" <${process.env.EMAIL_USER}>`,
    to, subject, html,
  });
};

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP verification email
export const sendOTPVerification = async (user, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b;">Safar</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Verify your email</h2>
                  <p style="margin: 0 0 30px; font-size: 14px; color: #71717a; text-align: center; line-height: 1.5;">
                    Hi ${user.name}, use the following OTP to verify your email address. This code expires in 10 minutes.
                  </p>
                </td>
              </tr>
              
              <!-- OTP Box -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">${otp}</span>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5;">
                    If you didn't request this verification, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail({ 
    to: user.email, 
    subject: "Verify your email - Safar", 
    html 
  });
};

// Keep legacy function for backwards compatibility
export const sendVerification = async (user, token) => {
  const url = `${process.env.APP_BASE_URL}/auth/verify-email?token=${token}`;
  const html = `<p>Verify your email: <a href="${url}">${url}</a></p>`;
  await sendEmail({ to: user.email, subject: "Verify your email", html });
};

export const sendResetPassword = async (user, token) => {
  const url = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;
  const html = `<p>Reset your password: <a href="${url}">${url}</a></p>`;
  await sendEmail({ to: user.email, subject: "Reset password", html });
};
