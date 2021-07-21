//sever
exports.url = 'http://localhost:';
exports.port = 5321;//change port will disable Facebook and google (Oauth&Map)
exports.secret = require('crypto').randomBytes(64).toString('hex');

//database
exports.database = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'contact_tracing'
};

//Twilio SMS
exports.SMS = {
    accountSid: '',
    authToken: '',
    severId: '',
    mobileRegex: '^[0-9]{9}$',
    defaultSendInterval: 60 * 1000
}

//Facebook
exports.facebook = {
    AppID: '',
    AppSecret: '',
    callbackURL: 'http://localhost:5321/facebook/callback'
}

//Google
exports.google = {
    ClientID: '',
    ClientSecret: '',
    callbackURL: 'http://localhost:5321/google/callback',
    mapAPIKey: '',
    mapId: ''
}

//Email
exports.email = {
    regex: /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
}