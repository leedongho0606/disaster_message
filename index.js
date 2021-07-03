"use strict";
const config = require("./config.json");
const twitter = new (require("./src/twitter"))(config.twitter);
const telegram = new (require("./src/telegram"))(config.telegram);
const Discord = require("discord.js");
const webhook = new (require("./src/webhook"))(config.discord.webhooks, Discord);
const safekorea = new (require("./src/safekorea"))(config.safekorea);

safekorea.work = true;
twitter.CanPost = true;
telegram.CanSend = true;
webhook.CanSend = true;

safekorea.on("disastemsg", async msg => {
    Log("새로운 재난문자:", msg);

    let areaStr = msg.areas;
    for (let k in areaStr) {
        areaStr[k] = areaStr[k].replace("전체", "").trim();
    }
    areaStr = msg.areas.join("\n");

    const EmbedConfig = config.discord.embed;
    const embed = new Discord.MessageEmbed()
        .setColor(EmbedConfig.color)
        .setAuthor(EmbedConfig.author.name, EmbedConfig.author.iconurl, EmbedConfig.author.url)
        .setTitle(msg.sender)
        .setURL("https://m.safekorea.go.kr/idsiSFK/neo/main_m/dis/disasterDataView.html?bbsOrdr=" + msg.ordr)
        .setDescription("```" + msg.content + "```")
        .addField("송출지역", `>>> ${areaStr}`)
        .setFooter(msg.date.str + " · 국민재난안전포털");
    webhook.Send(embed);

    twitter.Post(`${msg.fullcont}\n#${msg.sender} ${msg.date.str} #재난문자`)
        .then(Ptweet => {
            twitter.log("Post tweet:", Ptweet.id_str, Ptweet.text);
            twitter.ReplyTweet(Ptweet.id_str, "-송출지역-\n" + areaStr)
                .then(RPtweet => {
                    twitter.log(Ptweet.id_str, "Reply", RPtweet.id_str);
                    FavoriteTweet(RPtweet.id_str);
                }).catch(e => {
                    twitter.log(Ptweet.id_str, "Reply Error:", e);
                });
            FavoriteTweet(Ptweet.id_str);
        }).catch(e => {
            twitter.log("Post tweet Error:", e);
        });

    telegram.send(`${msg.fullcont}\n\n-송출지역-\n${areaStr}\n\n${msg.date.str} 재난문자`)
        .then(res => {
            telegram.log("메시지 전송성공:", res.text);
        })
        .catch(e => {
            telegram.log("메시지 전송실패:", e);
        });
});

function FavoriteTweet(id) {
    twitter.FavoriteTweet(id)
        .then(Ftweet => {
            twitter.log(id, "Favorite", Ftweet.id_str);
        }).catch(e => {
            twitter.log(id, "Favorite Error:", e);
        });
}

function Log(...arg) {
    console.log("[MAIN]", ...arg);
}