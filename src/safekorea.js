"use strict";
const Events = require("events");
const http = require("./http");
const html_entities = new (require('html-entities').AllHtmlEntities)();

class SAFEKOREA extends Events.EventEmitter {
    _hostname = "www.safekorea.go.kr";
    // _hostname = "127.0.0.1";

    config = {};
    data = {};

    use = {
        disasterMsg: true,
        log: true
    }

    constructor(config) {
        super();
        this.config = config;
        this.config.reqtimeout *= 1000;
        this.Start();
        if (this.interval) {
            this.Log(this.config.checkdelay, "초 주기로 국민재난안전포털에서 전국재난문자 수집중...");
        }
    }

    GetData() {
        return this.data;
    }

    Start() {
        const f = () => {
            this._DataCheck();
        };
        this.interval = setInterval(f, this.config.checkdelay * 1000);
    }

    Log(...arg) {
        if (!this.use.log) return;
        if ([...arg][arg.length - 1]) {
            arg = arg.splice(0, arg.length - 1);
            console.error("[SafeKorea]", ...arg);
            return;
        }
        console.log("[SafeKorea]", ...arg);
    }

    async _DataCheck() {
        if (this.use.disasterMsg) {
            let NewDisasterMsgList = await this.GetDisasterDataList();
            if (NewDisasterMsgList && NewDisasterMsgList.length) {
                const NewDisasterMsg = NewDisasterMsgList[0].BBS_ORDR;
                const { LastDisasterMsg } = this.data;
                if (LastDisasterMsg && LastDisasterMsg !== NewDisasterMsg) {
                    let newMsgCnt = NewDisasterMsg - LastDisasterMsg;
                    this.Log(newMsgCnt, "개의 새로운 재난문자 확인됨");
                    if (newMsgCnt > 0) {
                        let targetORDRs = []; // 보낼대상인 고번
                        for (let i = LastDisasterMsg + 1; i <= (NewDisasterMsg); i++) {
                            targetORDRs.push(i);
                        }
                        this.Log("이벤트 발동할 재난문자 고유번호:", targetORDRs.join(", "));
                        this._emitResult(this, NewDisasterMsgList, targetORDRs);
                    } else return;
                }
                this.data.LastDisasterMsg = NewDisasterMsg;
            }
        }
    }

    async GetDisasterDataList() {
        let res;
        try {
            res = await this.ReqAPI("disasterDataList/disasterDataList.json");
            res = res.data.toString();
            res = JSON.parse(res);
        } catch (e) {
            this.Log("Get disaster datalist fail:", e, true);
        }
        return res;
    }

    _mkResult(disMsg) {
        let { SJ } = disMsg;
        SJ = SJ.split(" ");
        let Sender = SJ[2].replace("재난문자", "").replace(/[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi, "").trim();
        let Content = disMsg.CONT.substring(Sender.length + 2);
        Content = html_entities.decode(Content).trim();
        let SendDate = {
            str: `${SJ[0]} ${SJ[1]}`,
            obj: this._mkTimeObj(SJ[0], SJ[1])
        };
        return {
            sender: Sender,
            content: Content,
            fullcont: disMsg.CONT.trim(),
            ordr: disMsg.BBS_ORDR,
            date: SendDate
        };
    }

    _mkTimeObj(ymd, hms) {
        let res;
        try {
            const [y, m, d] = ymd.split("/");
            const [H, M, S] = hms.split(":");
            res = new Date(y, Number(m) - 1, d, H, M, S);
            res.setMilliseconds(0);
            if (isNaN(d.getTime())) res = null;
        } catch (e) {
            this.Log(e, true);
        }
        return res;
    }

    _emitResult(t, disMsgList, target) {
        for (let msg of disMsgList.reverse()) { // 최신 재난문자가 맨 마지막에 이미트되야함
            const idx = target.indexOf(msg.BBS_ORDR);
            if (idx < 0) continue;
            target.splice(idx, 1);
            t.emit("disastemsg", this._mkResult(msg));
            t.Log("재난문자 고유번호:", msg.BBS_ORDR, " 이벤트 발동됨");
        }
    }

    ReqAPI(path, timeout) {
        return http.req({
            hostname: this._hostname,
            path: "/idsiSFK/neo/ext/json/" + path,
            method: "GET",
            timeout: timeout || this.config.reqtimeout
        });
    }
}
module.exports = SAFEKOREA;