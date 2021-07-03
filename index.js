"use strict";
const config = require("./config.json");
const twitter = new (require("./src/twitter"))(config.twitter);
const Discord = require("discord.js");
const webhook = new (require("./src/webhook"))(config.discord.webhooks, Discord);
const safekorea = new (require("./src/safekorea"))(config.safekorea);
twitter.CanPost = true;

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
    // .setTimestamp(msg.date.obj)
    webhook.Send(embed);

    const Posttweet = `${msg.fullcont}\n#${msg.sender} ${msg.date.str} #재난문자`;
    twitter.Post(Posttweet)
        .then(Ptweet => {
            console.log("[TWEET]", "Post tweet:", Ptweet.id_str, Posttweet);
            twitter.ReplyTweet(Ptweet.id_str, "-송출지역-\n" + areaStr)
                .then(RPtweet => {
                    console.log("[TWEET]", Ptweet.id_str, "Reply", RPtweet.id_str);
                    FavoriteTweet(RPtweet.id_str);
                }).catch(e => {
                    console.error("[TWEET]", Ptweet.id_str, "Reply Error:", e);
                });
            FavoriteTweet(Ptweet.id_str);
        }).catch(e => {
            console.error("[TWEET] Post tweet Error:", e);
        });
});

function FavoriteTweet(id) {
    twitter.FavoriteTweet(id)
        .then(Ftweet => {
            console.log("[TWEET]", id, "Favorite", Ftweet.id_str);
        }).catch(e => {
            console.error("[TWEET]", id, "Favorite Error:", e);
        });
}

function Log(...arg) {
    console.log("[MAIN]", ...arg);
}