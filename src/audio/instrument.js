var lib = {};
module.exports = lib;

var WebAudioTinySynth = require('webaudio-tinysynth');

var INSTRUMENT_FACTORIES = {
  'webaudio-tinysynth': createTinySynthInstrument
};

lib.getInstrumentNames = function() {
  return INSTRUMENT_FACTORIES.keys();
}

lib.createInstrument = function(instrumentName) {
  if (typeof(instrumentName) === 'undefined') {
    return createTinySynthInstrument();
  }
  if (typeof(INSTRUMENT_FACTORIES[instrumentName] === 'undefined')) {
    console.error('createInstrument() - Unknown instrument name: ' + instrumentName);
    return createTinySynthInstrument();
  }
  return INSTRUMENT_FACTORIES[instrumentName]();
}

/**
 * Shared audio context
 */
var audioContext;
function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}
lib.getAudioContext = getAudioContext;

/**
 * Shared tiny synth
 */
var tinySynth;
function getTinySynth() {
  if (!tinySynth) {
    tinySynth = new WebAudioTinySynth({quality: 1, useReverb: 1, voices: 20, internalContext: 0, graph: 0});
    tinySynth.setAudioContext(getAudioContext());
  }
  return tinySynth;
}

var lastTinySynthChannel = -1;

function createTinySynthInstrument() {
  var _synth = getTinySynth();
  var _channel = ++lastTinySynthChannel;
  var _noteOns = [];

  var instrument = {
    noteOn: function(position, velocity, time) {
      _synth.noteOn(_channel, position, velocity, time);
      _noteOns.push(position);
    },
    noteOff: function(position, time) {
      _synth.noteOff(_channel, position, time);
    },
    allNotesOff: function(time) {
      _noteOns.forEach(function(position) {
        _synth.noteOff(_channel, position, time);
      });
      _noteOns = [];
    },
    getPresetNames: function() {
      return _synth.program.map(function(programEntry) {
        return programEntry.name;
      });
    },
    setPreset: function(index) {
      _synth.setProgram(_channel, index);
    }
  };

  return instrument;
}
