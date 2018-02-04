# Dr. Mine

*Dr. Mine* is a node script written to aid automatic detection of in-browser cryptojacking. The most accurate way to detect things that happen in a browser is via browser itself. Thus, Dr. Mine uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to automate browser thingy and catches any requests to online cryptominers. The list of online cryptominers are fetched from [CoinBlockerLists](https://github.com/ZeroDot1/CoinBlockerLists). When a request to any online cryptominers is detected, it flags the corresponding URL and cryptominer being in use. The result is also saved on file for later use. To reduce extra bandwidth and processing, all requests to resources like `fonts`, `images`, `media`, `stylesheets` are aborted.

## Pre-requisites & Installation
The following 3 lines of commands should set everything up and running on Arch distros;
```
pacman -S nodejs npm
npm i --save puppeteer
```

Please make sure your version of node is 7.6.0 or greater. For any installation assistance, please refer to respective documents;    
https://nodejs.org/en/download/package-manager/    
https://docs.npmjs.com/getting-started/installing-node    
https://github.com/GoogleChrome/puppeteer#installation    

## Usage
Dr. Mine accepts a file which is expected to contain valid URLs. Usage is as simple as;
```
node drmine.js list.txt
```
A sample list.txt looks like;
```
http://cm2.pw
http://cm2.pw/xmr/
https://example.com/
```

## Contribution
Dr. Mine can still be improved in a lot of ways. Any feedback and/or contributions are highly appreciated. 

### To-do
- Fetch online_miners directly from GitHub
- Check all links found on the page, if same-origin
- Allow scan of single URL directly via command line
