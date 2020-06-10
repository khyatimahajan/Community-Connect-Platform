# Console.log result in the browser

Browsers' console is so powerful and easy to debug compared to node command line. It can also work for Linux, to open on PC in the same LAN.

Besides, it can asynchonizely console.log data from Node.JS in browser base on Socket.IO.

So quickly use bonsole to see console.log results in browser!


## Install

```
npm i --save-dev bonsole
```

## Start

```JavaScript
const bonsole = require('bonsole');
bonsole({a:1});

setTimeout(()=>{
    bonsole({b:2})
}, 5000);
```

## Options

```JavaScript
bonsole(
    {a:1},              //something to console.log in browser
    9094,               //port, default is 9094
    {app: 'firefox'}    //options, set specified browser, like: {app: ['google chrome', '--incognito']}
);
```

The option is the same as [open](https://github.com/sindresorhus/open).

If you have issues or want to make some suggestions, welcome to contact me. It is so kind if you can give a star :star:! 
