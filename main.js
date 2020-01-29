var g = require("./src/gui/base.js"),
 t = require("./src/theory/base.js"),
 p = require("./src/theory/progression.js"),
 compositeParser = require("./src/parser/composite_parser.js"),
 compositeLib = require("./src/parser/composite.js"),
 arpeggioLib = require("./src/theory/arpeggio.js"),
 midi = require("./src/midi.js"),
 serverClient = require("./src/server/client.js"),
 presets = require("./resources/presets.js");

// TODO move this code into an own file / layer?
g.addForm(function(scales, chordDefParserResult, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
  var progression = p.createChordProgression(scales[0], chordDefParserResult.getList());
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

  g.addChordsUsingChordDefinitionComposit(chords, chordDefParserResult.getComposite(), options.zebraRoot, resultSection);

}, presets.progressions, presets.chords, presets.voicings, presets.scales, presets.rhythmPatterns, presets.arpeggioPatterns);

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
