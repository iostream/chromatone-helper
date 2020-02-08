var lib = {};
module.exports = lib;

var WebAudioTinySynth = require('webaudio-tinysynth');

lib.createGmPlayer = function(channel) {
  var _channel = channel || 0;
  var _events = [];
  var _noteOffs = [];
  var _msPerQuarterNote;
  var _synth = new WebAudioTinySynth({quality: 2, useReverb: 1, voices: 20});

  function turnOffNotes() {
    _noteOffs.forEach(function(position) {
      _synth.noteOff(_channel, position);
    });
    _noteOffs = [];
  }

  var player = {
    getInstruments: function() {
      return _synth.program.map(function(programEntry) {
        return programEntry.name;
      });
    },
    setBpm: function(bpm) {
      _msPerQuarterNote = 60000 / bpm;
    },
    stop: function() {
      _events = [];
      turnOffNotes();
    },
    setInstrument: function(index) {
      _synth.setTimbre(0, _channel, _synth.program[index].p);
    },
    playEvents: function(events, instrument, bpm) {
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
        setTimeout(playNextEvent, event.getLengthInQN() * _msPerQuarterNote);
      }

      playNextEvent();
    }
  };

  player.setBpm(120);
  return player;
};
