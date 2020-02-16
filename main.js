var instrumentLib = require("./src/gui/instrument.js"),
 formLib = require("./src/gui/form.js"),
 t = require("./src/theory/base.js"),
 p = require("./src/theory/progression.js"),
 compositeParser = require("./src/parser/composite_parser.js"),
 compositeLib = require("./src/parser/composite.js"),
 arpeggioLib = require("./src/theory/arpeggio.js"),
 midi = require("./src/midi.js"),
 serverClient = require("./src/server/client.js"),
 presets = require("./resources/presets.js"),
 gmPlayerLib = require("./src/audio/gm_player.js");

var gmPlayer = gmPlayerLib.createGmPlayer();

// TODO move this code into an own file / layer?
formLib.addForm(
  function(controls) {
    var instrument = controls.instrument;
    var option;
    gmPlayer.getInstruments().forEach(function(name, index) {
      option = document.createElement('option');
      option.appendChild(document.createTextNode(name));
      option.value = index;
      instrument.appendChild(option);
    });
    instrument.addEventListener("change", function() {
      if (instrument.selectedIndex > -1) {
        gmPlayer.setInstrument(controls.instrument.options[instrument.selectedIndex].value);
      }
    });1
    controls.play.addEventListener("click", function() {
      gmPlayer.start();
    });
    controls.stop.addEventListener("click", function() {
      gmPlayer.stop();
    });
    controls.loop.addEventListener("click", function() {
      gmPlayer.setLoop(controls.loop.checked);
    });
    controls.bpm.addEventListener("input", function() {
      gmPlayer.setBpm(controls.bpm.value);
    });
    controls.bpm.dispatchEvent(new Event('input'));
  },
  function(scales, chordDefParserResult, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
    var progression = p.createChordProgression(chordDefParserResult.getList());
    var chords = progression.getChords();

    var events = arpeggioLib.arpeggiate(progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);
    gmPlayer.setEvents(events);

    if (options.uploadToDAW) {
      serverClient.uploadToDAW(events, chords, scales, buildGeneratorUrl(options.serializedForm));
    }

    if (options.uploadMidi || options.generateMidi) {
      var midiWriter = midi.createMidi(events, chords, scales, buildGeneratorUrl(options.serializedForm));
      if (options.generateMidi) {
        downloadDataUri(midiWriter.dataUri(), "chromatone-helper.mid");
      }
      if (options.uploadMidi) {
        serverClient.uploadMidi(midiWriter.dataUri());
      }
    }

    var instrument = instrumentLib.createInstrument(options.instrumentOptions, resultSection);
    instrument.addChordProgressionUsingChordDefinitionComposit(progression, chordDefParserResult.getComposite());
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
