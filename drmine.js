const fs = require('fs');
const { URL } = require('url');
const puppeteer = require('puppeteer');

const resources = [     // resource types not needed to be requested
    'font',
    'image',
    'media',
    'stylesheet'
];

let online_miners;
const miner_list = 'list_browser.txt';

let browser;
const path = process.argv[2];
const output_file = 'culprits.txt';

async function init(){
    try{
        browser = await puppeteer.launch({
            //headless: false,
            ignoreHTTPSErrors: true,
            //executablePath: '/usr/bin/chrome',  // can be set as required
            args: ['--no-sandbox']
        });
    }
    catch(e){
        console.log('Error!', e);
    }
}

async function responseInfo(url){
    let page;
    try {
        page = await browser.newPage();
        page.setRequestInterception(true);
        page.on('request', req => intercept(req, url));
        //await page.setViewport({height: 1200, width: 1600});
        await page.goto(url, {timeout: 30000});
        await page.close();
    }
    catch (e) {
        console.log(url, e);
    }
}

function intercept(request, url){
    // abort request to unneccessary resources
    if(resources.includes(request.resourceType)){
        return request.abort();
    }
    else if('script' === request.resourceType()){
        detectMiner(request, url);
    }
    request.continue();
}

function detectMiner(request, url){
    // ignore results of redirect - TODO
    const script_url = new URL(request.url());
    if(online_miners.includes(script_url.host)){
        console.log(`Test against =>  ${url}`);
        console.log(`Detected miner: ${request.url()}`);
        writeFile(output_file, {url: url, msg: ` => Found using ${request.url()}`});
    }
}

function writeFile(fileName, data, flag='a'){   // data expected to be an object with attrs url and msg
    fs.writeFile(fileName, `${data.url} ${data.msg}\n`, {flag: flag}, (err) => {
        if(err) console.log(err)
    });
}

function proceed(domains){
    if(!domains.length){
        browser.close();
        return false;
    }
    console.log('Length: ', domains.length);
    const top50 = domains.splice(0, 50);
    console.log(top50.length, domains.length);
    top50.forEach(async domain => {
        try{
            await responseInfo(`${domain.trim()}`);
        }
        catch(e){
            // do nothing
            return false;
        }
    });
    // recursion
    setTimeout(function(){
        proceed(domains);
    }, 25000);
}

(async () => {
    await init();
    try{
        fs.readFile(miner_list, 'utf8', (error, data) => {
          online_miners = data.split('\n').map(i=>i.trim());
        });
        fs.readFile(path, 'utf8', (error, data) => {
            proceed(data.trim().split('\n'));
        });
    }
    catch(e){
        console.log(e);
    }
})();

/***********************************************************
 *          Usage: node automation.js lists.txt            *
 ***********************************************************/
