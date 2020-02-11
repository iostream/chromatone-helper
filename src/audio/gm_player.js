var lib = {};
module.exports = lib;

var WebAudioTinySynth = require('webaudio-tinysynth');

lib.createGmPlayer = function(channel) {
  var _channel = channel || 0;
  var _events = [];
  var _loop = false;
  var _playIndex = 0;
  var _isPlaying = false;
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
    setEvents: function(events) {
      _events = events;
    },
    setLoop: function(loop) {
      _loop = loop;
    },
    setBpm: function(bpm) {
      _msPerQuarterNote = 60000 / bpm;
    },
    stop: function() {
      _isPlaying = false;
      _playIndex = 0;
      turnOffNotes();
    },
    setInstrument: function(index) {
      _synth.setTimbre(0, _channel, _synth.program[index].p);
    },
    start: function() {
      _isPlaying = true;
      var channel = 1;
      var velocity = 100;

      function playNextEvent() {
        _noteOffs.forEach(function(position) {
          _synth.noteOff(_channel, position);
        });
        _noteOffs = [];
        if (!_isPlaying) {
          return;
        }
        if (_playIndex >= _events.length) {
          if (!_loop) {
            return;
          }
          // if loop is active, then start from the beginning when the last
          // event was already played
          _playIndex = 0;
        }
        var event = _events[_playIndex++];
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
