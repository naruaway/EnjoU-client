import gulp from 'gulp'
import browserify from 'browserify'
import babelify from 'babelify'
import source from 'vinyl-source-stream'
import webserver from 'gulp-webserver'

gulp.task('js', function() {
  browserify('src/main.js', { debug: true })
    .transform(babelify)
    .bundle()
    .on('error', function (err) { console.log('Error : ' + err.message) })
    .pipe(source('script.js'))
    .pipe(gulp.dest('dest'))
})

gulp.task('css', function() {
  gulp.src('src/*.css')
    .pipe(gulp.dest('dest'))
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

gulp.task('webserver', function() {
  gulp.src('dest')
    .pipe(webserver({
      host: 'localhost',
      livereload: true,
    })
  )
})

gulp.task('default', ['js', 'css', 'html', 'png', 'watch', 'webserver'])
