const nodemailer = require('nodemailer');

// mailtrap
const mailtrapTransporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

// gmail
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendAdminNotification = async (storeData) => {

    const mailOptions = {
        from: '"Sistema de Alertas" <marketplace.admin@gmail.com>',
        to: "admin@marketplace.com",
        subject: `🔔 Novo spermercado pendente: ${storeData.name}`,
        text:
          `Olá Admin,\n\n` +
          `Novo supermercado pendente.\n\n` +
          `Loja: ${storeData.name}\n` +
          `Morada: ${storeData.address}\n` +
          `Telemóvel: ${storeData.phoneNumber}`
    };

    try {
        await mailtrapTransporter.sendMail(mailOptions);
        await gmailTransporter.sendMail(mailOptions);
        console.log('Emails enviados');

    } catch (error) {
        console.error(error.message);
    }
};

const sendNotificationEmail = async (to, title, message) => {
    const mailOptions = {
        from: '"Marketplace" <marketplace.estg.paw@gmail.com>',
        to,
        subject: title,
        text: message
    };

    try {
        await gmailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
    }
};

module.exports = { sendAdminNotification, sendNotificationEmail};