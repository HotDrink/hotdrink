`jslint` and `jsc_jslint_wrapper.js` are from JeNeSuisPasDave's [gist](https://gist.github.com/2064959)

`fulljslint.js` is from Douglas Crockfod's [JSLint](https://github.com/douglascrockford/JSLint)

There is a rather well hidden javascript interpreter in the mac os x terminal out of the box. /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc
See <http://www.phpied.com/javascript-shell-scripting/>


## Setup ##
* (optional) add an alias to your .bashrc : `alias jslint <path-to-files>/jslint`
* (optional) add a soft link to jsc somewhere on your path, e.g.: `ln -s /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc ~/bin/jsc`

## Invocation ##
Examples of valid invocations
 `jslint filename.js` ,
 `jslint filename1.js filename2.js` ,
 `jslint folder/*.js folder2/*.js` ,