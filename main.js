var g = require("./src/gui/base.js"),
 t = require("./src/theory/base.js"),
 p = require("./src/theory/progression.js"),
 arpeggioLib = require("./src/theory/arpeggio.js"),
 midi = require("./src/midi.js"),
 serverClient = require("./src/server/client.js"),
 presets = require("./resources/presets.js");

var k = g.createKeyboard(3, 7);

// TODO move this code into an own file / layer:
g.addForm(function(scales, chordDefs, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
  var chordDefinitionComposit = t.parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns);
  var progression = p.createChordProgression(scales[0], chordDefinitionComposit);
  var chords = progression.getChords();

  if (options.uploadToDAW || options.uploadMidi || options.generateMidi) {
    events = arpeggioLib.arpeggiate(progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);
  }

  if (options.uploadToDAW) {
    serverClient.uploadToDAW(events, chords, scales, buildGeneratorUrl(options.serializedForm), options.zebraRoot);
  }

  if (options.uploadMidi || options.generateMidi) {
    var midiWriter = midi.createMidi(events, chords, scales, buildGeneratorUrl(options.serializedForm), options.zebraRoot);
    if (options.generateMidi) {
      downloadDataUri(midiWriter.dataUri(), "chromatone-helper.mid");
    }
    if (options.uploadMidi) {
      serverClient.uploadMidi(midiWriter.dataUri());
    }
  }

  // fix chords after arpeggiating them; fixed chords are for visualiziation
  progression.fixChords();
  var chords = progression.getChords();

  g.addChordsUsingChordDefinitionComposit(chords, chordDefinitionComposit, options.zebraRoot, resultSection);

  // // but output the chords in groups (defined by comma):
  // chordDefinitionGroups.forEach(function(group) {
  //   var chordsOfGroup = [];
  //   group.forEach(function() { chordsOfGroup.push(chords.shift()); });
  //   g.addChordGroup(chordsOfGroup, null, resultSection, chords.length > 0 ? chords[0] : null, options.zebraRoot);
  // });
}, presets.progressions, presets.voicings, presets.scales, presets.rhythmPatterns, presets.arpeggioPatterns);

function buildGeneratorUrl(serializedForm) {
  var url = new URL("#" + serializedForm, document.location.href);
  return url.href;
}

/**
 * @see https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
 */
var downloadDataUri = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  // a.style = "display: none";
  a.text = "MIDI";
  return function (dataUri, name) {
    a.href = dataUri;
    a.download = name;
    a.click();
  };
}());
