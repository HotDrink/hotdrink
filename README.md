# HotDrink

HotDrink is a JavaScript library for User Interface programming.
Instead of requiring programmers to write explicit event handlers, HotDrink
derives user interface behavior from a declarative specification of data
dependencies.

For a brief overview on the functionality HotDrink provides, see the
[HotDrink overview](http://hotdrink.github.io/hotdrink/).

For a thorough introduction on how to use HotDrink, see
[How to use HotDrink](http://hotdrink.github.io/hotdrink/howto/).

You can find compiled versions of HotDrink on GitHub under
[releases](https://github.com/HotDrink/hotdrink/releases).

## Building

Building is performed with the `make` tool.  Run `make` with no arguments to
get a list of possible make targets.  They are:

- hotdrink      - HotDrink library
- hotdrink.min  - HotDrink library (minified)
- qunit         - QUnit tests
- compile-dfa   - DFA compiler
- fn-worker     - Include file for a web worker
- howto         - All how-to documentation
- all           - all of the above
- clean         - remove all created files

Build results may be found in the `scripts` directory, with the exception of
the how-to, which is found in `docs/howto/publish`.

The following tools are required for building.

- [The TypeScript compiler](http://www.typescriptlang.org/#Download) for compiling
  TypeScript files into JavaScript
- [The mapcat tool](https://www.npmjs.com/package/mapcat) for concatenating
  resulting map files.
- [The uglify-js tool](https://www.npmjs.com/package/uglify-js) for creating
  minimized version.
- [GNU Emacs](http://www.gnu.org/software/emacs/) with
  [org mode version 8.3](http://orgmode.org/) for generating the how-to.  Note
  that it's probably easier to download the generated how-to on GitHub under
  [releases](https://github.com/HotDrink/hotdrink/releases).

## Project layout

This repository is organized as follows.

- `docs` - Documentation
  * `docs/howto` - The HotDrink how-to: in-depth instructions on
    using HotDrink
- `src` - Source code
  * `src/apps` - Stand-alone applications
  * `src/hd` - HotDrink source code
  * `src/qunit` - QUnit tests
  * `src/workers` - HTML5 web workers
- `test` - Files for testing
  * `test/cases` - Stand-alone web pages using HotDrink
  * `test/models` - JavaScript defining various models using HotDrink; no web
    pages
  * `test/qunit` - Harness for running QUnit tests
  * `test/vis` - Visualizer for viewing models

In addition, building HotDrink will create the following directories.

- `modules` - Compiled versions of each TypeScript module
- `scripts` - Build results
- `tmp` - Temporary compilation results

These directories are deleted by `make clean`.
