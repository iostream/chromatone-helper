#!/bin/sh

indexFileName="chromatone-combined-index.html"

mkdir -p build/chromatone

rm -fr build/chromatone/*

cp chromatone-index.html build/chromatone
cp -r src build/chromatone
cp -r resources build/chromatone

# external library (TODO this is overkill and could be done without copying so much)
cp -r node_modules build/chromatone

cd build
# zip -r chromatone.zip chromatone

cd chromatone
cp chromatone-index.html "$indexFileName"

replaceScriptFile() {
  indexFilePath=$1
  filePath=$2
  filePathEscaped=$(printf '%s' "$filePath" | sed -e 's@/@\\/@g')
  sed -e "/$filePathEscaped/ {" -e "a <script>" -e "r $filePath" -e "a </script>" -e 'd' -e '}' -i $indexFilePath
}

replaceStyleFile() {
  indexFilePath=$1
  filePath=$2
  filePathEscaped=$(printf '%s' "$filePath" | sed -e 's@/@\\/@g')
  sed -e "/$filePathEscaped/ {" -e "a <style>" -e "r $filePath" -e "a </style>" -e 'd' -e '}' -i $indexFilePath
}

replaceStyleFile "$indexFileName" "resources/style.css"
replaceScriptFile "$indexFileName" "resources/progressions.json"

replaceScriptFile "$indexFileName" "src/theory.js"
replaceScriptFile "$indexFileName" "src/fingering.js"
replaceScriptFile "$indexFileName" "src/progression.js"
replaceScriptFile "$indexFileName" "src/gui.js"

# external library
replaceScriptFile "$indexFileName" "node_modules/midi-writer-js/build/browser/index.min.js"
