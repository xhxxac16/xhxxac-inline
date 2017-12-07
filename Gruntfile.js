/*
 * grunt-xhxxac-inline
 * https://github.com/xhxxac16/study2017
 *
 * Copyright (c) 2017 Amanda
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    xhxxac_inline: {
      dist: {
        src: ['test/dist/*.html'],
        dest: 'tmp/'
      }
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'tmp/test/dist/css.min.html': 'tmp/test/dist/css.html',
          'tmp/test/dist/img.min.html': 'tmp/test/dist/img.html',
          'tmp/test/dist/html.min.html': 'tmp/test/dist/html.html',
          'tmp/test/dist/script.min.html': 'tmp/test/dist/script.html'
        }
      }
    },
    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'xhxxac_inline', 'htmlmin', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
