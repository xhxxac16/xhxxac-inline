/*
 * grunt-xhxxac-inline
 * https://github.com/xhxxac16/study2017
 *
 * Copyright (c) 2017 Amanda
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	var path = require('path');
	var datauri = require('datauri');
	var UglifyJS = require("uglify-js");
	var CleanCSS = require('clean-css');
	// from grunt-inline.js in grunt-inline
	grunt.registerMultiTask('xhxxac_inline', "Replaces or Remove <link>, <script> and <img> tags to their inline contents", function() {

		var options = this.options({tag: '__inline', mark: '__remove'}),
			uglify = !!options.uglify,
			cssmin = !!options.cssmin,
			relativeTo = this.options().relativeTo,
			exts = options.exts,
			dest = this.data.dest,
			isExpandedPair;

		this.files.forEach(function(filePair){

			isExpandedPair = filePair.orig.expand || false;
			filePair.src.forEach(function(filepath){

				var fileType = path.extname(filepath).replace(/^\./, '');
				var fileContent = grunt.file.read(filepath);
				var destFilepath = '';

				grunt.log.write('Processing ' + filepath + '...')

				if(detectDestType(filePair.dest) === 'directory') {
					destFilepath = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, filepath));
				}else{
					destFilepath = filePair.dest || filepath;
				}

				if(fileType==='html' || (exts && exts.indexOf(fileType) > -1)){
					fileContent = htmlLocal(filepath, fileContent, relativeTo, options);

					(function(_filepath, _fileContent, _relativeTo, _options,_destFilepath){
						html(_filepath, _fileContent, _relativeTo, _options,_destFilepath);
					})(filepath, fileContent, relativeTo, options,destFilepath);


				}else if(fileType==='css'){
					fileContent = css(filepath, fileContent, relativeTo, options);
					grunt.file.write(destFilepath, fileContent);
					grunt.log.ok()
				}
			});
		});



	});

	function isRemotePath( url ){
		return url.match(/^'?https?:\/\//) || url.match(/^\/\/?/);
	}

	function isBase64Path( url ){
		return url.match(/^'?data.*base64/);
	}

	// code from grunt-contrib-copy, with a little modification
	function detectDestType(dest) {
		if (grunt.util._.endsWith(dest, '/')) {
			return 'directory';
		} else {
			return 'file';
		}
	}

	function unixifyPath(filepath) {
		if (process.platform === 'win32') {
			return filepath.replace(/\\/g, '/');
		} else {
			return filepath;
		}
	}

	// from grunt-text-replace.js in grunt-text-replace
	function getPathToDestination(pathToSource, pathToDestinationFile) {
		var isDestinationDirectory = (/\/$/).test(pathToDestinationFile);
		var fileName = path.basename(pathToSource);
		var newPathToDestination;
		if (typeof pathToDestinationFile === 'undefined') {
			newPathToDestination = pathToSource;
		} else {
			newPathToDestination = pathToDestinationFile + (isDestinationDirectory ? fileName : '');
		}
		return newPathToDestination;
	}

	function htmlLocal(filepath, fileContent, relativeTo, options){
		if(relativeTo){
			filepath = filepath.replace(/[^\/]+\//, relativeTo);
		}
		var regNoHttp = /<inline.+?src=["'](?!http:\/\/)([^"']+?)["']\s*?\/>/g;

		fileContent = fileContent.replace(regNoHttp, function(matchedWord, src){
			var ret = matchedWord;
			if(ret.indexOf(options.mark)!=-1){
				ret = ret.replace(/\<(script|style).+?__remove((.|\s)*?)\<\/(script|style)\>/gi, '');
			}
			if(isRemotePath(src) || !grunt.file.isPathAbsolute(src)){

				var inlineFilePath = path.resolve( path.dirname(filepath), src );
				if( grunt.file.exists(inlineFilePath) ){
					ret = grunt.file.read( inlineFilePath );

					// @otod need to be checked, add bye herbert
					if(options.relativeHTMLPath || src.match(/^(..\/)+/ig)){
						ret = ret.replace(/(<script.+?src=["'])([^"']+?)(["'].*?><\/script>)/g, function(){
							var _src = arguments[2];
							if(!isRemotePath( _src )){
								// 转换相对路径--add by vienwu
								var _path = path.join(src,'../',arguments[2]).replace(/\\/g,'/');
								grunt.log.write('\n replace inline path '+ arguments[2] + ' >>> ' + _path);
								return arguments[1] + _path  + arguments[3];
							}else{
								return arguments[1] +  arguments[2] + arguments[3];
							}
						});
					}

				}else{
					grunt.log.error("Couldn't find " + inlineFilePath + '!');
				}
			}
			return ret;
		}).replace(/<script.+?src=["']([^"']+?)["'].*?>\s*<\/script>/g, function(matchedWord, src){
			var ret = matchedWord;
			if(ret.indexOf(options.mark)!=-1){
				ret='';
			}
			if(!isRemotePath(src) && src.indexOf(options.tag)!=-1){
				var inlineFilePath = path.resolve( path.dirname(filepath), src ).replace(/\?.*$/, '');	// 将参数去掉
				var c = options.uglify ? UglifyJS.minify(inlineFilePath).code : grunt.file.read( inlineFilePath );
				if( grunt.file.exists(inlineFilePath) ){
					ret = '<script>\n' + c + '\n</script>';
				}else{
					grunt.log.error("Couldn't find " + inlineFilePath + '!');
				}
			}
			grunt.log.debug('ret = : ' + ret +'\n');

			return ret;

		}).replace(/<link.+?href=["']([^"']+?)["'].*?\/?>/g, function(matchedWord, src){
			var ret = matchedWord;
			if(ret.indexOf(options.mark)!=-1){
				ret='';
			}
			if(!isRemotePath(src) && src.indexOf(options.tag)!=-1){

				var inlineFilePath = path.resolve( path.dirname(filepath), src ).replace(/\?.*$/, '');	// 将参数去掉

				if( grunt.file.exists(inlineFilePath) ){
					var styleSheetContent = grunt.file.read( inlineFilePath );
					ret = '<style>\n' + cssInlineToHtml(filepath, inlineFilePath, styleSheetContent, relativeTo, options) + '\n</style>';
				}else{
					grunt.log.error("Couldn't find " + inlineFilePath + '!');
				}
			}
			grunt.log.debug('ret = : ' + ret +'\n');

			return ret;
		}).replace(/<img.+?src=["']([^"':]+?)["'].*?\/?\s*?>/g, function(matchedWord, src){
			var	ret = matchedWord;
			if(ret.indexOf(options.mark)!=-1){
				ret='';
			}
			if(!grunt.file.isPathAbsolute(src) && src.indexOf(options.tag)!=-1){

				var inlineFilePath = path.resolve( path.dirname(filepath), src ).replace(/\?.*$/, '');	// 将参数去掉

				if( grunt.file.exists(inlineFilePath) ){
					ret = matchedWord.replace(src, (new datauri(inlineFilePath)).content);
				}else{
					grunt.log.error("Couldn't find " + inlineFilePath + '!');
				}
			}
			grunt.log.debug('ret = : ' + ret +'\n');

			return ret;
		});

		return fileContent;
	}

	function _html(filepath, fileContent, relativeTo, options,destFilepath,_fileContent){
		var regTest1 = /<inline.+?src=["'](http:\/\/)([^"']+?)["']\s*?\/>/;
		var regTest = /<inline.+?src=["'](http:\/\/)([^"']+?)["']\s*?\/>/g;
		var httpType = regTest1.test(_fileContent);
		var cmdd = _fileContent.match(regTest);
		var url = '';

		if(cmdd && cmdd.length>0){
			if(cmdd.length == 1){
				url = cmdd[0].replace(/<inline.+?src=["']/,'').replace(/["']\s*?\/>/,'');
			} else  {
				url = cmdd[1].replace(/<inline.+?src=["']/,'').replace(/["']\s*?\/>/,'');
			}
		}

		if(httpType){
			_fileContent = _fileContent.replace(regTest1,fileContent);
			getShtml(url,function(_ret){
				_html(filepath, _ret, relativeTo, options, destFilepath,_fileContent);
			});
		} else {
			grunt.file.write(destFilepath, _fileContent);
			grunt.log.ok();
		}
	}

	function html(filepath, fileContent, relativeTo, options, destFilepath){
		if(relativeTo){
			filepath = filepath.replace(/[^\/]+\//, relativeTo);
		}

		var _fileContent = fileContent;
		var contType = true;
		var bcc = true;

		fileContent = fileContent.replace(/<inline.+?src=["']([^"']+?)["']\s*?\/>/g, function(matchedWord, src){
			var ret = matchedWord;
			if(isRemotePath(src) || !grunt.file.isPathAbsolute(src)){

				var inlineFilePath = path.resolve( path.dirname(filepath), src );
				if(isRemotePath( src )){

					contType = false;
					if(bcc){
						getShtml(src,function(_ret){
							_html(filepath, _ret, relativeTo, options, destFilepath,_fileContent,src);
						});
						bcc = false;
					}

				}else{
					grunt.log.error("Couldn't find " + inlineFilePath + '!');
				}
			}
		});

		if(contType){
			grunt.file.write(destFilepath, fileContent);
			grunt.log.ok()
		}
	}

	function css(filepath, fileContent, relativeTo, options) {
		if(relativeTo){
			filepath = filepath.replace(/[^\/]+\//g, relativeTo);
		}

		fileContent = fileContent.replace(/url\(["']*([^)'"]+)["']*\)/g, function(matchedWord, imgUrl){
			var newUrl = imgUrl;
			var flag = imgUrl.indexOf(options.tag)!=-1;	// urls like "img/bg.png?__inline" will be transformed to base64
			if(isBase64Path(imgUrl) || isRemotePath(imgUrl)){
				return matchedWord;
			}
			grunt.log.debug( 'imgUrl: '+imgUrl);
			grunt.log.debug( 'filepath: '+filepath);
			var absoluteImgurl = path.resolve( path.dirname(filepath),imgUrl );
			grunt.log.debug( 'absoluteImgurl: '+absoluteImgurl);
			newUrl = path.relative( path.dirname(filepath), absoluteImgurl );
			grunt.log.debug( 'newUrl: '+newUrl);

			absoluteImgurl = absoluteImgurl.replace(/\?.*$/, '');
			if(flag && grunt.file.exists(absoluteImgurl)){
				newUrl = datauri(absoluteImgurl);
			}else{
				newUrl = newUrl.replace(/\\/g, '/');
			}

			return matchedWord.replace(imgUrl, newUrl);
		});
		fileContent = options.cssmin ? CleanCSS.process(fileContent) : fileContent;

		return fileContent;
	}

	function cssInlineToHtml(htmlFilepath, filepath, fileContent, relativeTo, options) {
		if(relativeTo){
			filepath = filepath.replace(/[^\/]+\//g, relativeTo);
		}

		fileContent = fileContent.replace(/url\(["']*([^)'"]+)["']*\)/g, function(matchedWord, imgUrl){
			var newUrl = imgUrl;
			var flag = !!imgUrl.match(/\?__inline/);	// urls like "img/bg.png?__inline" will be transformed to base64
			grunt.log.debug('flag:'+flag);
			if(isBase64Path(imgUrl) || isRemotePath(imgUrl)){
				return matchedWord;
			}
			grunt.log.debug( 'imgUrl: '+imgUrl);
			grunt.log.debug( 'filepath: '+filepath);
			var absoluteImgurl = path.resolve( path.dirname(filepath),imgUrl );	// img url relative to project root
			grunt.log.debug( 'absoluteImgurl: '+absoluteImgurl);
			newUrl = path.relative( path.dirname(htmlFilepath), absoluteImgurl );	// img url relative to the html file
			grunt.log.debug([htmlFilepath, filepath, absoluteImgurl, imgUrl]);
			grunt.log.debug( 'newUrl: '+newUrl);

			absoluteImgurl = absoluteImgurl.replace(/\?.*$/, '');
			if(flag && grunt.file.exists(absoluteImgurl)){
				newUrl = datauri(absoluteImgurl);
			}else{
				newUrl = newUrl.replace(/\\/g, '/');
			}

			return matchedWord.replace(imgUrl, newUrl);
		});
		fileContent = options.cssmin ? CleanCSS.process(fileContent) : fileContent;

		return fileContent;
	}


	function getShtml(url, callback){
		var http = require("http");
		http.get(url, function(req, res){
			var html = '';
			console.log('Response is '+req.statusCode);

			req.on('data', function (chunk) {
				html += chunk;
			});

			req.on('end', function () {
				callback(html);
			});

		});
	}

};
