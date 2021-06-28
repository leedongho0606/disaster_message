"use strict";
const http = require("./http");

class WEBHOOK {
    webhookClients = [];
    static Discord;

    constructor(webhooks, discord) {
        this.Discord = discord;
        this._webhookRegister(webhooks);
    }

    Log(...arg) {
        console.log("[WEBHOOK]", ...arg);
    }

    Send(content) {
        this.Log("총", this.webhookClients.length, "개의 등록된 웹훅으로 메시지 전송중...");
        for (let webhook of this.webhookClients) {
            let msg = [webhook.url];
            webhook.send(content) // NOTE: 반드시 비동기!
                .then(() => {
                    msg.push("전송성공");
                })
                .catch(e => {
                    if (String(e).match("Unknown Webhook")) {
                        e = "webhook이 올바르지 않음";
                    }
                    msg.push("전송실패:", e);
                })
                .finally(() => {
                    this.Log(...msg);
                });
        }
    }

    async _webhookRegister(webhooks) {
        for (let url of webhooks) {
            this.Log(url, "전송할 웹훅목록에 등록중...");
            const splUrl = url.split("/");
            let addmsg;
            if (splUrl.length !== 7 && splUrl.length !== 5 && splUrl.length !== 2) {
                addmsg = "실패: 올바르지 않은 URL";
            }
            const currentUrl = new this.Discord.WebhookClient(splUrl[splUrl.length - 2], splUrl[splUrl.length - 1]);
            let isVaild = await this.chkVaildWehook("discord.com", `/api/webhooks/${splUrl[splUrl.length - 2]}/${splUrl[splUrl.length - 1]}`);
            try {
                isVaild = isVaild.data.toString();
                isVaild = JSON.parse(isVaild);
                if (isVaild.message) {
                    addmsg = "실패: " + JSON.stringify(isVaild);
                }
            } catch (e) {
                addmsg = "웹훅이 유효한지 알 수 없음";
            }
            if (!isVaild) {
                addmsg = "실패: ";
            }
            this.Log("전송할 웹훅목록에 등록", addmsg ? addmsg : "성공");
            if (addmsg) continue;
            this.webhookClients.push(currentUrl);
        }
        this.Log("전송할 웹훅목록 등록작업 완료. 전체", this.webhookClients.length, "개");
    }

    chkVaildWehook(hostname, path) {
        return http.httpsreq({
            hostname: hostname,
            path: path,
            method: "GET",
            timeout: 1000
        });
    }
}
module.exports = WEBHOOK;