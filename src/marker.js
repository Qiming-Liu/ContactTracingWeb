const sharp = require('sharp');
const fs = require('fs')

exports.initIcon = function (mobile) {
    let url = './public/img/marker/' + mobile.toString() + '.png';
    fs.access(url, fs.constants.F_OK, (err) => {
        if (err) {
            sharp('./public/img/point.png')
                .tint(colorTran(mobile))
                .toFile(url)
                .then();
        }
    });
}

function colorTran(mobile) {
    let space = 16777215 / 99999999;
    let color6 = Math.round(parseInt(mobile.toString().substr(1)) * space).toString(16);
    return {
        r: hex2int(color6.slice(0, 2)),
        g: hex2int(color6.slice(2, 4)),
        b: hex2int(color6.slice(4, 6))
    }
}

function hex2int(hex) {
    let len = hex.length, a = new Array(len), code;
    for (let i = 0; i < len; i++) {
        code = hex.charCodeAt(i);
        if (48 <= code && code < 58) {
            code -= 48;
        } else {
            code = (code & 0xdf) - 65 + 10;
        }
        a[i] = code;
    }
    return a.reduce(function (acc, c) {
        acc = 16 * acc + c;
        return acc;
    }, 0);
}