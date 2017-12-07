'use strict';

var grunt = require('grunt');

/*
	======== A Handy Little Nodeunit Reference ========
	https://github.com/caolan/nodeunit

	Test methods:
		test.expect(numAssertions)
		test.done()
	Test assertions:
		test.ok(value, [message])
		test.equal(actual, expected, [message])
		test.notEqual(actual, expected, [message])
		test.deepEqual(actual, expected, [message])
		test.notDeepEqual(actual, expected, [message])
		test.strictEqual(actual, expected, [message])
		test.notStrictEqual(actual, expected, [message])
		test.throws(block, [error], [message])
		test.doesNotThrow(block, [error], [message])
		test.ifError(value)
*/
var fs = require('fs');

function readFile(file) {
	'use strict';

	var contents = grunt.file.read(file);

	if (process.platform === 'win32') {
		contents = contents.replace(/\r\n/g, '\n');
	}

	return contents;
}

function assertFileEquality(test, pathToActual, pathToExpected, message) {
	var actual = readFile(pathToActual);
	var expected = readFile(pathToExpected);
	test.equal(expected, actual, message);
}

exports.xhxxac_inline = function(test) {
	 'use strict';

	test.expect(4);

	assertFileEquality(test,
		'tmp/test/dist/css.min.html',
		'test/expected/css.min.html',
		'Should compile css inline');

	assertFileEquality(test,
		'tmp/test/dist/img.min.html',
		'test/expected/img.min.html',
		'Should compile image inline');

	assertFileEquality(test,
		'tmp/test/dist/html.min.html',
		'test/expected/html.min.html',
		'Should compile html inline');

	assertFileEquality(test,
		'tmp/test/dist/script.min.html',
		'test/expected/script.min.html',
		'Should compile script inline');

	test.done();
};
