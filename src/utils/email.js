import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use host/port from env
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Reclaim App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to prevent blocking the main request
    return null;
  }
};
