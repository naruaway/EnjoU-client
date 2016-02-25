import gulp from 'gulp'
import browserify from 'browserify'
import babelify from 'babelify'
import source from 'vinyl-source-stream'
import Koa from 'koa'
import fs from 'fs'

gulp.task('js', function() {
  browserify('src/main.js', { debug: true })
    .transform(babelify)
    .bundle()
    .on('error', function (err) { console.log('Error : ' + err.message) })
    .pipe(source('script.js'))
    .pipe(gulp.dest('dest'))
})

gulp.task('css', function() {
  const postcss    = require('gulp-postcss')
  const sourcemaps = require('gulp-sourcemaps')
  return gulp.src('src/**/*.css')
    .pipe( sourcemaps.init() )
    .pipe( postcss([ require('autoprefixer'), require('precss') ]) )
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest('dest/') );
})

gulp.task('png', function() {
  gulp.src('src/images/*.png')
    .pipe(gulp.dest('dest/images'))
})

gulp.task('html', function() {
  gulp.src('src/*.html')
    .pipe(gulp.dest('dest'))
})

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['js'])
  gulp.watch('src/*.css', ['css'])
  gulp.watch('src/*.html', ['html'])
  gulp.watch('src/images/*.png', ['png'])
})

gulp.task('webserver', () => {
  const typeTable = {
    'css': 'text/css',
    'js': 'text/javascript',
    'html': 'text/html',
    'png': 'image/png',
  }


  const app = new Koa()
  app.use(async (ctx, next) => {
    await next();
    if (fs.existsSync(`dest/${ctx.url}`) && !`dest/${ctx.url}`.endsWith('/')) {
      if (typeTable[ctx.url.match(/\.(.+)/)[1]] === 'image/png') {
        ctx.body = fs.readFileSync(`dest/${ctx.url}`)
      } else {
        ctx.body = fs.readFileSync(`dest/${ctx.url}`, 'utf8')
      }
      ctx.set('Content-Type', typeTable[ctx.url.match(/\.(.+)/)[1]])
    } else {
      ctx.body = fs.readFileSync('dest/index.html', 'utf8')
    }
  })
  app.listen(8000)
})

gulp.task('default', ['js', 'css', 'html', 'png', 'watch', 'webserver'])
gulp.task('build', ['js', 'css', 'html', 'png'])
