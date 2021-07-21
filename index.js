const open = require('open');
const express = require("express");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const swig = require('swig');
const path = require("path");

const setting = require('./src/setting');
const google = require('./src/google');
const facebook = require('./src/facebook');
const client = require('./src/client');
const sever = require('./src/sever');
const admin = require('./src/admin');

const database = require('mysql2').createConnection(setting.database);
database.connect();

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);
swig.setDefaults({cache: false});

app.use(cookieParser(setting.secret));
app.use(session({
    secret: setting.secret,
    name: 'ContactTracing',
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 1000
    },
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

google.OAuth(app, database);
facebook.OAuth(app, database);
client.page(app, database);
sever.api(app, database);
admin.page(app, database);

app.listen(setting.port, () => {
    console.log('App started at ' + setting.url + setting.port);
    open(setting.url + setting.port);
});
