#!/bin/sh
cd src
geany ../main.js ../chromatone-index.html `find "$PWD/src" | grep .js$` `cd ../resources && find "$PWD"`

