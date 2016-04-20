'use strict';
var path = require('path');
var fs = require('fs');
var extend = require('extend');//对象的复制
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');


var config = require('./shark-deploy-conf.json');
var appConfig = config;
var webappDir = appConfig.webapp;
var entryJSPath = appConfig.entryJSPath;
// console.log(entryJSPath,'asdf');
/**
 * 生成入口文件 以对象键值对的形式生成,会把当前目录下的目录及文件会被打包到 output配置项指定的path中
 * @param  {String} srcDir srcDir 为入口目录
 * @param  {} dir    [description]
 * @return {Object}  [description]
 */
function recursionDir(srcDir, dir) {
    // console.log("!!");
    if(!dir) {
        dir = '';
    }
    var matchs = [],
        files = {},
        jsPath = path.resolve(srcDir),
        dirs = fs.readdirSync(jsPath);
    dirs.forEach(function(item) {
        // console.log(item);
        matchs = item.match(/(.+)\.js$/);
        if(matchs) {
            // var arr = new Array(path.resolve(srcDir, item));
            // files[path.join(dir, matchs[1])] = new Array("webpack-dev-server/client?http://localhost:8080/", path.resolve(srcDir, item));
             files[path.join(dir, matchs[1])] = new Array("webpack-hot-middleware/client", path.resolve(srcDir, item));
            // console.log(files, '!!');
        }else {
            extend(true, files, recursionDir(srcDir+'/'+item, path.join(dir, item) ) );
        }
    })
    // console.log('111');
    console.log(files);
    return files;
}
function recursionDirHtml(srcDir, dir) {
    // console.log("!!");
    if(!dir) {
        dir = '';
    }
    var matchs = [],
        files = {},
        jsPath = path.resolve(srcDir),
        dirs = fs.readdirSync(jsPath);
    dirs.forEach(function(item) {
        // console.log(item);
        matchs = item.match(/(.+)\.html$/);
        if(matchs) {
            // var arr = new Array(path.resolve(srcDir, item));
            // files[path.join(dir, matchs[1])] = new Array("webpack-dev-server/client?http://localhost:8080/", path.resolve(srcDir, item));
             files[path.join(dir, matchs[1])] = path.resolve(srcDir, item);
            // console.log(files, '!!');
        }else {
            extend(true, files, recursionDirHtml(srcDir+'/'+item, path.join(dir, item) ) );
        }
    })
    // console.log('111');
    console.log(files);
    return files;
}
console.log(99);
module.exports = {
    //入口文件
    entry: extend(true, recursionDir(path.join(webappDir, entryJSPath))), //注意入口文件不允许被依赖  Error: a dependency to an entry point is not allowed
    output: {
        path: __dirname + '/build',
        publicPath: appConfig.buildStaticPath,
        filename: '[name].js'
    },
    resolve: {
        root: [],
        alias: {
            //path.resolve： 相当于 cd    | cd webappDir cd js/lib/jquery/jquery.min.js
            // 'jquery': path.resolve(webappDir, 'js/lib/jquery/jquery.min.js')// path.resolve 不能是path.join
        }
    },
    plugins: [
        new webpack.ProvidePlugin({ //将jquery全局化，不必在每个模块中require('jquery')
            // $: "jquery",
            // jQuery: "jquery",
            // "windows.jQuery": "jquery"
        }),
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: 'commons',
        //     filename:'commons.js',
        //     minChunks: function(module, count) {
        //         //引用测试大于某个次数,保持默认行为，如果你的模块特别多，适当提高
        //         if(count>=3){
        //             return true;
        //         }

        //         //符合某种格式，return ture
        //         var resourceName = module.resource;
        //         if(resourceName){
        //             resourceName = resourceName.substring(resourceName.lastIndexOf(path.sep)+1)
        //         }
        //         var reg = /^(\w)+.common/;
        //         if(reg.test(resourceName)){
        //             return true;
        //         }
        //         console.log('22');
        //         //不符合某种格式，return false;
        //         return false;
        //     }
        // }),
        // new webpack.HotModuleReplacementPlugin(),
         new HtmlWebpackPlugin({
            // filename: 'index.html',
            // template: path.resolve(__dirname, '../app/index/index.html'),
            inject: false
        })
    ],
    module: {
        loaders: [
            { test: /\.html$/, loader: "raw" }
        ]
    }
};

