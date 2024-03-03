User Reference
==============

[Get started now!](https://iostream.github.io/chromatone-helper/multi-track-sequencer/ "Try Chromatone Helper by iostream")

Chromatone Helper can also be used offline on most web browsers, including mobile devices. Simply download the tool by saving [this link](https://github.com/iostream/chromatone-helper/raw/gh-pages/multi-track-sequencer/index.html "Download the Chromatone Janko Tool") as an HTML file and run it locally in your web browser. Patches can be saved as web browser bookmarks for easy access.


Features
--------
- Create chord progressions and arpeggios with ease using a declarative DSL.
- Use scales, voicings, rhythms, arpeggio patterns, and chord definitions to build your music.
- Visualize your music directly on a stylized representation of the instrument of your choice, including Chromatone (like Jankó), zebra keyboard, guitar, bass, piano roll, and more. The tool displays visual cues such as markers and blinking bars to indicate which notes to play, making it easy to follow along and play your music on real instruments without needing knowledge of staff notation.
- Combine multiple progressions on parallel tracks to create complex musical arrangements.
- Experience your music in a variety of ways by playing it through different audio presets within the browser.
- Seamlessly integrate with Reaper-DAW. Your MIDI editor contents are automatically replaced by the tool in real-time when you modify the input.
- Easily export your musical creations as MIDI files.


Full examples
-------------

* Original examples
  + [Example 1](https://iostream.github.io/chromatone-helper/multi-track-sequencer/#chords=(%24a%3A+1+2+6+4+5+6)%0D%0A(%24b%3A+8+7+6+5+4+3)%0D%0A%0D%0Aa+d%3Du+i%2B%3D2++A%3Db%0D%0A(a+b)%0D%0Ab+d%3Dd%0D%0Aa+d%3Dd+i%2B%3D1+t-%3D12%0D%0A&scale%5B0%5D=r1+2+b3+4+5+b6+7+k%3DD3&voicing=1+3+8+5+7+8&rhythms=1+1+1+1+1+1+1+1+q%3D4&arp=b%3A+%3E*%0D%0A1_%3E+%3E+%3E+4_%3E+%3E+%3E&instrument=zebra&bpm=117)
  + [Example 2](https://iostream.github.io/chromatone-helper/multi-track-sequencer/#chords=(%24a1%3A+1i1+6i0+2+5*+V%3Db)%0D%0A(%24a2%3A+1*+6*+2**+6**+V%3Dc+R%3Dc)%0D%0A%0D%0Aa1+A%3Da%0D%0Aa1+A%3Db%0D%0Aa2+A%3Db&scale%5B0%5D=r1+2+3+4+5+b6+7+k%3DB2&scale%5B1%5D=r1+2+3+4+5+6+7+k%3DB2&scale%5B2%5D=r1+2+b3+4+5+b6+b7+k%3DEb2&voicing=a%3A+1+5+8+10+12+%0D%0Ab%3A+1+5+8+9+10+12%0D%0Ac%3A+1+3+5+7+8%0D%0Aa&rhythms=1+1+!1+1+!1+1+!1+1+q%3D4%0D%0Ab%3A+1+!1+1+!1+1+!1+1+1%0D%0Ac%3A+1+1+1+1+1+1+1+1&arp=a%3A+1_3+%3E*+2_4%0D%0Ab%3A+1+2_3_4+2+3_4_5+-2+-1_-2_-3%0D%0A&instrument=guitar&bpm=146)
  + [Example 3](https://iostream.github.io/chromatone-helper/multi-track-sequencer/#chords=(A%3A+%0D%0A+(2i3+4+5+V%3Db+3)+V%3Da%0D%0A)%0D%0A(B%3A%0D%0A+(2+4+6+8)+V%3Db%0D%0A)%0D%0A(B+B)&scale%5B0%5D=r1+2+b3+4+5+6+b7+k%3Dd2&voicing=a%3A+3+5+7+8%0D%0Ab%3A+3+6+8+10%0D%0A&rhythms=6+8+12+8+6+8+8+8+q%3D4%0D%0A&arp=1+-1+-3+-2+-3+-1+&instrument=chromatic&bpm=128)

* J. S. Bach
  + ["Free flowing" arpeggios only using voicings](https://iostream.github.io/chromatone-helper/#chords=1t12Va+4Vb+6Vc+1t12Vd%2C%0D%0A6+5+1+2%0D%0A&voicing=a%3A+1+5+10+9+10+5+10+5%0D%0Ab%3A+5+10+15+14+15+10+15+10%0D%0Ac%3A+3+9+13+12+13+9+13+9%0D%0Ad%3A+1+8+10+9+10+8+10+8+1+8+10+9+10+8+10+7%0D%0Aa%0D%0A&zebra_root=-17&scale[0]=r1+2+3+4+5+6+7&rhythms=1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1&arp=>*)


Examples
--------

### Chord definitions

The actual resulting chords depend on the used scale and the used voicing.

* first jazz chord progression to learn: `2 5 1`
* Pachelbel's Canon: `1 5 6 3 4 1 4 5`
* modal interchange (chord defintions with `*` use the second scale, `**` is the third scale, etc.): `1 4* 3 1**`

Assign scales (s), voicings (V), rhyhthm patterns (R) and arpeggio patterns (A). Each can be assigned directly, e.g. `1 V=(1 3 5)` or using a reference, e.g. `1 V=a`.

Assignments can be grouped using paranthesis, e.g. `(2 5 1) s=(1 2 3 4 5 6 b7)`.

### Scales

* Each mode of a scale can be accessed by shifting the scale using the `<` and `>` buttons.
* Scales can be transposed using the `+` and `-` buttons.

* D# major scale starting at middle D#: `1 2 3 4 5 6 7 k=D#4` or `1 2 3 4 5 6 7 D#4`
* C natural minor starting at middle C (middle C is the default key): `1 2 b3 4 5 b6 b7`
* Eb bebob major scale starting at Eb1: `1 2 3 4 5 b6 6 7 k=Eb1`

### Voicings

* triad: `1 3 5`
* suspended chords: `1 2 5`, `1 4 5`
* seventh chord: `1 3 5 7`
* ninth chord: `1 3 5 7 9`

### Rhythm patterns

* "four to the floor": `1 1 1 1`
* three quarter notes in one bar (the default bar length is 4 quarter notes): `1 1 1 q=3`
* "skank": `!1 1 !1 1 !1 1 !1 1`
* Repeated dotted eighth note and sixteenth note: `3 1 3 1 3 1 3 1`

### Arpeggio patterns

* deepest and highest pitch: `1 -1`
* all pitches of a triad, descending: `3 2 1`
* second highest pitch and then all following pitches after inversion of the selected chord in the order they appear in the voicing of the chord: `-2 >*`
* deepest pitch and then all pitches played at once: `1 >*_`
* deepest and highest note of the chord played together, and then the second lowest and the next pitch in order of the voicing played together `1_-1 2_>`

Development
===========

How to develop
--------------

For initial setup, run: `npm install`.

For development, run:

```
npm run watch
```

Then open `chromatone-index.html` in your web browser and reload it everytime any source code changed to see the effects. There is no server side code. The tool runs completely in the web browser.

How to develop while using the Reaper-DAW integration
-----------------------------------------------------

When using the Reaper-DAW integration while development, the application needs to be served via localhost (because of CORS), hence another file watch becomes handy. After initial setup, run:

```
npm run build_watch
```

It will trigger the build everytime a Javascript file was changed (the trigger does not work for the other source files). This way you only need to reload the page after changing the source to see the effect.


How to build
------------

```
npm run build
```

Creates `dist/chromatone/chromatone-combined-index.html` which contains everything in one file. This way the tool also works on mobile web browsers.
