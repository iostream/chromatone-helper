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
 * XXX When there will be many tracks (and hence many audio instruments), then use one
 *     tiny synth for many tracks using the channels!
 */
function createTinySynthInstrument() {
  var _synth = new WebAudioTinySynth({quality: 2, useReverb: 1, voices: 20});
  var _channel = 0;

  var instrument = {
    noteOn: function(position, velocity) {
      _synth.noteOn(_channel, position, velocity);
    },
    noteOff: function(position) {
      _synth.noteOff(_channel, position);
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
