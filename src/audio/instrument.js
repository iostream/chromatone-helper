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

/*
 * This is a workaround, because it was not possible to pass an audio context
 * to tiny synth :(
 */
var audioContext = new AudioContext();
lib.getAudioContext = function() {
//  return getTinySynth().getAudioContext();
  return audioContext;
}

var tinySynth;
function getTinySynth() {
  if (!tinySynth) {
    tinySynth = new WebAudioTinySynth({quality: 2, useReverb: 1, voices: 20});
  }
  return tinySynth;
}

var lastTinySynthChannel = -1;
/**
 * XXX When there will be many tracks (and hence many audio instruments), then use one
 *     tiny synth for many tracks using the channels! ... does not work!! D:
 */
function createTinySynthInstrument() {
  var _synth = new WebAudioTinySynth({quality: 2, useReverb: 1, voices: 20, internalcontext: 0});
  _synth.setAudioContext(audioContext);
  var _channel = 0;
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
      _synth.setTimbre(0, _channel, _synth.program[index].p);
    }
  };

  return instrument;
}
