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
    // do things which need to be done, when the parameters in the URL fragment change, before
    // the form element's values are all overwitten with the values of the URL's fragment
    sequencerGui.updateByParameters(parameters);
  },
  function onSubmit(scales, voicings, rhythmPatterns, arpeggioPatterns, options, resultSection) {
    updateSequencer(scales, voicings, rhythmPatterns, arpeggioPatterns);
    updateExports(scales, options);
  },
  presets.progressions, presets.chords, presets.voicings, presets.scales, presets.rhythmPatterns, presets.arpeggioPatterns
);

function updateSequencer(scales, voicings, rhythmPatterns, arpeggioPatterns) {
  sequencerGui.updateTracks(scales, voicings, rhythmPatterns, arpeggioPatterns);
  sequencer.updateGUI();
}

function updateExports(scales, options) {
  if (!options.uploadToDAW && !options.uploadMidi && !options.generateMidi) {
    return;
  }

  if (options.uploadToDAW) {
    serverClient.uploadToDAW(sequencer, chords, scales, buildGeneratorUrl(options.serializedForm));
  }

  if (options.uploadMidi || options.generateMidi) {
    var midiWriter = midi.createMidi(sequencer, scales, buildGeneratorUrl(options.serializedForm));
    if (options.generateMidi) {
      downloadDataUri(midiWriter.dataUri(), "chromatone-helper.mid");
    }
    if (options.uploadMidi) {
      serverClient.uploadMidi(midiWriter.dataUri());
    }
  }
}

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
