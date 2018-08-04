const schedule = require('node-schedule');
const http = require('http');
const startWX = require('./wx.js').startWX;
const getAliDocs = require('./alipay.js').getAliDocs;
const express = require('express');
const config = require('./config.json');


// 启动express服务
var app = express();
http.createServer(app).listen('80', config.ip);
app.use(express.static('./'));
app.get('/', function (req, res) {
    res.redirect('./template/index.html');
});


// url
const urlWXComponent = 'https://developers.weixin.qq.com/miniprogram/dev/component/';
const urlWXAPI = 'https://developers.weixin.qq.com/miniprogram/dev/api/';
const urlAli = 'https://docs.alipay.com/mini/component/overview';
// 首次启动先爬取一遍
start();


// 定时任务
var rule = new schedule.RecurrenceRule();
var times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
rule.minute = times;
var j = schedule.scheduleJob(rule, function () {
    start();
});

// 爬虫函数
function start() {
    startWX(urlWXComponent, './result/wx-component.csv');
    startWX(urlWXAPI, './result/wx-api.csv');
    getAliDocs(urlAli);
}