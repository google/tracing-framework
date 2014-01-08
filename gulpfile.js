/**
 * Copyright 2014 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview gulpjs build file.
 * https://github.com/gulpjs/gulp
 *
 * @author benvanik@google.com (Ben Vanik)
 */

var gulp = require('gulp');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var path = require('path');


var JS_COMPILER_JAR = 'third_party/closure-compiler/compiler.jar'
var SOY_COMPILER_JAR = 'third_party/closure-templates/SoyToJsSrcCompiler.jar';
var GSS_COMPILER_JAR = 'third_party/closure-stylesheets/closure-stylesheets.jar';


function defineTraceVariant(name, options) {
  // compiled:
  // - closure w/ all closure + third party js + src js

  // web:
  // - closure w/:
  //   - third party/closure/etc
  //   - src
  //   - soy w/:
  //     - ui soy
  //     - hud soy

  if (options.rootLess) {
    gulp.task('trace_' + name + '_styles', function() {
      gulp.src(options.rootLess)
        .pipe(less({
          paths: ['./src/']
        }))
        .pipe(gss({
          compiler: GSS_COMPILER_JAR,
          mode: 'COMPILED',
          flags: [
            '--css-renaming-prefix', 'wtf_',
            '--no-eliminate-dead-styles',
            '--allow-unrecognized-functions'
          ]
        }))
        .pipe(gulp.dest('./build/wtf_trace_' + name + '_styles.css'));
  }

  // if (options.templates) {
  //   gulp.src(options.templates)
  //     .pipe(soy({
  //       compiler: SOY_COMPILER_JAR
  //     }))
  //     .pipe(gulp.dest('./build/'));
  // }

  //
};

defineTraceVariant('min', {

});
defineTraceVariant('web', {
  rootLess: ['src/wtf/hud/hud.less'],
  templates: ['src/wtf/ui/**/*.soy', 'src/wtf/hud/**/*.soy']
});
defineTraceVariant('node', {

});
// closure_soy_library(
//     name='wtf_ui_soy_js',
//     srcs=glob('src/wtf/ui/**/*.soy'),
//     compiler_jar=SOY_COMPILER_JAR)
// closure_soy_library(
//     name='wtf_hud_soy_js',
//     srcs=glob('src/wtf/hud/**/*.soy'),
//     deps=':wtf_ui_soy_js',
//     compiler_jar=SOY_COMPILER_JAR)
// closure_soy_library(
//     name='wtf_app_soy_js',
//     srcs=glob('src/wtf/app/**/*.soy'),
//     deps=':wtf_ui_soy_js',
//     compiler_jar=SOY_COMPILER_JAR)
// closure_soy_library(
//     name='wtf_replay_soy_js',
//     srcs=glob('src/wtf/replay/**/*.soy'),
//     deps=':wtf_ui_soy_js',
//     compiler_jar=SOY_COMPILER_JAR)



gulp.task('default', function() {
});
