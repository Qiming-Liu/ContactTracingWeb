const setting = require('./setting');
const xss = require("xss");
const moment = require('moment');

exports.page = function (app, database) {
    app.get('/', (req, res) => {
        res.redirect('/index');
    });

    app.get('/index.html', (req, res) => {
        res.redirect('/index');
    });

    app.get('/index', (req, res) => {
        if (req.session.signed) {
            res.redirect('/status');
            return;
        }
        res.render('client-index', {
            mobileRegex: setting.SMS.mobileRegex,
            defaultSendInterval: setting.SMS.defaultSendInterval,
            OAuth: req.query.OAuth
        });
    });

    app.get('/status', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        //mobile from encrypted session
        let sql = 'SELECT * FROM person WHERE mobile = ?';
        database.query(sql, [parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
            if (error || results.length === 0) {
                res.redirect('/exit');
            } else {
                if (results[0].name === null) {
                    res.redirect('/me?notify=detailsRequest');
                } else {
                    res.render('client-status', {
                        name: results[0].name,
                        mobile: req.session.mobile,
                        status: results[0].status,
                        statusImg: '/img/' + results[0].status.toLowerCase() + '.png'
                    });
                }
            }
        });
    });

    app.get('/map', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        res.render('client-map', {
            mobile: req.session.mobile,
            mapAPIKey: setting.google.mapAPIKey,
            mapId: setting.google.mapId
        });
    });

    app.get('/history', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        //mobile from encrypted session
        let sql = 'SELECT * FROM history WHERE mobile = ?';
        database.query(sql, [parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
            if (error) {
                res.redirect('/exit');
            } else {
                let history = '';
                if (results.length === 0) {
                    history = '<van-empty description="No Data"></van-empty>'
                } else {
                    history += '<van-steps direction="vertical" :active="' + (results.length - 1) + '">';
                    for (let i = 0; i < results.length; i++) {//for every position
                        history += getOneHistoryHtml(results[i].timestamp, results[i].position);
                    }
                    history += '</van-steps>';
                }
                res.render('client-history', {
                    history: history
                });
            }
        });
    });

    app.get('/me', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        //mobile from encrypted session
        let sql = 'SELECT * FROM person WHERE mobile = ?';
        database.query(sql, [parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
            if (error || results.length === 0) {
                res.redirect('/exit');
            } else {
                res.render('client-me', {
                    mobile: req.session.mobile,
                    name: results[0].name,
                    email: results[0].email,
                    facebook: results[0].facebook === null ? 'false' : 'true',
                    google: results[0].google === null ? 'false' : 'true',
                    showSteps: results[0].name === null ? 'true' : 'false',
                    notify: req.query.notify
                });
            }
        });
    });

    app.get('/scan', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        res.render('client-scan', {});
    });


    app.get('/checked', (req, res) => {
        if (!req.session.signed) {
            res.redirect('/index');
            return;
        }

        res.render('client-checked', {});
    });
}

function getOneHistoryHtml(time, position) {
    position = '[' + position.lat + ', ' + position.lng + ']';
    time = moment(time).format('YYYY-MM-DD HH:mm:ss');
    return `
    <van-step>
        <h3>` + position + `</h3>
        <p>` + time + `</p>
    </van-step>
    `
}