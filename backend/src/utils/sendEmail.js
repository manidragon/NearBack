const nodemailer = require('nodemailer');
async function sendVerificationEmail(to, subject, text) {
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: 'your email',
            pass: 'your gmail app password' 
        }
    });

    const mailOptions = {
        from: 'your email',
        to,
        subject,
        text
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
