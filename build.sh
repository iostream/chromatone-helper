#!/bin/sh

mkdir -p build/chromatone

rm -fr build/chromatone/*

cp chromatone-index.html build/chromatone
cp -r src build/chromatone
cp -r resources build/chromatone
