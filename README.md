User Reference
==============

[Try the Chromatone Janko Tool!](https://iostream.github.io/chromatone-helper/ "Chromatone Janko Tool by iostream")

You can also use it offline in most web browsers, also on mobile devices! [Just save this link as an HTML file](https://github.com/iostream/chromatone-helper/raw/master/dist/chromatone/chromatone-combined-index.html "Download the Chromatone Janko Tool") and then run it locally in your web browser!

Voicings
--------

* the last voicing which has no name, becomes the default voicing


Development
===========

How to develop
--------------

For initial setup, run: `npm install`.

For development, run:

```
npm run watch
```

Then open `chromatone-index.html` in your web browser and reload it everytime you changed any source code to see the effects. There is no server side code. The tool runs completely in the web browser.

How to build
------------

```
npm run build
```

Creates `dist/chromatone/chromatone-combined-index.html` which contains everything in one file. This way the tool also works on mobile web browsers!

Feature wishes
--------------
- Actual user reference
- Voicings
   * [x] include voicing in MIDI export
   * enable voicings like this (beginning from comma does not exist yet), examples:
      * 1 3 5 6, -2 (drop 2 voicing)
      * 1 3 5 6, -4 (African jazz voicing I learned on Youtube)
      * how to enable doubling? `1 3 5 6 6, -4` is not possible, because it would interupt the inversions (or change invert() algorithm?)
        maybe `1 3 5 6, -4 4`
   * transposing using intervals: e.g. 1Tb3 (1tb3 should not be possible?), instead of 1t3
   * Bug: Using the voicings definition: `defaultVoicing` leads to endless recursion ("too much recursion" error in Firefox)

- GUI
   * better diff to next chord: just superimpose the next chord!
   * render chord specifications next to the chord visualisation and enable modifications of the chord definition via just clicking on the visualisations or symbols next to them (e.g. transpose via `+`,`-`)

- Automatic Inversions
   * better/always working automatic chord transition inversion optimization
   * allow disabling of automatic chord transition inversion optimization (maybe this works using e.g. 1i0)
   
- Chord-Length (first only for MIDI generation)
   * default length of a chord is one bar
   * change length examples: 
      * 2 bars, a forth note: `1L2`, `1L1/4`
      * 2,5 bars: `1L2L1/2` or `1L2.5`
      
