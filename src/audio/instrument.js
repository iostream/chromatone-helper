var lib = {};
module.exports = lib;

const audioContextWrapper = require("./audio_context_wrapper.js");

var WebAudioTinySynth = require('webaudio-tinysynth');
const { MyToneSynth } = require('./my_tone_synth.js');

var INSTRUMENT_FACTORIES = {
  'webaudio-tinysynth': createTinySynthInstrument,
  'my-tone-synth': () => new MyToneSynth()
};

lib.getInstrumentNames = function() {
  return Object.keys(INSTRUMENT_FACTORIES);
}

lib.createInstrument = function(instrumentName) {
  if (typeof(instrumentName) === 'undefined') {
    return createTinySynthInstrument();
  }
  if (typeof(INSTRUMENT_FACTORIES[instrumentName]) === 'undefined') {
    console.error('createInstrument() - Unknown instrument name: ' + instrumentName);
    return createTinySynthInstrument();
  }
  return INSTRUMENT_FACTORIES[instrumentName]();
}

lib.releaseInstrument = function(audioInstrument) {
  // TODO
}

/**
 * Shared tiny synth
 */
var tinySynth;
function getTinySynth() {
  if (!tinySynth) {
    tinySynth = new WebAudioTinySynth({internalContext: 0, quality: 1, useReverb: 1, voices: 100});
    if (audioContextWrapper.isAudioContextInitialized()) {
      tinySynth.setAudioContext(audioContextWrapper.getAudioContext());
    } else {
      audioContextWrapper.addAudioContextConsumer(audioContext => tinySynth.setAudioContext(audioContext));
    }
  }
  return tinySynth;
}

var lastTinySynthChannel = -1;

function createTinySynthInstrument() {
  var _synth = getTinySynth();
  var _channel = ++lastTinySynthChannel;

  var instrument = {
    noteOn: function(position, velocity, time) {
      _synth.noteOn(_channel, position, velocity, time);
    },
    noteOff: function(position, time) {
      _synth.noteOff(_channel, position, time);
    },
    allNotesOff: function() {
      _synth.allSoundOff(_channel);
    },
    getPresetNames: function() {
      return _synth.program.map(function(programEntry) {
        return programEntry.name;
      });
    },
    setPreset: function(index) {
      _synth.setProgram(_channel, index);
    },
    setVolume: function(volume) {
      _synth.setChVol(_channel, (volume / 100) * 127);
    }
  };

  return instrument;
}
