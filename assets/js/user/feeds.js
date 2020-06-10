$(document).ready(function () {
    connections = connections.split("&#34;").join('"')
    connections = JSON.parse(connections);
    connections = connections.filter(conn => conn.username ? true : false);
    connections = connections.map(connection => {
        return connection.username;
    });

    $('.input-type-dec, .input-type-dec1').atwho({
        at: "@",
        data: connections
    })
})