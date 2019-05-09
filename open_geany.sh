#!/bin/sh
cd src
geany ../main.js ../chromatone-index.html `find "$PWD" | grep .js$` `cd ../resources && find "$PWD"`

