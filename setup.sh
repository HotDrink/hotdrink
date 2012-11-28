#!/bin/bash

make -s
make -s test

mkdir -p test/js
cd test/js
ln -s ../../hotdrink.js 2>/dev/null
ln -s ../../hotdrink-test.js 2>/dev/null
cd - >/dev/null

mkdir -p test/todomvc/js/lib
cd test/todomvc/js/lib
ln -s ../../../../hotdrink.js 2>/dev/null
cd - >/dev/null

cd test/todomvc+
ln -s ../todomvc/assets
cd js
ln -s ../../todomvc/js/lib
cd ../.. >/dev/null

cd tutorial
ln -s ../hotdrink.js 2>/dev/null
cd - >/dev/null

