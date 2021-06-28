"use strict";
const config = require("./config.json");
const twitter = new (require("./src/twitter"))(config.twitter);
const Discord = require("discord.js");
const webhook = new (require("./src/webhook"))(config.discord.webhooks, Discord);
const safekorea = new (require("./src/safekorea"))(config.safekorea);

// safekorea._hostname = "127.0.0.1";
twitter.CanPost = true;

safekorea.on("disastemsg", async msg => {
    Log("새로운 재난문자:", msg);

    const EmbedConfig = config.discord.embed;
    const embed = new Discord.MessageEmbed()
        .setColor(EmbedConfig.color)
        .setAuthor(EmbedConfig.author.name, EmbedConfig.author.iconurl, EmbedConfig.author.url)
        .setTitle(msg.sender)
        .setURL("https://m.safekorea.go.kr/idsiSFK/neo/main_m/dis/disasterDataView.html?bbsOrdr=" + msg.ordr)
        .setDescription(msg.content)
        .setFooter(msg.date.str + " 재난문자");
    // .setTimestamp(msg.date.obj)
    webhook.Send(embed);

    twitter.Post(`${msg.fullcont}\n#${msg.sender} ${msg.date.str} #재난문자`)
        .then(tweet => {
            console.log("[TWEET]", tweet.id_str);
        }).catch(e => {
            console.error("[TWEET] Error:", e);
        });
});

function Log(...arg) {
    console.log("[MAIN]", ...arg);
}