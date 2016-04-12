'use strict';

var gulp = require('gulp'),
    os = require('os'),
    exec = require('sync-exec'); //执行cmd 命令
// var uglify = require('gulp-uglify');
// var concat = require('gulp-concat');
var path = require('path'),
    shrink = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');

var useref = require('gulp-useref');
var runSequence = require('run-sequence'); // Run a series of dependent gulp tasks in order
var ngAnnotate = require('gulp-ng-annotate'); // 解决angular的依赖注入问题 防止压缩产生问题
var uglify = require('gulp-uglify');
var fs = require('fs');
var minifyCss = require('gulp-minify-css');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');
// 静态文件打包合并
var webpack = require('webpack-stream');
var webpackConfig = require('./webpack.config');
// var rev = require('gulp-rev');
// var revCollector = require('gulp-rev-collector');
// var runSequence = require('run-sequence');

// var config = require('./webpack.config');
// var qiniu = {
//     accessKey: '6sBCo463jJOCnBIYX__uy9avZ7C2hj_MHb-ffKAr',
//     secretKey: '3vPk7fB0HcwL5V9E2AErHuR19HM389eYqdvQcncL',
//     bucket: 'xdemo',
//     domain: 'http://7xik9a.com1.z0.glb.clouddn.com'
// };

var config = require('./shark-deploy-conf.json');
var appConfig = config;
var cssPath = appConfig.cssPath;
var imgPath = appConfig.imgPath;
var jsPath = appConfig.jsPath;
var flashPath = appConfig.flashPath;
var templatePath = appConfig.templatePath;
var htmlPath = appConfig.htmlPath;
var ajaxPath = appConfig.ajaxPrefix;
var scssPath = appConfig.scssPath;

var webappDir = appConfig.webapp; // src/LivePublisher-web
var mockDir = appConfig.mock; // src/mock
var entryJSPath = appConfig.entryJs;

var tmp1 = path.join(appConfig.tmpDir, 'step1');
var tmp2 = path.join(appConfig.tmpDir, 'step2');

var express = require('express');
var openurl = require('openurl');
// var livereload = require('gulp-livereload');
var body = require('body-parser');
var tinylr = require('tiny-lr');// Tiny LiveReload server, background-friendly


var buildDir = appConfig.build;
var buildWebappDir = path.join(buildDir, appConfig.buildWebAppPath);
var buildStaticDir = path.join(buildDir, appConfig.buildStaticPath);
/***------------- imagemin start ---------------***/
gulp.task('imagemin', function() {
    return gulp.src(path.join(webappDir, '**/*.{jpg,jpeg,gif,png}')) //会把webappDir目录下的 目录及文件cp,min 到.tmp/step1 对应的目录
        .pipe(imagemin({
            // jpg
            progressive: true,
            // for png
            use: [pngquant({
                quality: 90
            })]
        }))
        .pipe(gulp.dest(tmp1));
});


/***------------- webpack to build start ---------------***/
gulp.task('webpack', function() {//webpack 打包 /js/module目录下的js文件
    return gulp.src(path.join(webappDir, '**/*.js'))
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(path.join(tmp1, entryJSPath) ) );
});

/***------------- copy to build start ---------------***/
gulp.task('copy-build-js', function() {
    return gulp.src(path.join(tmp2, jsPath, '**')).pipe(gulp.dest(path.join(buildStaticDir, appConfig.staticVersion, jsPath)));
});

function execCmd(cmds, processOpts) {
    if (os.platform() === 'win32') {
        // windows
        var opts = ["cmd", "/c"];
    } else {
        // mac linux
        var opts = [];
    }
    opts = opts.concat(cmds);
    var msg = exec(opts.join(' '), 60000, processOpts);
    console.log(msg.stderr || msg.stdout);
    if (msg.status !== 0) {
        throw new Error('Exec cmd: [' + opts.join(' ') + ']');
    }
}

// /***------------- imagemin end ---------------***/

// gulp.task('js', function() {
//     gulp.src('./js')
//         .pipe(webpack(config))
//         .pipe(gulp.dest('./build'));
// });

// gulp.task('css', function() {
//     gulp.src(['./css/main.css', './css/view.css'])
//         .pipe(concat('app.css'))
//         .pipe(gulp.dest('./build'));
// });
// gulp.task('publish-js', function() {
//     return gulp.src(['./js'])
//         .pipe(webpack(config))
//         .pipe(uglify())
//         .pipe(rev())
//         .pipe(gulp.dest('./build'))
//         .pipe(qn({
//             qiniu: qiniu,
//             prefix: 'gmap'
//         }))
//         .pipe(rev.manifest())
//         .pipe(gulp.dest('./build/rev/js'));
// });
// gulp.task('publish-css', function() {
//     return gulp.src(['./css/main.css', './css/view.css'])
//         .pipe(concat('app.css'))
//         .pipe(shrink())
//         .pipe(rev())
//         .pipe(gulp.dest('./build'))
//         .pipe(qn({
//             qiniu: qiniu,
//             prefix: 'gmap'
//         }))
//         .pipe(rev.manifest())
//         .pipe(gulp.dest('./build/rev/css'));
// });
// gulp.task('watch', function() {
//     gulp.watch('./css/*.css', ['css']);
//     gulp.watch('./js/*.js', ['js']);
// });
// gulp.task('publish-html', function() {
//     return gulp.src(['./build/rev/**/*.json', './index.html'])
//         .pipe(revCollector({
//             dirReplacements: {
//                 'build/': ''
//             }
//         }))
//         .pipe(gulp.dest('./dist/'));
// });

