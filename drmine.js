const fs = require('fs');
const { URL } = require('url');
const puppeteer = require('puppeteer');


let browser;
let online_miners;

const scanned_hosts = [];
const culprit_hosts = [];
const path = process.argv[2];
const config = require('./config.js');

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
        await page.goto(url, {timeout: config.timeout});
        const host = new URL(page.url()).host;
        const hrefs = await page.$$eval('a[href]', anchors => anchors.map(a=>a.href));
        if(!scanned_hosts.includes(host)){  // scan only if not already scanned
            scanned_hosts.push(host);
            checkLinks(host, hrefs);
        }
    }
    catch(e) {
        log(url, e.message);
    }
    finally {
        await page.close();
    }
}

function intercept(request, url){
    // abort request to unneccessary resources
    if(config.resources.includes(request.resourceType())){
        return request.abort();
    }
    else if('script' === request.resourceType()){
        detectMiner(request, url);
    }
    request.continue();
}

async function getMiners(){
    let page;
    try{
        page = await browser.newPage();
        await page.goto(config.list_browser, {timeout: config.timeout});
        online_miners = await page.evaluate(()=>document.body.innerText);
        if(!online_miners){
            throw "Something went wrong, online_miners seems emtpy :(";
        }
        online_miners = online_miners.trim().split('\n').map(i => i.trim());
    }
    catch(e){
        console.error(e.message);
    }
    finally {
        await page.close();
    }
}

function checkLinks(host, hrefs){
  if(!hrefs) return;
  const links = hrefs.filter((value, index, self) => {
            // filter unique and same-origin hosts
            return self.indexOf(value) == index && host === new URL(value).host
        });
  proceed(links);
}

function detectMiner(request, url){
    // ignore results of redirect - TODO
    const script_url = new URL(request.url());
    if(online_miners.includes(script_url.host)){
        culprit_hosts.push(new URL(url).host);
        console.info(`Test against =>  ${url}`);
        console.info(`Detected miner: ${request.url()}`);
        writeFile(config.output_file, {url: url, msg: ` => Found using ${request.url()}`});
    }
}

function writeFile(fileName, data, flag='a'){   // data expected to be an object with attrs url and msg
    fs.writeFile(fileName, `${data.url} ${data.msg}\n`, {flag: flag}, (err) => {
        if(err) console.log(err)
    });
}

function log(url, msg){
    writeFile(config.log_file, {url: url, msg: msg});
}

async function proceed(domains){
    let tabs;
    try{
        tabs = await browser.targets();
    }
    catch(e){
        // do nothing
    }

    if(tabs.length < config.tabs){
        // remove domains already found mining
        culprit_hosts.forEach(culprit => {
            const pattern = new RegExp(`^https?:\\\/\\\/${culprit.replace('.', '\\\.')}`, 'iu');
            domains = domains.filter(domain=>!pattern.test(domain.trim()));
        });
        if(!domains.length) return;
        const top50 = domains.splice(0, config.tabs);
        console.info('Length: ', domains.length, tabs.length);

        top50.forEach(async domain => {
            try{
                await responseInfo(domain.trim());
            }
            catch(e){
                // do nothing
            }
        });
    }
    // recursion
    setTimeout(()=>proceed(domains), config.timeout);
}

(async () => {
    await init();
    await getMiners();
    
    if(/^https?:\/\//i.test(path)){
        return proceed([path]);
    }
    
    try{
        fs.readFile(path, 'utf8', (error, data) => {
            proceed(data.trim().split('\n'));
        });
    }
    catch(e){
        console.error(e.message);
    }
})();

/***********************************************************
 *          Usage: node automation.js lists.txt            *
 ***********************************************************/
