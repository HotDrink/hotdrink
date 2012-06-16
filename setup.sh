#!/bin/bash

gmake -s
gmake -s test

mkdir -p test/js
cd test/js
ln -s ../../hotdrink.js 2>/dev/null
ln -s ../../hotdrink-test.js 2>/dev/null
cd -

mkdir -p test/todomvc/js/lib
cd test/todomvc/js/lib
ln -s ../../../../hotdrink.js 2>/dev/null
cd -

