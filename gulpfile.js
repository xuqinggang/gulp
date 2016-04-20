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

var useref = require('gulp-useref');//Parse build blocks in HTML files to replace references to non-optimized scripts or stylesheets.
var runSequence = require('run-sequence'); // Run a series of dependent gulp tasks in order
var ngAnnotate = require('gulp-ng-annotate'); // 解决angular的依赖注入问题 防止压缩产生问题
var uglify = require('gulp-uglify');
var fs = require('fs');
var minifyCss = require('gulp-minify-css');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');
var rev = require('gulp-rev');//Static asset revisioning by appending content hash to filenames: unicorn.css → unicorn-d41d8cd98f.css
var revReplace = require("gulp-rev-replace");
// 静态文件打包合并
var webpackStream = require('webpack-stream');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
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
var entryJSPath = appConfig.entryJSPath;

var tmp1 = path.join(appConfig.tmpDir, 'step1');
var tmp2 = path.join(appConfig.tmpDir, 'step2');

var express = require('express');
var openurl = require('openurl');
var livereload = require('gulp-livereload');
var body = require('body-parser');
var tinylr = require('tiny-lr');// Tiny LiveReload server, background-friendly


var buildDir = appConfig.build;
var buildWebappDir = path.join(buildDir, appConfig.buildWebAppPath);
var buildStaticDir = path.join(buildDir, appConfig.buildStaticPath);


/*注意src 和dest 文件的对应关系*/ //会把**/*.{} 对应的目录及文件cp到dest
//gulp.src('client/js/**/*.js) // Matches 'client/js/somedir/somefile.js' and resolves base to client/js/
//    .pipe(minify())
//    .pipe(gulp.dest('build'));  // Writes 'build/somedir/somefile.js'
// gulp.src() 返回Vinyl files类型的流用于gulp插件进行进一步处理。什么是Vinyl files，说白了Vinyl就是一种虚拟文件格式，它能很方便的匹配文件然后读取出来（以stream或者buffer的格式），为每个文件标注path，content属性，有利于gulp向文件流pipe plugin。

/***------------- webpack to build start ---------------***/

gulp.task('webpack', function() {//webpack 打包 /js/module目录下的js文件
    console.log(11234);
     return gulp.src(path.join(webappDir, '**/*.js'))
            .pipe(webpackStream(webpackConfig))
            .pipe(gulp.dest(path.join(tmp1, entryJSPath) ) );
    //     console.log(11234);
});

/***------------- webpack to build end ---------------***/

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

/***------------- useref start ---------------***/
gulp.task('useref', ['useref-ftl', 'useref-html', 'useref-flash']);//, 'useref-files' 将src目录下的文件 根据注释 进行相应的合并/压缩后，并来替换成注释中的引用

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
    return gulp.src(path.join(webappDir, '**/*.{html,htm}')) // 也会将html代码从src cp dest
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
var uglifyJs = function(file) {
    if (/\-min.js$/.test(file.path)) {
        return false;
    } else if (/.js$/.test(file.path)) {
        return true;
    }
    return false;
};
/***------------- useref end ---------------***/

/***------------- imagemin start ---------------***/
gulp.task('imagemin', function() {
    return gulp.src(path.join(webappDir, '**/*.{jpg,jpeg,gif,png}')) //会把**/*.{} 对应的目录及文件cp到dest
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
/***------------- imagemin end ---------------***/

/***------------- revision start ---------------***/ // 重命名版本

gulp.task("revision-image", function() { 
    return gulp.src([path.join(webappDir, "**/*.{jpg,jpeg,gif,png}")])
        .pipe(rev())//将src下的图片重命名 输出到tmp2目录中
        .pipe(gulp.dest(tmp2))
        .pipe(rev.manifest('image-rev-manifest.json')) //生成此.json文件 并输入到tmp2目录中
        .pipe(gulp.dest(tmp2));
});

gulp.task("revision-js", function() {
    return gulp.src([path.join(tmp1, "**/*.js")])
        .pipe(rev())
        .pipe(gulp.dest(tmp2))
        .pipe(rev.manifest('js-rev-manifest.json'))
        .pipe(gulp.dest(tmp2));
});

gulp.task("revision-css", function() {
    return gulp.src([path.join(tmp1, "**/*.css")])
        .pipe(rev())
        .pipe(gulp.dest(tmp2))
        .pipe(rev.manifest('style-rev-manifest.json'))
        .pipe(gulp.dest(tmp2));
});

gulp.task("revision-flash", function() {
    return gulp.src([path.join(tmp1, "**/*.swf")])
        .pipe(rev())
        .pipe(gulp.dest(tmp2))
        .pipe(rev.manifest('flash-rev-manifest.json'))
        .pipe(gulp.dest(tmp2));
});
/***------------- revision end ---------------***/

/***------------- revreplace start ---------------***/

gulp.task("revreplace-html", function() { //根据 .json文件中的原文件和新文件的键值对形式的对应关系来代替gulp.src()文件中的 路径引用
    var manifest = gulp.src([
        path.join(tmp2, '/style-rev-manifest.json'),
        path.join(tmp2, '/js-rev-manifest.json'),
        path.join(tmp2, '/image-rev-manifest.json'),
        path.join(tmp2, '/flash-rev-manifest.json')
    ]);

    return gulp.src(path.join(tmp1, "**/*.{html,htm}"))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.html'], //Only substitute in new filenames in files of these types.
            //prefix: getMimgUrlPrefix()
        }))
        .pipe(gulp.dest(tmp2));
});

