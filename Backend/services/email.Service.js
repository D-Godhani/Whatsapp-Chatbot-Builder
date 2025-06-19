import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent Successfully: ', info.response);
  } catch (err) {
    console.error('Failed to send email:', err);
    throw new Error('Email sending failed');
  }
};