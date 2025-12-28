import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST, // smtp.gmail.com
      port: EMAIL_PORT, // 465 for SSL
      secure: true, // true for port 465
      auth: {
        user: EMAIL_USER, // email address
        pass: EMAIL_PASS, // email app password
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to, // recipient email
      subject, // email subject
      html, // email body in HTML
    });

    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

export default sendEmail;
