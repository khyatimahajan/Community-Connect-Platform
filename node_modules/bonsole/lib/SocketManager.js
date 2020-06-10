module.exports = class SocketManager{
    constructor(server){
        this.statusList = {
            notStart:Symbol('notStart'),
            inStart:Symbol('inStart'),
            started:Symbol('started')
        };
        this.status = this.statusList.notStart;
        this.messageQueue = [];
        require('socket.io')(server).on('connection', (_socket)=>{
            this.socket = _socket;
            this.socket.on('ready', ()=>{
                this.socket.emit('first-push',this.messageQueue);
                this.status = this.statusList.started;
            });
        });
    }
};