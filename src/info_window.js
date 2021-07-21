const qe = require('./qrcode_email');
const setting = require('./setting');

exports.user = function (mobile, name, email, status) {
    return `
<div class="ant-descriptions">
    <div class="ant-descriptions-title">` + name + `</div>
    <div class="ant-descriptions-view">
        <table>
            <tbody>
            <tr class="ant-descriptions-row">
                <td colspan="1" class="ant-descriptions-item"><span
                        class="ant-descriptions-item-label ant-descriptions-item-colon">Mobile</span><span
                        class="ant-descriptions-item-content">
        ` + mobile + `
    </span></td>
                <td colspan="1" class="ant-descriptions-item"><span
                        class="ant-descriptions-item-label ant-descriptions-item-colon">Email</span><span
                        class="ant-descriptions-item-content">
        ` + email + `
    </span></td>
                <td colspan="1" class="ant-descriptions-item"><span
                        class="ant-descriptions-item-label ant-descriptions-item-colon">Status</span><span
                        class="ant-descriptions-item-content"><img src="/img/` + status + `.png" style="height: 2rem;"></span></td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
`
}

exports.venue = function (mobile, name, position, next) {
    let query = 'lat=' + position.lat + '&lng=' + position.lng;
    let url = setting.url + setting.port + '/checkin?' + query;
    qe.qrcode(url, function (url) {
        let html = `
<div class="ant-empty">
    <div class="ant-empty-image">
        ` + url + `
    </div>
    <p class="ant-empty-description"><span>` + name + `<p>` + mobile + `</p></span></p>
</div>
`
        next(html);
    });
}
