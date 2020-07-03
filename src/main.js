var formLib = require("./gui/form.js"),
 t = require("./theory/base.js"),
 compositeParser = require("./parser/composite_parser.js"),
 compositeLib = require("./parser/composite.js"),

 midi = require("./midi.js"),
 serverClient = require("./server/client.js"),
 presets = require("../resources/presets.js"),
 sequencerLib = require("./sequencer/sequencer.js"),
 sequencerGuiLib = require("./gui/sequencer/service.js"),
 sequencerTransport = require("./gui/sequencer/transport.js");

var sequencer = sequencerLib.createSequencer();
var sequencerGui;

// TODO move this code into an own file / layer?
formLib.addForm(
  function initControlElements(controls) {
    sequencerGui = sequencerGuiLib.createService(sequencer, controls.form);
    sequencerGui.initControlElements(controls);
    sequencerGui.addNewTrack();
  },
  function onParameters(parameters) {
    sequencerGui.updateByParameters(parameters);
  },
  function onSubmit(scales, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {


    sequencerGui.updateTracks(scales, voicings, rhythmPatterns, arpeggioPatterns);
    sequencer.updateGUI();



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
