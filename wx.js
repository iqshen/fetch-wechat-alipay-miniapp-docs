// 加载https模块
const https = require('https');
const fs = require("fs");
// Cheerio 是一个Node.js的库， 它可以从html的片断中构建DOM结构，然后提供像jquery一样的css选择器查询
const cheerio = require('cheerio');

// 定义网络爬虫的目标地址：
// var urlWXComponent = 'https://developers.weixin.qq.com/miniprogram/dev/component/';
// var urlWXAPI = 'https://developers.weixin.qq.com/miniprogram/dev/api/';

// startWX(urlWXComponent, './wx-component.csv');
// startWX(urlWXAPI, './wx-api.csv');

/**
 * 抓微信文档
 * @param url
 * @param resultPath
 */
function startWX(url, resultPath) {
    https.get(url, function (res) {
        var html = '';
        // 获取页面数据
        res.on('data', function (data) {
            html += data;
        });
        // 数据获取结束
        res.on('end', function () {
            var data = filterSlideList(html);
            outputFile(resultPath, data);
        });
    }).on('error', function () {
        console.log('获取数据出错！');
    });
}


/**
 * 处理并返回data对象
 * @param html
 */
function filterSlideList(html) {
    if (html) {
        // 沿用JQuery风格，定义$
        var $ = cheerio.load(html);
        var result = {};
        $('.summary').children('li').each(function (item) {
            let title = $(this).children('a').text().trim();
            let content = [];

            $(this).children('ul').find('a').each(function (item) {
                if ($(this).next().length === 0) {
                    content.push($(this).text().trim());
                }
            });
            result[title] = content;
        });

        return result;

    } else {
        console.log('无数据传入！');
    }
}


/**
 * 将数据输出为csv文件
 * @param filePath
 * @param data
 */
function outputFile(filePath, data) {
    let str = '';
    let bom = '\uFEFF';
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
        str += `${key} : ${value.length},` + value.join(',') + '\n'
        count += value.length
    }
    str += count;


    fs.writeFile(filePath, bom.concat(str), function (err) {
        if (err) console.log('写文件操作失败:'+filePath);
        else console.log('写文件操作成功:'+filePath);
    });
}

module.exports = {
    startWX
};