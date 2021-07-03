"use strict";
const Events = require("events");
const http = require("./http");
const html_entities = new (require('html-entities').AllHtmlEntities)();

class SAFEKOREA extends Events.EventEmitter {
    _hostname = "www.safekorea.go.kr";
    config = {};
    data = {};

    use = {
        disasterMsg: true
    }

    constructor(config) {
        super();
        this.config = config;
        this.config.reqtimeout *= 1000;
        this.data.nodataretry = this.config.nodataretry;
        this.Start();
        if (this.interval) {
            Log(this.config.checkdelay, "초 주기로 국민재난안전포털에서 전국재난문자 수집중...");
        }
    }

    Start() {
        const f = () => {
            if (!this.work) return;
            this._DataCheck();
        };
        this.interval = setInterval(f, this.config.checkdelay * 1000);
    }

    async _DataCheck(date) {
        if (this.use.disasterMsg) {
            const today = this._getToday(date);
            const postData = JSON.stringify({
                bbs_searchInfo: {
                    bbs_no: 63,
                    pageUnit: this.config.reqmsgcnt,
                    search_start: today,
                    search_end: today
                }
            });
            const NewMsgList = await this.ReqData("bbs/user/selectBbsList.do", postData);
            const { bbsList } = NewMsgList;
            if (!bbsList || !bbsList.length) {
                // 새벽중에 재난문자 수집을 시작하면 아무런 데이터가 없어서 아침에 한번 무시되므로 전날 데이터를 가져옮
                if (this.data.nodataretry) {
                    this._DataCheck(-1);
                    this.data.nodataretry -= 1;
                }
                return;
            }
            else if (!this.data.nodataretry) {
                this.data.nodataretry = this.config.nodataretry;
            }
            const NewMsg = bbsList[0].BBS_ORDR;
            const { LastMsg } = this.data;
            if (LastMsg && LastMsg !== NewMsg) {
                let newMsgCnt = NewMsg - LastMsg;
                Log(newMsgCnt, "개의 새로운 재난문자 확인됨");
                if (newMsgCnt > 0) {
                    let ordrTarget = []; // 보낼대상인 고번
                    for (let i = LastMsg + 1; i <= NewMsg; i++) {
                        ordrTarget.push(i);
                    }
                    Log("이벤트 발동할 재난문자 고유번호:", ordrTarget.join(", "));
                    this._emitResult(ordrTarget);
                } else return;
            }
            this.data.LastMsg = NewMsg;
        }
    }

    async _mkResult(ordr) {
        const postData = JSON.stringify({
            bbs_searchInfo: {
                bbs_no: 63,
                bbs_ordr: ordr
            }
        });
        const lookup = await this.ReqData("bbs/user/selectBbsView.do", postData);
        if (!lookup || !lookup.bbsMap || !lookup.bbsMap.cn) return;

        let { sj, cn, bbs_ordr } = lookup.bbsMap;
        sj = sj.split(" ");
        cn = html_entities.decode(cn);
        let areaList = cn.split("-송출지역-");
        const Sender = areaList[0].split("[")[1].split("]")[0];
        const fullCont = areaList[0].trim();
        const Content = fullCont.substring(Sender.length + 2).trim();
        areaList = areaList[1].split("\r\n").splice(1); // splice?
        const SendDate = { str: `${sj[0]} ${sj[1]}` };
        SendDate.obj = new Date(SendDate.str);

        return {
            sender: Sender,
            content: Content,
            fullcont: fullCont,
            areas: areaList,
            ordr: bbs_ordr,
            date: SendDate
        };
    }

    _getToday(date) {
        let res = new Date();
        if (date && typeof (date) === "number") {
            res.setDate(res.getDate() - date);
        }
        function fillZero(num) {
            return num.toString().padStart(2, "0");
        }
        return `${res.getFullYear()}${fillZero(res.getMonth() + 1)}${fillZero(res.getDate())}`;
    }

    async _emitResult(ordrTarget) {
        for (let ordr of ordrTarget) { // 최신 재난문자는 마지막에 이미트
            this.emit("disastemsg", await this._mkResult(ordr));
            Log("재난문자 고유번호:", ordr, " 이벤트 발동됨");
        }
    }

    async ReqData(path, postdata) {
        let res;
        try {
            res = await this.ReqAPI(path, postdata);
            res = JSON.parse(res.data.toString());
        } catch (e) {
            throw e;
        }
        return res;
    }

    ReqAPI(path, postdata) {
        return http.req({
            hostname: this._hostname,
            path: "/idsiSFK/" + path,
            method: postdata ? "POST" : "GET",
            send: postdata,
            timeout: this.config.reqtimeout
        });
    }
}

function Log(...arg) {
    console.log("[SafeKorea]", ...arg);
}

module.exports = SAFEKOREA;