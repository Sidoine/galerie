const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const path = require("path");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.[contenthash].js",
        path: path.resolve(__dirname, "/public"),
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                loader: require.resolve("ts-loader"),
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: require.resolve("source-map-loader"),
            },

            {
                test: /\.(woff|woff2|ttf|eot|svg|gif|png|jpg)(\?.*)?$/,
                loader: require.resolve("file-loader"),
                options: { name: "files/[name].[hash].[ext]" },
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        compress: true,
        port: 9000,
        hot: true,
        historyApiFallback: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Galerie photo",
            publicPath: "/",
            filename: "index.html",
            favicon: "public/favicon.ico",
            base: "/",
        }),
        new ForkTsCheckerWebpackPlugin(),
    ],
    watchOptions: {
        ignored: /node_modules/,
    },
};
