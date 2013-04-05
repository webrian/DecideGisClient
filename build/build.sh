#!/bin/bash

basedir=".."
srcdir="$basedir/src"

java -jar compiler.jar --js $srcdir/GisToolbar.js --js $srcdir/form/AttributeSelectionField.js --js $srcdir/PrintWindow.js --js $srcdir/form/AttributeSelectionPanel.js --js $srcdir/MainGisToolbar.js --js $srcdir/GisViewport.js --js $srcdir/control/IdentifyControl.js --js $srcdir/util/MapSelection.js --js $srcdir/control/SelectByBox.js --js $srcdir/data/SelectionStore.js --js_output_file $basedir/DecideGisClient-all.js
