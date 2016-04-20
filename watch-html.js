console.log(33);
var config = {
    "webapp" : "src/app/LivePublisher-web",
    "mock" : "src/test/LivePublisher-web",
    "build" : "build",
    "buildWebAppPath" : "/app/LivePublisher-web",
    "buildStaticPath" : "/static",
    "contextPath": "",
    "openurl" : "http://localhost:8080/index.html",
    "port": 8080,
    "hostname": "localhost",
    "entryJSPath" : "/js/module",
    "tmpDir" : ".tmp",
    "jsPath" : "/js",
    "cssPath" : "/style/css",
    "scssPath" : "/style/scss",
    "imgPath" : "/style/img",
    "htmlPath" : "/html",
    "flashPath" : "/resources",
    "ajaxPrefix" : "/xhr"
};
var appConfig = config;
// var path = require('path');
// console.log(appConfig.webapp + appConfig.htmlPath + '/index.html' );
// console.log(333445);
// var a = {name:'xqg'};
// console.log(path.join(appConfig.webapp, appConfig.htmlPath, 'index.html'));
var tmpStr = 'raw!./src/app/LivePublisher-web/html/index.html';
require('raw!./src/app/LivePublisher-web/html/index.html');// 这个引入只是让index.html可以被webpack watch 监听
