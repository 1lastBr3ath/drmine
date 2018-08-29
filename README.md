# Dr. Mine

*Dr. Mine* is a node script written to aid automatic detection of in-browser cryptojacking. The most accurate way to detect things that happen in a browser is via browser itself. Thus, Dr. Mine uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to automate browser thingy and catches any requests to online cryptominers. When a request to any online cryptominers is detected, it flags the corresponding URL and cryptominer being in use. Therefore, however the code is written or obfuscated, Dr. Mine will catch it (as long as the miners are in the list). The list of online cryptominers are fetched from [CoinBlockerLists](https://github.com/ZeroDot1/CoinBlockerLists). The result is also saved on file for later use.

- Can also process single URL passed directly via command line
- All links found on the first (requested) page are also processed, if same-origin
- All configurable options are stored in `config.js` allowing easier modifications
- To reduce extra bandwidth and processing, all requests to resources like `fonts`, `images`, `media`, `stylesheets` are aborted

Dr. Mine, now, uses [bluebird](https://github.com/petkaantonov/bluebird)- making it much faster and more efficient.

## Pre-requisites & Installation
The following 3 lines of commands should set everything up and running on Arch distros;
```
pacman -S nodejs npm
git clone https://github.com/1lastBr3ath/drmine.git && cd drmine
npm install
```

Please make sure your version of node is 7.6.0 or greater. For any installation assistance or instructions on specific distros, please refer to respective documents;    
https://nodejs.org/en/download/package-manager/    
https://docs.npmjs.com/getting-started/installing-node    
https://github.com/GoogleChrome/puppeteer#installation    

## Usage
Dr. Mine accepts either a URL or a file which is expected to contain valid URLs. Usage is as simple as;
```
node drmine.js list.txt
```
A sample list.txt looks like;
```
http://cm2.pw
http://cm2.pw/xmr/
https://example.com/
```
An example of passing URL directly via command line;
```
node drmine.js http://cm2.pw/xmr/
```

## Screenshot
![Screenshot](/drmine.png)

## Contribution
Dr. Mine can still be improved in a lot of ways. Any feedback and/or contributions are highly appreciated. 

### To-do
- Proper Error Handling
