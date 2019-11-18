var g = require("./src/gui/base.js"),
 t = require("./src/theory/base.js"),
 f = require("./src/fingering.js"),
 p = require("./src/progression.js"),
 midi = require("./src/midi.js"),
 presets = require("./resources/presets.js");

var k = g.createKeyboard(3, 7);
var REGEX_COUNT_SCALE = /\*/g;

// TODO move this code into an own file / layer:
g.addForm(function(scales, chordDefs, voicings, options, resultSection) {
  var chordDefinitionGroups = [];
  var chordDefinitions = [];

  // TODO does this even make sense??? (I am on Linux, so this should be fine???)
  chordDefs = chordDefs.replace("\n", " ");

  // parse chord definitions in groups, so we can split the generated chords afterwards...
  chordDefs.split(",").forEach(function(chordDefsOfGroup) {
    // the chord progression needs to be generated in one go!
    var chordDefObjectsOfGroup = t.parseChordDefinitions(chordDefsOfGroup, voicings)
    chordDefObjectsOfGroup.forEach(function (chordDef) {
      var scaleIndex = (chordDef.toString().match(REGEX_COUNT_SCALE) || []).length;
      if (scaleIndex >= scales.length) {
        console.error("InteractiveForm: scale index " + scaleIndex + " is not available. There are only " + scales.length + " scales available.");
        // use the first scale instead
        scaleIndex = 0;
      }
      chordDef.setScale(scales[scaleIndex]);
    });
    chordDefinitionGroups.push(chordDefObjectsOfGroup);
    chordDefinitions = chordDefinitions.concat(chordDefObjectsOfGroup);
  });

  // generate the chords in one go:
  // TODO smells, that the scale not even is needed any more, because all chords have their own scale reference?
  var chords = p.createChordProgression(scales[0], chordDefinitions);

  if (options.generateMidi) {
    midi.downloadMidi(chords, scales, options.serializedForm, options.zebraRoot);
  }

  // but output the chords in groups (defined by comma):
  chordDefinitionGroups.forEach(function(group) {
    var chordsOfGroup = [];
    group.forEach(function() { chordsOfGroup.push(chords.shift()); });
    g.addChordGroup(chordsOfGroup, null, resultSection, chords.length > 0 ? chords[0] : null, options.zebraRoot);
  });
}, presets.progressions, presets.voicings, presets.scales);

/*g.addForm(function(scale, chordDefs, resultSection) {
  var chords = [];
  // var k = g.createKeyboard(5, 14);
  for (var i=0; i<chordDefs.length; ++i) {
    var chord = scale.createChord(chordDefs[i]);
    f.updateFingering(chord);
    chords.push(chord);
  }

  g.addChordGroup(chords, null, resultSection);
}, presets.progressions);
*/
