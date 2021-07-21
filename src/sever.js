const setting = require('./setting');
const google = require('./google');
const facebook = require('./facebook');
const xss = require("xss");
const SMS = require('twilio')(setting.SMS.accountSid, setting.SMS.authToken);

let codeList = {};
let verifyList = {};
let signFailList = {};

exports.api = function (app, database) {
    app.post('/verify', (req, res) => {
        //apply verify code time limitation
        if (verifyList[req.body.mobile] === undefined) {
            verifyList[req.body.mobile] = new Date().getTime();
        } else if (new Date().getTime() - verifyList[req.body.mobile] < setting.SMS.defaultSendInterval) {
            return;
        }

        //xss
        if (new RegExp(setting.SMS.mobileRegex).test(req.body.mobile)) {
            if (req.body.sim) {
                let code = '' + Math.floor(Math.random() * 8999 + 1000);
                codeList[req.body.mobile] = {
                    code: code,
                    time: new Date().getTime()
                };
                console.log('Send code ' + (req.body.sim ? '(sim)' : '(twilio)') + ": " + req.body.mobile + (req.body.sim ? (' ' + code) : ''));
                res.json({
                    sim: true,
                    code: code
                })
            } else {
                codeList[req.body.mobile] = {
                    code: 'twilio',
                    time: new Date().getTime()
                };
                SMS.verify.services(setting.SMS.severId)
                    .verifications
                    .create({to: '+61' + req.body.mobile, channel: 'sms'})
                    .then();
                res.json({
                    sim: false
                })
            }
        }
    });

    app.post('/sign', (req, res) => {
        //tried sign 3 times limitation
        if (signFailList[req.body.mobile] !== undefined) {//tried but failed before
            let lastFailAgo = new Date().getTime() - signFailList[req.body.mobile].time;
            if (lastFailAgo > setting.SMS.defaultSendInterval) {//tried but overtime
                delete signFailList[req.body.mobile];
            } else if (signFailList[req.body.mobile].times > 3) {//tried and no overtime and over 3 times
                res.json({
                    verify: false,
                    reason: 'denied'
                })
                return;
            }//tried but failed less than 3 times
        }//no tried

        //xss
        if (new RegExp(setting.SMS.mobileRegex).test(req.body.mobile) && /^[0-9]{4}$/.test(req.body.code)) {
            if (codeList[req.body.mobile] === undefined) {
                return;
            }
            let time = new Date().getTime() - codeList[req.body.mobile].time;
            if (time > setting.SMS.defaultSendInterval) {
                signFail(req, res, 'overtime');
                return;
            }
            if (req.body.sim) {
                if (codeList[req.body.mobile] !== undefined) {
                    if (req.body.code === codeList[req.body.mobile].code) {
                        signSuccess(req, res, database);
                    } else {
                        signFail(req, res, 'incorrect');
                    }
                }
            } else {
                SMS.verify.services(setting.SMS.severId)
                    .verificationChecks
                    .create({to: '+61' + req.body.mobile, code: req.body.code})
                    .then(verification_check => {
                        if (verification_check.status === 'approved') {
                            signSuccess(req, res, database);
                        } else {
                            signFail(req, res, 'incorrect');
                        }
                    });
            }
        }
    });

    app.post('/enter', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        if (req.body.mobile === req.session.mobile) {

            //mobile from encrypted session
            let sql = 'UPDATE person SET name = ?, email = ? WHERE mobile = ?';
            database.query(sql, [xss(req.body.name), xss(req.body.email), parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
                if (error) {
                    res.json({
                        enter: false
                    });
                } else {
                    res.json({
                        enter: true,
                        jump: '/status'
                    });
                }
            });
        }
    });

    app.get('/checkin', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        let position = {
            lat: xss(req.query.lat),
            lng: xss(req.query.lng)
        }
        position = JSON.stringify(position);
        let sql = 'INSERT INTO history (mobile, position) VALUES (?,?)';
        database.query(sql, [parseFloat(xss(req.session.mobile)), position], function (error, results, fields) {
            if (!error) {
                res.redirect('/checked');
            }
        });
    });

    app.get('/exit', (req, res) => {
        if (req.body.mobile !== undefined) {
            console.log('Sign out: ' + req.body.mobile);
        }
        req.session.signed = false;
        req.session.mobile = '';
        res.redirect('/index');
    });
}

let signSuccess = exports.signSuccess = function (req, res, database) {
    //xss
    let sql = 'INSERT IGNORE INTO person (mobile) VALUES (?)';
    database.query(sql, [parseFloat(xss(req.body.mobile))], function (error, results, fields) {
        if (error) {
            signFail(req, res, 'error');
        } else {
            console.log('Sign success: ' + req.body.mobile);
            req.session.signed = true;
            req.session.mobile = req.body.mobile;

            if (req.body.OAuth !== undefined) {
                switch (req.body.OAuth) {
                    case 'google': {
                        google.openid(req, res, database);
                        break;
                    }
                    case 'facebook': {
                        facebook.openid(req, res, database);
                        break;
                    }
                }
            }

            getRole(req.session.mobile, database, function (role, person) {
                let jump = (role === 'no-user' || role === 'user') ? '/status' : '/admin';
                res.json({
                    verify: true,
                    jump: jump
                });
            });
        }
    });
}

let signFail = exports.signFail = function (req, res, reason) {
    console.log('Sign fail: ' + req.body.mobile);
    req.session.signed = false;
    req.session.mobile = '';
    if (signFailList[req.body.mobile] === undefined) {
        signFailList[req.body.mobile] = {
            times: 1,
            time: new Date().getTime()
        };
    } else {
        signFailList[req.body.mobile].times++;
        signFailList[req.body.mobile].time = new Date().getTime();
    }
    res.json({
        verify: false,
        reason: reason
    })
}

let getRole = exports.getRole = function (mobile, database, next) {
    //xss
    let sql = 'SELECT * FROM person WHERE mobile = ?';
    database.query(sql, [parseFloat(xss((mobile)))], function (error, results, fields) {
        if (error || results.length === 0) {
            next('no-user', results[0]);
        } else {
            next(results[0].role, results[0]);
        }
    });
}