$(document).ready(function () {
    connections = connections.split("&#34;").join('"')
    connections = JSON.parse(connections);
    connections = connections.map(connection => {
        return connection.username;
    });

    $('.input-type-dec, .input-type-dec1').atwho({
        at: "@",
        data: connections
    })
})