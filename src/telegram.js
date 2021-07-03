"use strict";
const { Telegraf } = require("Telegraf");

class TelegramWoker {
    static Bot;
    chatId;

    constructor(config) {
        this.bot = new Telegraf(config.token).telegram;
        this.chatId = config.chatid;
        this.sendoption = config.sendoption;
    }

    log = Log;

    send(content) {
        return new Promise(async (resolve, reject) => {
            if (!this.CanSend) {
                reject("전송차단");
                return Log("메시지 전송실패: 전송차단됨");
            }
            this.bot.sendMessage(this.chatId, content, this.sendoption)
                .then(resolve)
                .catch(reject);
        });
    }
}

function Log(...arg) {
    console.log("[TELEGRAM]", ...arg);
}

module.exports = TelegramWoker;