#!/bin/sh

# creates one file version for usage on mobile, bundle.js has to be updated before
# best is to use this script by calling: npm run build

indexFileName="chromatone-combined-index.html"

cd dist

mkdir -p chromatone

rm -fr chromatone/*

cp ../chromatone-index.html chromatone
cp ../bundle.js chromatone
cp -r ../resources chromatone

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
replaceStyleFile "$indexFileName" "resources/zebra.css"
replaceScriptFile "$indexFileName" "bundle.js"
