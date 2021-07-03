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

    _CutMessage(str) {
        if (str.length > 140) {
            str = str.substring(0, 140);
        }
        return str;
    }
    //https://github.com/desmondmorris/node-twitter/tree/master/examples
    Post(msg, img) {
        return new Promise(async (resolve, reject) => {
            msg = this._CutMessage(msg);
            const data = { status: msg }; // 이미지 업로드를 실패하더라도 글은 올릴수 있도록.
            if (!this.CanPost) return reject("트윗전송 차단됨"); // 전송이 차단된경우 여기서 중단
            if (img) {
                await this.PostMedia(img)
                    .then(mid => {
                        data.media_ids = mid;
                    })
                    .catch(() => {
                        Log("이미지 첨부 실패");
                    });
            }
            this.Twitter.post("statuses/update", data, function (error, tweet, response) {
                if (error) {
                    return reject(error);
                }
                resolve(tweet, response);
                // Log(status);
            });
        });
    }

    PostMedia(path) {
        return new Promise((resolve, reject) => {
            const fs = require("fs");
            this.Twitter.post("media/upload", { media: fs.readFileSync(path) }, function (error, media) { // param: res
                if (error) {
                    reject(error);
                    return Log("MediaPost 실패", error);
                }
                // NOTE: 필요시 media 자체를 넘기면됨
                resolve(media.media_id_string);
            });
        });
    }
    // https://github.com/tweepy/tweepy/issues/1267#issuecomment-530619285
    ReplyTweet(status_id, msg) { 
        return new Promise((resolve, reject) => {
            msg = this._CutMessage(msg);
            this.Twitter.post("statuses/update", { in_reply_to_status_id: status_id, status: msg }, function (error, tweet, response) {
                if (error) {
                    reject(error);
                    return Log("TweetReply 실패", error);
                }
                resolve(tweet, response);
            });
        });
    }
    
    FavoriteTweet(status_id) {
        return new Promise((resolve, reject) => {
            this.Twitter.post("favorites/create.json", { id: status_id }, function (error, tweet, response) {
                if (error) {
                    reject(error);
                    return Log("TweetFavorite 실패", error);
                }
                resolve(tweet, response);
            });
        });
    }
}

function Log(...arg) {
    console.log("[Twitter]", ...arg);
}

module.exports = TwitterWoker;