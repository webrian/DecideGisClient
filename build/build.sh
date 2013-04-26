#!/bin/bash
#
# Used to build the library, requires the Closure Compiler. Get the Closure Compiler
# from https://developers.google.com/closure/compiler/ and unzip it to this directory.
#
# On the command line:
# cd build/
# wget http://closure-compiler.googlecode.com/files/compiler-latest.zip
# unzip compiler-latest.zip
# ./build.sh
#

basedir=".."
srcdir="$basedir/src"

java -jar compiler.jar --js $srcdir/NavigationToolbar.js --js $srcdir/form/AttributeSelectionField.js --js $srcdir/PrintWindow.js --js $srcdir/form/AttributeSelectionPanel.js --js $srcdir/MainGisToolbar.js --js $srcdir/GisViewport.js --js $srcdir/control/IdentifyControl.js --js $srcdir/util/MapSelection.js --js $srcdir/control/SelectByBox.js --js $srcdir/data/SelectionStore.js --js $srcdir/LegendWindow.js --js_output_file $basedir/DecideGisClient-all.js
