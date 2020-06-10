const socket = require('socket.io-client').connect(window.location.origin, {
    timeout:2000,
    reconnection:false
});

socket.emit('ready');

socket.on('first-push', (data)=>{
    data.forEach(item=>{
        console.log(item);
    })
});
socket.on('push', (data)=>{
    console.log(data);
});