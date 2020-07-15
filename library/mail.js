const nodemailer = require("nodemailer");

class MailSender {
    constructor(to, subject, html) {
        this.to = to;
        this.subject = subject;
        this.html = html;
    }

    send = () => {
        return new Promise(async (resolve, reject) => {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "arifurrahmansujon27@gmail.com",
                    pass: process.env.MY_GMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: "arifurrahmansujon27@gmail.com",
                to: this.to,
                subject: this.subject,
                html: this.html,
            };

            try {
                const sentMail = await transporter.sendMail(mailOptions);
                resolve(sentMail);
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    };
}

module.exports = MailSender;
