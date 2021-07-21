const setting = require('./setting');
const sever = require('./sever');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const xss = require("xss");

exports.OAuth = function (app, database) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (profile, done) {
        done(null, profile);
    });

    passport.deserializeUser(function (profile, done) {
        done(null, profile);
    });

    passport.use(new GoogleStrategy({
            clientID: setting.google.ClientID,
            clientSecret: setting.google.ClientSecret,
            callbackURL: setting.google.callbackURL,
            passReqToCallback: true
        },
        function (request, accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    ));

    app.get('/google', passport.authenticate('google', {
            scope: ['profile']
        }
    ));

    app.get('/google/callback', passport.authenticate('google', {
        successRedirect: '/google/success',
        failureRedirect: '/google/failure'
    }));

    app.get('/google/success', (req, res) => {
        //xss
        let sql = 'SELECT * FROM person WHERE google = ?';
        database.query(sql, [xss(req.session.passport.user.id)], function (error, results, fields) {
            if (error) {
                return sever.signFail(req, res, 'error');
            } else {
                if (results.length === 0) {//not linked
                    return res.redirect('/index?OAuth=google');
                } else {
                    console.log('Sign success(google): ' + results[0].mobile);
                    req.session.signed = true;
                    req.session.mobile = results[0].mobile;

                    sever.getRole(req.session.mobile, database, function (role) {
                        let jump = (role === 'no-user' || role === 'user') ? '/status' : '/admin';
                        res.redirect(jump);
                    });
                }
            }
        });
    });

    app.get('/google/failure', (req, res) => {
        res.redirect('/index');
    });
}

exports.openid = function (req, res, database) {
    if (!req.session.signed) {
        res.redirect('/index');
        return;
    }

    //mobile from encrypted session
    let sql = 'UPDATE person SET name = ?, google = ? WHERE mobile = ?';
    database.query(sql, [xss(req.session.passport.user.displayName), xss(req.session.passport.user.id), parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
        if (error) {
            console.log(error);
        } else {
            console.log('Google linked: ' + req.body.mobile);
        }
    });
}


