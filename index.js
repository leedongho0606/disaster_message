const Discord = require("discord.js"), https = require("https"), html_entities = new (require('html-entities').AllHtmlEntities)();// request 모듈은 개발이 중지되었으므로 가벼운(?) https 모듈을 사용
let dmdata; // 보낸 재난문자의 발송시간
function webhooksend(title, info, time) {
    try { // 웹훅 전송에 성공하면
        /* https://discordapp.com/api/webhooks/740589415491174461/1zxts-jfHrVnQQzOJbWzAaSSSGPuh8RTRF9AFSmpDlasKOcqiGlWEx9Vjpu66igYwTXb
                                              |    webhook id    |                            webhook token                           |*/
        new Discord.WebhookClient("webhook id", "webhook token") // 아래코드에서는 html entity를 decode한다(부하줄이기 위함)
            .send({ "embeds": [{ "title": title, "color": 16711680, "description": html_entities.decode(info), "footer": { "text": "국민재난안전포털 | " + time, "icon_url": "https://raw.githubusercontent.com/leedongho0606/cp/master/img/logo_gov.png" }, }] });
        console.log("웹훅 전송 성공: " + title + "\n" + info);
    } catch (e) { // 웹훅 전송에 실패하면
        console.error("웹훅 전송 실패:\n", e);
    }
}
function getdisaster_message(callback) { // https: 443, http: 80
    let data = ""; // 받은 데이터 임시 저장용 변수
    https.request({ hostname: "www.safekorea.go.kr", path: "/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json", port: "443", method: "GET", headers: { "Content-Type": "application/JSON; charset=utf-8" } }, res => {
        res.on("data", body => { // 서버가 데이터를 전송하면
            data += Buffer.from(body).toString(); // 서버에서 나눠서 클라이언트로 전송하므로 data 변수에 받을때마다 넣음
        });
        res.on("end", () => { // 서버와의 연결이 종료되면
            try { // 재난문자 데이터를 JSON데이터화 성공하면
                data = JSON.parse(data)[0]; // 최상위 재난문자
                callback((data.SJ).substr(20), data.CONT, (data.SJ).substring(0, 19)); // 이코드에서는 html entity를 decode하지 않는다(부하줄이기 위함), 데이터 처리 다되면 콜백
                //console.log("재난문자 불러오기 성공!\n",data);
            } catch (e) { // 재난문자 데이터를 JSON데이터화 실패하면 오류로 인해 프로세스가 종료되는걸 막는다.
                console.error("재난문자 불러오기 실패\n", e);
                callback(null);
            }
        });
    }).end(); // 서버 연결을 종료.
}
setInterval(() => {
    getdisaster_message((title, info, time) => {
        if (!title) return;
        if (dmdata && dmdata != time) { // 이전에 보낸 재난문자가 아니라면
            webhooksend(title, info, time); // 웹훅 전송
        }// else if (!dmdata) // 이전에 보낸 재난문자라면
        dmdata = time; // 이전에 보낸 재난문자의 발송시간을 변수에 대입
    })
}, 1000); // 1초마다 파싱, 기본 1초를 권장합니다. 더 작은수는 재난문자서버로 부터 IP 차단을 당할수 있음!
