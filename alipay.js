// 加载https模块
const https = require('https');
const fs = require("fs");
// Cheerio 是一个Node.js的库， 它可以从html的片断中构建DOM结构，然后提供像jquery一样的css选择器查询
const cheerio = require('cheerio');
// phantom
const phantom = require('phantom');
// 定义网络爬虫的目标地址：
// const urlAli = 'https://docs.alipay.com/mini/component/overview';

// getAliDocs(urlAli);


async function getAliDocs(url) {
    const instance = await phantom.create();
    const page = await instance.createPage();
    const status = await page.open(url);
    const content = await page.property('content');
    await page.evaluate(function () {
        return window.SITEMAP;
    }).then(function (data) {
        outputFile('./result/alipay-component.csv', handlComponent(data.component.pages));
        handleAPI(data.api.pages, url);
        // handleAPI(data.api.pages).then(data => {
        //     outputJsonFile('./alipay-api.json', data);
        // });
    });
    await instance.exit();
}

/**
 *
 * @param data
 */
function handlComponent(data) {
    const length = data.length;
    let component = {};
    let rootPathArray = [];
    // 暂写成两遍循环。。
    for (let i in data) {
        data[i].title = cutTitle(data[i].title);
        if (data[i].depth === 3) {
            rootPathArray[data[i].currentPath - 1] = data[i].title;
        }
    }

    for (let i = 0; i < length; i++) {
        if (data[i].depth === 4) {
            let rootTitle = rootPathArray[data[i].rootPath - 1];
            component[rootTitle] ? '' : component[rootTitle] = [];
            component[rootTitle].push(data[i].title);
        }
    }
    return component;
}


/**
 * 搞api数据
 * @param data
 */
function handleAPI(data) {
    let apiData = {};
    let funcArray = [];
    let resultArray = [];
    for (let i = 0; i < data.length; i++) {
        data[i].title = cutTitle(data[i].title);
        if (data[i].url && data[i].title !== '快速接入') {
            funcArray.push(requestAPISite);
            requestAPISite(data[i].url, data[i].title, apiData, funcArray, resultArray);
        }
    }
}

function requestAPISite(path, title, apiData, funcArray, resultArray) {
    let url = 'https://docs.alipay.com/mini/' + path;
    let html = '';
    https.get(url, function (res) {
        let html = '';
        // 获取页面数据
        res.on('data', function (data) {
            html += data;
        });
        // 数据获取结束
        res.on('end', function () {
            // 沿用JQuery风格，定义$
            let $ = cheerio.load(html);
            let result = [];
            let selector = (title === '罗盘' || title === '加速度计') ? 'h3' : 'h2';
            $('.markdown').children(selector).each(function (index, element) {
                let text = $(element).text().trim();
                if (text !== '代码示例') {
                    result.push(text);
                }
            });
            apiData[title] = result;
            resultArray.push('result');
            if (funcArray.length === resultArray.length) {
                outputFile('./result/alipay-api.csv', apiData);
            }
        });
    }).on('error', function () {
        console.log('获取数据出错！');
    });

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
        if (err) console.log('写文件操作失败:' + filePath);
        else console.log('写文件操作成功:' + filePath);
    });
}

/**
 * 检测title中是否有html，如果有就从html开始位置截断，返回前半段
 * @param title
 * @returns {*}
 */
function cutTitle(title) {
    let indexof = title.indexOf('<');
    if (indexof > -1) {
        return title.slice(0, indexof - 1);
    } else {
        return title;
    }
}

module.exports = {
    getAliDocs
};