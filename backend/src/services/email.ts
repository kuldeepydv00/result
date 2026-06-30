import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '2525', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP email credentials not set. Email delivery will be simulated in console.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass }
  });
};

const transporter = createTransporter();

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (!transporter) {
      logger.info('Simulating Email Send:\nTo: %s\nSubject: %s\nContent:\n%s', to, subject, html);
      return true;
    }

    const info = await transporter.sendMail({
      from: '"Satta King Results" <noreply@example.com>',
      to,
      subject,
      html
    });

    logger.info('Email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    logger.error('Failed to send email: %o', error);
    return false;
  }
};

export default { sendEmail };
