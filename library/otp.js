const MailSender = require('./mail.js');
const Otp = require('../models/Otp');

class OTP {
    constructor() {}
    create = (email) => {
        return new Promise(async (resolve, reject) => {
            const oneTimePassword = parseInt(Math.random() * 1000000);
            const otp = new Otp({
                email: email,
                createdAt: Date.now(),
                otp: oneTimePassword
            });

            try {
                //if already exist then delete it
                const exist = await Otp.findOneAndDelete({ email: email });
                if (exist)
                    console.log(`Previous entry deleted! it was: ${exist}`);

                // Now save it to database
                var savedOtp = await otp.save();
                console.log('saved otp', savedOtp);
                if (!savedOtp)
                    return reject({
                        statusCode: 500,
                        message: 'Internal server error'
                    });

                // send mail with otp
                const subject = 'Verification code';
                const mailBody = `Your verification code is: ${oneTimePassword}`;

                const mailSender = new MailSender(email, subject, mailBody);
                const sentMail = await mailSender.send();

                if (!sentMail)
                    return reject({
                        statusCode: 500,
                        message: 'Internal server error'
                    });

                console.log(`sentMail: ${sentMail}`);
                const response = {
                    statusCode: 201,
                    id: savedOtp._id,
                    //message: `successfully created otp: ${savedOtp.otp}`
                };
                resolve(response);
            } catch (error) {
                console.log(error);
                reject({ statusCode: 500, message: error });
            }
        });
    };

    verify = (id, otp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const document = await Otp.findById(id);
                if (!document)
                    return reject({
                        statusCode: 401,
                        message: 'OTP is expired! Please resend'
                    });

                const elapsedTime = Math.floor(
                    (Date.now() - document.createdAt) / 1000
                );
                if (elapsedTime > 60)
                    return reject({
                        statusCode: 401,
                        message: 'OTP is expired! Please resend'
                    });

                if (document.otp !== otp)
                    return reject({ statusCode: 401, message: 'Invalid otp' });
            } catch (error) {
                console.log(error);
                return reject({
                    statusCode: 500,
                    message: 'Internal server error'
                });
            }

            // Need to delete previous otp record

            try {
                const removedOtp = await Otp.deleteOne({ _id: id });
                if (!removedOtp) {
                    console.log('otp can not be deleted');
                    return reject({
                        statusCode: 500,
                        message: 'Internal server error'
                    });
                }
            } catch (error) {
                console.log(error);
                return reject({
                    statusCode: 500,
                    message: 'Internal server error'
                });
            }

            // Now return success message
            resolve({ statusCode: 200, message: 'otp verified' });
        });
    };
}

module.exports = new OTP();
