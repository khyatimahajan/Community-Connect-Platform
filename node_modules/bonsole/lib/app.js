const open = require('open');
const ip = require('ip').address();
const server = require('./server');
const sm = new (require('./SocketManager'))(server);


module.exports = (content, port, option) => {
    if (Object.prototype.toString.call(port) !== "[object Number]"){
        option = port;
        port = 9094;
    }
    switch (sm.status) {
        case sm.statusList.notStart:
            sm.status = sm.statusList.inStart;
            sm.messageQueue.push(content);
            server.listen(port, ip, ()=>{
                (async ()=>{
                    await open(`http://${ip}:${port}`, option);
                    console.log(`console.log in http://${ip}:${port}`);
                })();
            });
            break;
        case sm.statusList.inStart:
            sm.messageQueue.push(content);
            break;
        case sm.statusList.started:
            sm.socket.emit('push', content);
            break;
        default:
            break;
    }
};