// gulp.task('publish', function(callback) {
//     runSequence(
//         ['publish-css', 'publish-js'],
//         'publish-html',
//         callback);
// });
// 
// 
gulp.task('clean', function() {
    return gulp.src([tmp1, tmp2, buildWebappDir, path.join(buildStaticDir, appConfig.staticVersion)], {
            read: false // options.read Setting this to false will return file.contents as null and not read the file at all.
        })
        .pipe(clean());
});

gulp.task('compass', function(cb) {
    execCmd(['compass', 'clean']);
    execCmd(['compass', 'compile']);
    cb();
});

gulp.task('useref', ['useref-ftl', 'useref-html', 'useref-flash']);//, 'useref-files'

gulp.task('useref-ftl', function() {
    return gulp.src(path.join(webappDir, '**/*.ftl'))
        .pipe(useref({
            searchPath: webappDir
        }))
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif(uglifyJs, uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest(tmp1));
});

gulp.task('useref-html', function() {
    return gulp.src(path.join(webappDir, '**/*.{html,htm}'))
        .pipe(useref({
            searchPath: webappDir
        }))
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif(uglifyJs, uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest(tmp1));
});

gulp.task('useref-flash', function() {
    return gulp.src(path.join(webappDir, '**/*.swf'))
        .pipe(gulp.dest(tmp1));
});

/***------------- build start ---------------***/

gulp.task('build', function(cb) {
    runSequence(
        // clean folders
        'clean',
        // build the java
        // 'build-java',
        // compass and copy to tmp1
        'compass',
        // use reference in html and ftl
        'useref',
        // spm
        'spm3',
        // imagemin and copy to tmp1
        'imagemin',
        // revision images
        'revision-image',
        'revision-flash',
        // revreplace images
        ['revreplace-css', 'revreplace-js'],
        // revision css,js
        ['revision-css', 'revision-js'],
        // revreplace html,ftl
        ['revreplace-html', 'revreplace-ftl'],
        // copy to build dir, copy java
        // ['copy-build', 'copy-build-java'],
        'copy-build',
        'ftlConfig',
        // callback
        cb
    );
});

/**
 * 开发时使用的server
 */
gulp.task('serve', function() {
    var app = express();

    //ajax
    app.use(ajaxPath, headerStatic(path.join(mockDir, ajaxPath), {
        'Content-Type': 'application/json'
    }));

    //js
    app.use(jsPath, headerStatic(path.join(webappDir, jsPath), {}));
    // css
    app.use(cssPath, headerStatic(path.join(webappDir, cssPath), {}));
    // images
    app.use(imgPath, headerStatic(path.join(webappDir, imgPath), {}));

    // html
    app.use(appConfig.contextPath, headerStatic(path.join(webappDir, htmlPath), {}));
    // flash
    app.use(flashPath, headerStatic(path.join(webappDir, flashPath), {}));

    // livereload middleware
    app.use(body()).use(tinylr.middleware({
        app: app
    }));
    app.listen(appConfig.port, function(err) {
        if(err) {
            return console.log(err);
        }
        if(appConfig.openurl) {
            openurl.open(appConfig.openurl);
        }
        console.log('listening on %d', appConfig.port);
    });
    gulp.watch(path.join(webappDir, scssPath, '**/*.scss'), function(event) {
        execCmd(['compass', 'compile']);
        tinylr.changed('a.css');
    });
    execCmd(['compass', 'compile']);
    function watchFiles(ext) {
        // console.log('asdf');
        // watch
        gulp.watch(path.join(webappDir, '**/*.' + ext), function(event) {
            tinylr.changed(event.path); // send changes to the livereload server
            // jshint
            // if(ext === 'js') {
            //     //gulp.src(event.path).pipe(jshint()).pipe(jshint.reporter('default'));
            // }
        });
    }
    watchFiles('js');
    watchFiles('html');
    watchFiles('ftl');

});

function headerStatic(staticPath, headers) {
    return function(req, res, next) {
        var reqPath = req.path,
            reqFullPath = path.join(staticPath, reqPath);
        if(fs.existsSync(reqFullPath)) {
            //设置配置的响应头
            for(var h in headers) {
                res.set(h, headers[h]);
            }

            if(/\.html$/.test(reqPath)) {
                res.set('Content-Type', 'text/html');
                res.send(injectHtml(fs.readFileSync(reqFullPath, 'UTF-8')));
            }else {
                if(/\.js$/.test(reqPath)) {
                    res.set('Content-Type', 'text/javascript');
                }else if(/\.css$/.test(reqPath)) {
                    res.set('Content-Type', 'text/css');
                }
                res.send(fs.readFileSync(reqFullPath, 'UTF-8'))
            }
        }else {
            if (reqPath !== '/livereload.js') {
                // console.warn('Not Found: ' + f);
            }
            next();
        }
    }
}
/**
 * 插入livereload.js到html中
 * @param  {string} html 需要处理的内容
 * @return {string}    处理后的结果
 */
function injectHtml(html) {
    var index = html.lastIndexOf('</body>');
    if(index !== -1) {
        var injectScript = '\n<script>document.write(\'<script src="http://\' + (location.host || \'localhost\').split(\':\')[0] + \':' + appConfig.port + '/livereload.js?snipver=1"></\' + \'script>\')</script>\n';
        return html.substr(0, index) + injectScript + html.substr(index);
    }else {
        return html;
    }
}
