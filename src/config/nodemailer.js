const nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fridaysmarthome@gmail.com',
        pass: 'fridaypassword123456'
    }
});


module.exports = transporter;