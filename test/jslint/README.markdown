> Forked from [JeNeSuisPasDave's gist](https://gist.github.com/2064959)

> Forked from ericfried's [original gist](https://gist.github.com/858343); cleaned up some broken links, fixed a shell script bug, and added some optional setup.

I just realized that there is a rather well hidden javascript interpreter in the mac os x terminal out of the box. /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc
See <http://www.phpied.com/javascript-shell-scripting/>

Then i figured it coud be quite easy to set up a command line util to run jslint from anywhere. Thought i´d share how.

## Setup ##
* Download and unzip this gist.
* Download Douglas Crockfords jslint from here <https://github.com/douglascrockford/JSLint>.
* Edit the 'jslint' shell script and set the paths to where you saved the .js files.
* Chmod the 'jslint' shell script  (`chmod +x` )
* (optional) add an alias to your .bashrc : `alias jslint <path-to-files>/jslint `
* (optional) add a soft link to jsc somewhere on your path, e.g.: `ln -s /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Resources/jsc ~/bin/jsc`
* Try it!

## Invocation ##
Examples of valid invocations
 `jslint filename.js` ,
 `jslint filename1.js filename2.js` ,
 `jslint folder/*.js folder2/*.js` ,

## History ##

1. 2012-03-17. Bug fix and clean up help output
    
    * Fixed a bug in the script (extraneous '=' character)
    * Cleaned up the help output