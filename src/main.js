var instrumentLib = require("./gui/instrument/proxy.js"),
 formLib = require("./gui/form.js"),
 t = require("./theory/base.js"),
 p = require("./theory/progression.js"),
 compositeParser = require("./parser/composite_parser.js"),
 compositeLib = require("./parser/composite.js"),
 arpeggioLib = require("./theory/arpeggio.js"),
 midi = require("./midi.js"),
 serverClient = require("./server/client.js"),
 presets = require("../resources/presets.js"),
 sequencerLib = require("./sequencer/sequencer.js");

var sequencer = sequencerLib.createSequencer();
var track = sequencer.createTrack();

// TODO move this code into an own file / layer?
formLib.addForm(
  function(controls) {
    var instrument = controls.instrument;
    var option;
    track.getAudioInstrument().getPresetNames().forEach(function(name, index) {
      option = document.createElement('option');
      option.appendChild(document.createTextNode(name));
      option.value = index;
      instrument.appendChild(option);
    });
    instrument.addEventListener("change", function() {
      if (instrument.selectedIndex > -1) {
        track.getAudioInstrument().setPreset(controls.instrument.options[instrument.selectedIndex].value);
      }
    });1
    controls.play.addEventListener("click", function() {
      sequencer.start();
    });
    controls.pause.addEventListener("click", function() {
      sequencer.pause();
    });
    controls.stop.addEventListener("click", function() {
      sequencer.stop();
    });
    controls.step_forward.addEventListener("click", function() {
      sequencer.stepForward();
    });
    controls.step_backward.addEventListener("click", function() {
      sequencer.stepBackward();
    });
    controls.loop.addEventListener("click", function() {
      sequencer.setLoop(controls.loop.checked);
    });
    controls.bpm.addEventListener("input", function() {
      sequencer.setBpm(controls.bpm.value);
    });
    controls.bpm.dispatchEvent(new Event('input'));
  },
  function(scales, chordDefParserResult, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
    var progression = p.createChordProgression(chordDefParserResult.getList());
    var chords = progression.getChords();

    var events = arpeggioLib.arpeggiate(progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);
    track.setEvents(events);

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

    var instrument = instrumentLib.createInstrument(options.instrumentOptions, resultSection, sequencer);
    instrument.addChordProgressionUsingChordDefinitionComposite(progression, chordDefParserResult.getComposite());
    track.setInstrumentGUI(instrument);

    sequencer.updateGUI();
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
