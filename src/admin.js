const setting = require('./setting');
const infoWindow = require('./info_window');
const sever = require('./sever');
const marker = require('./marker');
const qe = require('./qrcode_email');
const xss = require("xss");

exports.page = function (app, database) {
    app.get('/admin', (req, res) => {
        res.redirect('/admin/map');
    });

    app.get('/venue', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            res.render('admin-va', {
                name: person.name,
                mobile: person.mobile,
                key: ['map'],
                mapAPIKey: setting.google.mapAPIKey,
                mapId: setting.google.mapId
            });
        });
    });

    app.get('/admin/map', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            if (person.role === 'venue') {
                res.redirect('/venue');
                return;
            }
            res.render('admin-map', {
                name: person.name,
                mobile: person.mobile,
                key: ['map'],
                mapAPIKey: setting.google.mapAPIKey,
                mapId: setting.google.mapId
            });
        });
    });

    app.get('/admin/venue', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            res.render('admin-venue', {
                name: person.name,
                mobile: person.mobile,
                key: ['venue'],
                mapAPIKey: setting.google.mapAPIKey,
                mapId: setting.google.mapId
            });
        });
    });

    app.get('/admin/user', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            res.render('admin-user', {
                name: person.name,
                mobile: person.mobile,
                key: ['user']
            });
        });
    });

    app.post('/admin/search', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            getPersonList(database, function (personList) {
                let data = [];
                personList = personList.map(v => Object.assign({}, v));
                let text = xss(req.body.text);
                for (let i = 0; i < personList.length; i++) {
                    if (has(personList[i].mobile, text) ||
                        has(personList[i].role, text) ||
                        has(personList[i].status, text) ||
                        has(personList[i].name, text) ||
                        has(personList[i].email, text))
                        data.push(personList[i]);
                }
                res.json({
                    data: data
                });
            });
        });
    });

    app.post('/venue/search', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            getPersonList(database, function (personList) {
                getVenuePosition(database, person.mobile, function (venue) {
                    getHistory(database, function (history) {
                        let data = [];
                        let myUsers = [];
                        personList = personList.map(v => Object.assign({}, v));
                        venue = venue.map(v => Object.assign({}, v));
                        history = history.map(v => Object.assign({}, v));

                        for (let i = 0; i < venue.length; i++) {//for every position
                            for (let j = 0; j < history.length; j++) {//find position history
                                if(history[j].position === venue[i].position && !myUsers.includes(history[j].mobile)){
                                    myUsers.push(history[j].mobile);
                                }
                            }
                        }
                        myUsers.sort();
                        for (let i = 0; i < personList.length; i++) {
                            if (personList[i].mobile === myUsers[0]){
                                data.push(personList[i]);
                                myUsers.shift();
                                if(myUsers.length === 0){
                                    break;
                                }
                            }
                        }
                        res.json({
                            data: data
                        });
                    });
                });
            });
        });
    });

    app.post('/admin/role', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            for (let i = 0; i < req.body.rows.length; i++) {
                let sql = 'UPDATE person SET role = ? WHERE mobile = ?';
                database.query(sql, [xss((req.body.role)), parseFloat(xss((req.body.rows[i])))], function (error, results, fields) {
                    if (!error) {
                        res.sendStatus(200);
                    }
                });
            }
        });
    });

    app.post('/admin/status', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            for (let i = 0; i < req.body.rows.length; i++) {
                let sql = 'UPDATE person SET status = ? WHERE mobile = ?';
                database.query(sql, [xss((req.body.status)), parseFloat(xss((req.body.rows[i])))], function (error, results, fields) {
                    if (!error) {
                        res.sendStatus(200);
                    }
                });
            }
        });
    });

    app.post('/admin/email', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            for (let i = 0; i < req.body.rows.length; i++) {
                qe.send(req.body.rows[i], xss(req.body.text));
                res.sendStatus(200);
            }
        });
    });

    app.post('/admin/create', (req, res) => {
        checkAdmin(res, req, database, function (person) {
            let position = {
                lat: parseFloat(xss(req.body.position.lat)),
                lng: parseFloat(xss(req.body.position.lng))
            }
            position = JSON.stringify(position);
            let sql = 'INSERT INTO venue (mobile, name, position) VALUES (?,?,?)';
            database.query(sql, [parseFloat(xss(req.body.mobile)), xss(req.body.name), position], function (error, results, fields) {
                if (!error) {
                    if(person.role === 'user'){
                        sql = 'UPDATE person SET role = ? WHERE mobile = ?';
                        database.query(sql, ['venue', parseFloat(xss(req.body.mobile))], function (error, results, fields) {
                            if (!error) {
                                res.sendStatus(200);
                            }
                        });
                    } else {
                        res.sendStatus(200);
                    }
                }
            });
        });
    });

    app.post('/admin/markers', (req, res) => {
        if (req.body.type !== 'user' && req.body.type !== 'venue') {
            // history
            if (req.session.mobile === req.body.type) {
                let sql = 'SELECT * FROM history WHERE mobile = ?';
                database.query(sql, [xss(req.session.mobile)], function (error, results, fields) {
                    if (!error) {
                        let markers = [];
                        for (let i = 0; i < results.length; i++) {
                            marker.initIcon(results[i].mobile);
                            markers.push({
                                position: results[i].position,
                                icon: '/img/marker/' + results[i].mobile + '.png'
                            });
                        }
                        res.json({
                            markers: markers
                        });
                    }
                });
            }
        } else {
            checkAdmin(res, req, database, function (person) {
                // user
                if (req.body.type === 'user' && person.role === 'admin') {
                    getPersonList(database, function (personList) {
                        let persons = [];
                        for (let i = 0; i < personList.length; i++) {
                            persons[personList[i].mobile] = {
                                name: personList[i].name,
                                email: personList[i].email,
                                status: personList[i].status
                            }
                        }
                        let sql = 'SELECT * FROM history';
                        database.query(sql, null, function (error, results, fields) {
                            if (!error) {
                                let markers = [];
                                for (let i = 0; i < results.length; i++) {
                                    let p = persons[results[i].mobile];
                                    marker.initIcon(results[i].mobile);
                                    markers.push({
                                        position: results[i].position,
                                        icon: '/img/marker/' + results[i].mobile + '.png',
                                        info: {
                                            content: infoWindow.user(results[i].mobile, p.name, p.email, p.status.toLowerCase())
                                        }
                                    });
                                }
                                res.json({
                                    markers: markers
                                });
                            }
                        });
                    });
                }
                // venue
                else if (req.body.type === 'venue' && person.role === 'admin') {
                    let sql = 'SELECT * FROM venue';
                    database.query(sql, null, function (error, results, fields) {
                        if (!error) {
                            let markers = [];
                            for (let i = 0; i < results.length; i++) {
                                infoWindow.venue(results[i].mobile, results[i].name, results[i].position, function (content) {
                                    markers.push({
                                        position: results[i].position,
                                        icon: '/img/venue.png',
                                        info: {
                                            content: content
                                        }
                                    });
                                    if (i === (results.length - 1)) {
                                        res.json({
                                            markers: markers
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });
}

function checkAdmin(res, req, database, next) {
    if (!req.session.signed) {
        res.redirect('/index');
        return;
    }

    sever.getRole(req.session.mobile, database, function (role, person) {
        if (role === 'admin' || role === 'venue') {
            next(person);
        } else {
            res.redirect('/index');
        }
    });
}

function has(result, text) {
    if (result === undefined || result === null) {
        return false;
    } else if (typeof (result) !== 'string') {
        result = result.toString();
    }
    return result.indexOf(text) !== -1;
}

function getPersonList(database, next) {
    let sql = 'SELECT * FROM person';
    database.query(sql, null, function (error, results, fields) {
        if (!error) {
            next(results);
        }
    });
}

function getVenuePosition(database, mobile, next) {
    let sql = 'SELECT * FROM venue WHERE mobile = ?';
    database.query(sql, [xss(mobile)], function (error, results, fields) {
        if (!error) {
            next(results);
        }
    });
}

function getHistory(database, next) {
    let sql = 'SELECT * FROM history';
    database.query(sql, null, function (error, results, fields) {
        if (!error) {
            next(results);
        }
    });
}