gulp.task("revreplace-ftl", function() {
    var manifest = gulp.src([
        path.join(tmp2, 'style-rev-manifest.json'),
        path.join(tmp2, '/js-rev-manifest.json'),
        path.join(tmp2, '/image-rev-manifest.json'),
        path.join(tmp2, '/flash-rev-manifest.json')
    ]);

    return gulp.src(path.join(tmp1, "**/*.ftl"))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.ftl'],
            prefix: getMimgUrlPrefix()
        }))
        .pipe(gulp.dest(tmp2));
});

gulp.task("revreplace-css", function() {
    var manifest = gulp.src([
        path.join(tmp2, '/image-rev-manifest.json')
    ]);

    return gulp.src(path.join(tmp1, "**/*.css"))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.css'],
            prefix: getMimgUrlPrefix()
        }))
        .pipe(gulp.dest(tmp1));
});

gulp.task("revreplace-js", function() {
    var manifest = gulp.src([
        path.join(tmp2, '/image-rev-manifest.json'),
        path.join(tmp2, '/flash-rev-manifest.json')
    ]);

    return gulp.src(path.join(tmp1, "**/*.js"))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.js'],
            prefix: getMimgUrlPrefix()
        }))
        .pipe(gulp.dest(tmp1));
});

/***------------- revreplace end ---------------***/

gulp.task('test', function(cb) {
    runSequence(
        'webpack',
        'revision-js',
        'revreplace-html'
        )
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
        //'spm3',
        'webpack',
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
        //'copy-build',
        //'ftlConfig',
        // callback
        cb
    );
});

gulp.task("webpack-dev-server", function(callback) {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    // myConfig.devtool = "eval";
    // myConfig.debug = true;

    // Start a webpack-dev-server
    new WebpackDevServer(webpack(webpackConfig), {
        publicPath: myConfig.output.publicPath,
        stats: {
            colors: true
        }
    }).listen(8080, "localhost", function(err) {

        // if(err) throw new gutil.PluginError("webpack-dev-server", err);
        // gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
    });
});
/**
 * 开发时使用的server
 */
gulp.task('serve', function() {
    var app = express();
    // livereload.listen();
    // require('./webpackdev.server')(app);
    console.log(webpackConfig.output.publicPath);
    var compiler = webpack(webpackConfig);
    // new WebpackDevServer
    // devMiddleware  = require('webpack-dev-middleware')
    // 使用 webpack-dev-middleware 中间件
    var devMiddleware = require('webpack-dev-middleware')(compiler, {
        contentBase: __dirname,
        // hot: true,
        quiet: true,
        noInfo: false,
        publicPath: webpackConfig.output.publicPath,
        stats: { colors: true }
    });
    // 注册中间件
    app.use(devMiddleware);

    // 使用 webpack-hot-middleware 中间件
    var hotMiddleware = require('webpack-hot-middleware')(compiler);
    // 注册中间件
    app.use(hotMiddleware);
    //ajax
    app.use(ajaxPath, headerStatic(path.join(mockDir, ajaxPath), {
        'Content-Type': 'application/json'
    }));
    console.log(333);
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
    // app.use(body());
    // app.use(tinylr.middleware({
    //     // app: appTmp
    // }));;
    app.listen(8080, 'localhost', function() {
        if(appConfig.openurl) {
            openurl.open(appConfig.openurl);
        }
        console.log('socketio listen 8080')
    });

    // app.listen(appConfig.port, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    //     if(appConfig.openurl) {
    //         openurl.open(appConfig.openurl);
    //     }
    //     console.log('listening on %d', appConfig.port);
    // });

     
    gulp.watch(path.join(webappDir, scssPath, '**/*.scss'), function(event) {
        execCmd(['compass', 'compile']);
        console.log('444');
        // tinylr.changed('a.css');
        // livereload.changed();
    });
    execCmd(['compass', 'compile']);
    // function watchFiles(ext) {
    //     // console.log('asdf');
    //     // watch
    //     gulp.watch(path.join(webappDir, '**/*.' + ext), function(event) {
    //         // livereload.changed();
    //         tinylr.changed(event.path); // send changes to the livereload server
    //         // jshint
    //         // if(ext === 'js') {
    //         //     //gulp.src(event.path).pipe(jshint()).pipe(jshint.reporter('default'));
    //         // }
    //     });
    // }
    // watchFiles('js');
    // watchFiles('html');
    // watchFiles('ftl');

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
        var injectScript = '\n<script>document.write(\'<script src="http://\' + (location.host || \'localhost\').split(\':\')[0] + \':' + appConfig.port + '/webpack-dev-server.js"></\' + \'script>\')</script>\n';
        return html.substr(0, index) + injectScript + html.substr(index);
    }else {
        return html;
    }
}
