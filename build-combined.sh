#!/bin/sh

# creates one file version for usage on mobile, bundle.js has to be updated before
# best is to use this script by calling: npm run build

indexFileName="chromatone-combined-index.html"

mkdir -p build/chromatone

rm -fr build/chromatone/*

cp chromatone-index.html build/chromatone
cp bundle.js build/chromatone
cp -r resources build/chromatone

cd build

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
replaceScriptFile "$indexFileName" "bundle.js"

