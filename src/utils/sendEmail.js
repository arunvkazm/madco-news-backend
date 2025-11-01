import nodemailer from 'nodemailer';

export async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Madco News" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
  });
}
