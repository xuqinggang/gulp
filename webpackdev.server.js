var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config.js');
// var proxy = require('proxy-middleware');
// var url = require('url');

module.exports = function(app) {
  // 使用8081端口
  // app.use('/assets', proxy(url.parse('http://localhost:8081/assets')));

  var server = new WebpackDevServer(webpack(config), {
    contentBase: __dirname,
    // hot: true,
    quiet: true,
    noInfo: false,
    publicPath: '/assets/',
    stats: { colors: true }
  }).listen(8081, 'localhost', function() {
    console.log('socketio listen 8081')
  });
}