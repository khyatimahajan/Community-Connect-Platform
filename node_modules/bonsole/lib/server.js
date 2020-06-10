const fs = require('fs');
const path = require('path');


module.exports = require('http').createServer((req, res)=>{
    let html = `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>bonsole</title>
                        <script src="../build/index.min.js"></script>
                    </head>
                    <body>
                    </body>
                </html>`;
    if (req.url.endsWith('.js')){
        fs.readFile(path.resolve(__dirname, '../build/index.min.js'), (err, data)=>{
            if (err){
                throw new Error(err.toString());
            } else {
                res.writeHead(200, {"Content-Type":"application/javascript"});
                res.end(data);
            }
        })
    } else {
        res.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
        res.end(html);
    }
});