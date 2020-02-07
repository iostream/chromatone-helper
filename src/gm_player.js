var lib = {};
module.exports = lib;

var WebAudioTinySynth = require('webaudio-tinysynth');

lib.createGmPlayer = function(channel) {
  var _channel = channel || 0;
  var _events = [];
  var _noteOffs = [];
  var _synth = new WebAudioTinySynth({quality: 2, useReverb: 0, voices: 20});

  function turnOffNotes() {
    _noteOffs.forEach(function(position) {
      _synth.noteOff(_channel, position);
    });
    _noteOffs = [];
  }

  return {
    getInstrumentNames: function() {
      return _synth.program.map(function(programEntry) {
        console.log(programEntry);
      });
    },
    stop: function() {
      _events = [];
      turnOffNotes();
    },
    playEvents: function(events, instrument, bpm) {
      var msPerQuarterNote = 60000 / bpm;
      _events = events.slice(0);
      var channel = 1;
      var velocity = 100;

      function playNextEvent() {
        _noteOffs.forEach(function(position) {
          _synth.noteOff(_channel, position);
        });
        var event = _events.shift();
        if (typeof(event) === 'undefined') {
          return;
        }
        _noteOffs = [];
        if (!event.isRest()) {
          event.getPitches().forEach(function(note) {
            _noteOffs.push(note.getPosition());
            _synth.noteOn(_channel, note.getPosition(), velocity);
          });
        }
        // play next note after this note ended
        setTimeout(playNextEvent, event.getLengthInQN() * msPerQuarterNote);
      }

      playNextEvent();
    }
  };
};
