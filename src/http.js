"use strict";
const http = require("http");
const https = require("https");

module.exports = {
    req: (obj) => {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: obj.hostname,
                path: obj.path,
                port: !obj.port ? 80 : obj.port,
                method: !obj.method ? "GET" : obj.method,
                headers: obj.header,
                timeout: obj.timeout || 1000
            }, res => {
                resProcesse(res, resolve);
            });
            reqProcesse(obj, req, reject);
        });
    },
    httpsreq: (obj) => {
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: obj.hostname,
                path: obj.path,
                port: !obj.port ? 443 : obj.port,
                method: !obj.method ? "GET" : obj.method,
                headers: obj.header,
                timeout: obj.timeout || 1000
            }, res => {
                resProcesse(res, resolve);
            });
            reqProcesse(obj, req, reject);
        });
    }
}

function concatChunk(chunk, data) {
    return Buffer.concat([chunk, data], chunk.byteLength + Buffer.from(data).byteLength);
}

function resProcesse(res, resolve) {
    let chunk = Buffer.alloc(0);
    res.on("data", data => {
        chunk = concatChunk(chunk, data);
    });
    res.on("close", () => {
        resolve({ data: chunk, res: res });
    });
}

function reqProcesse(obj, req, reject) {
    if (obj.method === "POST" && obj.send) {
        req.write(obj.send);
    }
    req.on("error", e => {
        console.log("[HTTP] Request Error:", e);
        reject(e);
    });
    req.on("timeout", () => {
        console.log("[HTTP] Request timeout");
        reject(t);
    });
    req.end();
}