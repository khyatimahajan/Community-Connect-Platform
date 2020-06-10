const path = require('path');


module.exports = {
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: "[name].min.js",
    },
    plugins: [],
    entry:{
        index:'./lib/index.js'
    },
    target:"web",
    module: {
        rules: [{
            test:/\.js?$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader'
        }]
    }
};