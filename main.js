var g = require("./src/gui/base.js"),
 formLib = require("./src/gui/form.js"),
 t = require("./src/theory/base.js"),
 p = require("./src/theory/progression.js"),
 compositeParser = require("./src/parser/composite_parser.js"),
 compositeLib = require("./src/parser/composite.js"),
 arpeggioLib = require("./src/theory/arpeggio.js"),
 midi = require("./src/midi.js"),
 serverClient = require("./src/server/client.js"),
 presets = require("./resources/presets.js"),
 gmPlayerLib = require("./src/gm_player.js");

var gmPlayer = gmPlayerLib.createGmPlayer();

// these get played when the user clicks on play
var _lastGeneratedEvents;

// TODO move this code into an own file / layer?
formLib.addForm(
  function(controls) {
    controls.play.addEventListener("click", function() {
      if (_lastGeneratedEvents && _lastGeneratedEvents.length > 0) {
        gmPlayer.stop();
        gmPlayer.playEvents(_lastGeneratedEvents, 2, 100);
      }
    });
    controls.stop.addEventListener("click", function() {
      gmPlayer.stop();
    });
  },
  function(scales, chordDefParserResult, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
    var progression = p.createChordProgression(scales[0], chordDefParserResult.getList());
    var chords = progression.getChords();

    _lastGeneratedEvents = arpeggioLib.arpeggiate(progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);

    if (options.uploadToDAW) {
      serverClient.uploadToDAW(_lastGeneratedEvents, chords, scales, buildGeneratorUrl(options.serializedForm));
    }

    if (options.uploadMidi || options.generateMidi) {
      var midiWriter = midi.createMidi(_lastGeneratedEvents, chords, scales, buildGeneratorUrl(options.serializedForm));
      if (options.generateMidi) {
        downloadDataUri(midiWriter.dataUri(), "chromatone-helper.mid");
      }
      if (options.uploadMidi) {
        serverClient.uploadMidi(midiWriter.dataUri());
      }
    }

    g.addChordProgressionUsingChordDefinitionComposit(progression, chordDefParserResult.getComposite(), options.instrumentOptions, resultSection);
  },
  presets.progressions, presets.chords, presets.voicings, presets.scales, presets.rhythmPatterns, presets.arpeggioPatterns
);

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
