import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars (adjust path if needed)
dotenv.config({ path: path.resolve(__dirname, "../config/config.env") });

// Grab env vars
const SMTP_HOST = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
const SMTP_PORT = Number(process.env.SMTP_PORT || 2525);
const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@devcamper.io";
const FROM_NAME = process.env.FROM_NAME || "DevCamper";

if (!SMTP_EMAIL || !SMTP_PASSWORD) {
  throw new Error("Missing SMTP_EMAIL or SMTP_PASSWORD in config.env");
}

// Create transporter (Mailtrap)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

// Export a helper you can call from controllers/services
export async function sendEmail(options: any) {
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  });

  console.log("Message sent:", info.messageId);
  return info;
}
