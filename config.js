module.exports = {
    resources: [     // resource types not needed to be requested
        'font',
        'image',
        'media',
        'stylesheet'
    ],
    tabs: 50,  // number of tabs
    timeout: 25000,  // timeout in ms
    log_file: 'error.log',  // error log
    output_file: 'culprits.txt',    // output file name,
    executablePath: '/usr/bin/google-chrome-stable',  // path to chrome executable
    list_browser: 'https://gitlab.com/ZeroDot1/CoinBlockerLists/raw/master/list_browser.txt'
}
