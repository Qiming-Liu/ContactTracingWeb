const setting = require('./setting');
const sever = require('./sever');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const xss = require("xss");

exports.OAuth = function (app, database) {
    passport.use(new FacebookStrategy({
            clientID: setting.facebook.AppID,
            clientSecret: setting.facebook.AppSecret,
            callbackURL: setting.facebook.callbackURL
        },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    ));

    app.get('/facebook', passport.authenticate('facebook'));

    app.get('/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/facebook/success',
        failureRedirect: '/facebook/failure'
    }));
    
    app.get('/facebook/success', (req, res) => {
        //xss
        let sql = 'SELECT * FROM person WHERE facebook = ?';
        database.query(sql, [xss(req.session.passport.user.id)], function (error, results, fields) {
            if (error) {
                return sever.signFail(req, res, 'error');
            } else {
                if (results.length === 0) {//not linked
                    return res.redirect('/index?OAuth=facebook');
                } else {
                    console.log('Sign success(facebook): ' + results[0].mobile);
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

    app.get('/facebook/failure', (req, res) => {
        res.redirect('/index');
    });
}

exports.openid = function (req, res, database) {
    if (!req.session.signed) {
        res.redirect('/index');
        return;
    }

    //mobile from encrypted session
    let sql = 'UPDATE person SET name = ?, facebook = ? WHERE mobile = ?';
    database.query(sql, [xss(req.session.passport.user.displayName), xss(req.session.passport.user.id), parseFloat(xss((req.session.mobile)))], function (error, results, fields) {
        if (error) {
            console.log(error);
        } else {
            console.log('Facebook linked: ' + req.body.mobile);
        }
    });
}


