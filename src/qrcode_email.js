const setting = require('./setting');
const QRCode = require('qrcode');
const email = require("nodemailer").mail;

exports.qrcode = function (text, next) {
    QRCode.toString(text, {type: 'svg'}, function (err, url) {
        next(url);
    })
}

exports.send = function (to, html) {
    //email regex
    if(setting.email.regex.test(to)){
        email({
            from: "Contact Tracing Team <no-replay@ctt.com>",
            to: to,
            subject: "Health Status",
            text: "For more details, please check on our website",
            html: html
        });
    }
}