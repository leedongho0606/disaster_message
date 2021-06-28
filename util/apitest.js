const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/idsiSFK/neo/ext/json/disasterDataList/disasterDataList.json") return;
    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    res.write(fs.readFileSync("test.json"));
    res.end();
    console.log(Date.now(), "give...");
}).listen(80);