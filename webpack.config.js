module.exports = {
    mode: 'production',
    context: __dirname,
    devtool: 'source-map',
    entry: './src/index.ts',
    output: {
        path: __dirname+'/public',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [ __dirname+'/src', 'node_modules' ]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'awesome-typescript-loader' }
        ]
    },
    optimization: {
        minimize: true
    },
};