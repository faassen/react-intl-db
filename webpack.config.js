var path = require('path');

module.exports = {
    entry: './src/main.jsx',
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [

            { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader?stage=0'},
            { test: /\.css$/, loader: "style-loader!css-loader" },
            // inline base64 URLs for <=8k images, direct URLs for the rest
            {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
            // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
            // loads bootstrap's css.
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.woff2$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=image/svg+xml" }
        ]
    },
    externals: {
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
};
