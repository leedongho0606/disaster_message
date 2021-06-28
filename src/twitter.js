"use strict";
const Events = require("events");
const TwitterPackage = require("twitter");

class TwitterWoker extends Events.EventEmitter {
    static Twitter;
    CanPost = false;

    constructor(keys) {
        super();
        this.Twitter = new TwitterPackage({ ...keys });
    }

    Log(...arg) {
        console.log("[Twitter]", ...arg);
    }

    //https://github.com/desmondmorris/node-twitter/tree/master/examples
    Post(msg, img) {
        if (msg.length > 140) {
            msg = msg.substring(0, 140);
        }
        const status = { status: msg }; // 이미지 업로드를 실패하더라도 글은 올릴수 있도록.
        return new Promise(async (resolve, reject) => {
            if (!this.CanPost) return reject("트윗전송 차단됨"); // 전송이 차단된경우 여기서 중단
            if (img) {
                await this.PostMedia(img)
                    .then(mid => {
                        status.media_ids = mid; // String
                    })
                    .catch(() => {
                        this.Log("이미지 첨부 실패");
                    });
            }
            this.Twitter.post("statuses/update", status, function (error, tweet, response) {
                if (error) {
                    reject(error);
                }
                resolve(tweet, response);
            });
            this.Log(status);
        });
    }

    PostMedia(path) {
        return new Promise((resolve, reject) => {
            const fs = require("fs");
            this.Twitter.post("media/upload", { media: fs.readFileSync(path) }, function (error, media) { // param: res
                if (error) {
                    reject(error);
                    return this.Log("MediaPost 실패", error);
                }
                // NOTE: 필요시 media 자체를 넘기면됨
                resolve(media.media_id_string);
            });
        });
    }
}
module.exports = TwitterWoker;