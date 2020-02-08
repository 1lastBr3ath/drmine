#!/usr/bin/env node

const fs = require('fs');
const { URL } = require('url');
const Promise = require('bluebird');
const puppeteer = require('puppeteer-core');


let browser;
let online_miners;

const scanned_hosts = [];
const culprit_hosts = [];
const path = process.argv[2];
const config = require('./config.js');

async function init(){
  browser = await puppeteer.launch({
    //headless: false,
    ignoreHTTPSErrors: true,
    executablePath: config.executablePath,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      '--dns-prefetch-disable',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--allow-running-insecure-content',
      '--enable-features=NetworkService',
    ],
  }).catch(e => console.error('Error!', e.message));
}

async function responseInfo(url){
    // remove hosts already found mining
    if(culprit_hosts.includes(new URL(url).host))
        return;
    let page;
    try {
        page = await browser.newPage();
        page.setRequestInterception(true);
        page.on('request', req => intercept(req, url));
        await page.goto(url, {timeout: config.timeout});
        const host = new URL(page.url()).host;
        await page._client.send('Page.setDownloadBehavior', {behavior: 'deny'});
        if(!scanned_hosts.includes(host)){  // scan only if not already scanned
            scanned_hosts.push(host);
            const hrefs = await page.$$eval('a[href]',
                    anchors => anchors.map(a=>a.href));
            checkLinks(host, hrefs);
        }
    }
    catch(e) {
        if(!/ERR_NAME_NOT_RESOLVED|Target closed|not opened/.test(e.message)){
            console.info('Trying to reload', url);
            await page.reload({timeout: config.timeout});
        }
        else
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
        if(detectMiner(request, url))
            return request.abort();
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
    let flag = false;
    // ignore results of redirect - TODO
    const reqURL = new URL(request.url());
    if(online_miners.includes(reqURL.host)){
        flag = true;
        culprit_hosts.push(new URL(url).host);
        console.info(`${url} => ${reqURL.href}`);
        writeFile(config.output_file, {url: url, msg: ` => Found using ${reqURL}`});
    }
    return flag;
}

function writeFile(fileName, data, flag='a'){   // data expected to be an object with attrs url and msg
    fs.writeFile(fileName, `${data.url} ${data.msg}\n`, {flag: flag}, (err) => {
        if(err) console.error(err)
    });
}

function log(url, msg){
    writeFile(config.log_file, {url: url, msg: msg});
}

async function proceed(urls){
    if(!urls.length) return;
    try{
        await Promise.map(
            urls,
            async (url, index, length) => {
                try{
                    await responseInfo(url);
                }
                catch(e){
                    console.info('[!] Number of URLs processed:', index);
                }
            },
            {concurrency: config.tabs}
        );
    }
    catch(e){
        console.error('Error!', e.message);
    }
    finally {
        //await browser.close();
        console.info('[!] Time:', Date());
        console.info("[-] Terminate (CTRL+C) if idle for over a minute");
    }
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
