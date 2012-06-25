/*
This script is just a wrapper around Douglas Crockfords jslint, intended to be invoked by jsc.
The script is depending on jslint, which means jslint has to be loaded before this script.
*/
/*global JSLINT, print, quit, arguments */	
(function (source) {
	if (typeof JSLINT === 'undefined') {
		print('ERROR: JSLINT does not appear to be properly loaded.');
	}
	
	if (typeof JSLINT === 'undefined' || !source) {
		print('usage:\n $ jsc jslint.js jsc_jslint.js -- "`cat source.js`"');
		quit();
	} 
	var 
		// Options from www.jslint.com when using "The good parts" 
//		goodPartsOptions = {devel: true,
//							browser: true,
//							white: true,
//							onevar: true,
//							undef: true,
//							newcap: true,
//							nomen: true,
//							regexp: true,
//							plusplus: true,
//							bitwise: true,
//							maxerr: 50,
//							indent: 4 },	
      options = {browser: true,
              devel: true,
              passfail: false,
              ea5: true,
              undef: true,
              sloppy: true,
              vars: true,
              plusplus: true,
              white: true,
              nomen: true,
              indent: 2,
              maxlen: 78,
              maxerr: 50 },
	    result = JSLINT(source, options),
	    errors = [],
	    error = {},
	    i;
	
	if (result) {
		print('\tNo errors.');
	} else {
		print('ERRORS:');
		errors = JSLINT.data().errors;
		for (i = 0; i < errors.length; i += 1) {
			error = errors[i];
			print(' ' + error.line + ':' + error.character + '\t' + error.reason);
			print('\t' + error.evidence.trim());
			print(' ---');
		}
		print('Total ' + errors.length + ' errors');
	}
	quit();
}(arguments[0]));
