var lib = {};
module.exports = lib;

var trackLib = require('./track.js');

lib.createSequencer = function() {
  var _tracks = [];
  var _loop = false;
  var _playIndex = 0;
  var _isPlaying = false;
  var _noteOffs = [];
  var _msPerQuarterNote;

  function turnOffNotes() {
    var synth = _tracks[0].getAudioInstrument();
    _noteOffs.forEach(function(position) {
      synth.noteOff(position);
    });
    _noteOffs = [];
  }

  var seq = {
    createTrack: function() {
      var track = trackLib.createTrack();
      _tracks.push(track);
      return track;
    },
    setLoop: function(loop) {
      _loop = loop;
    },
    setBpm: function(bpm) {
      _msPerQuarterNote = 60000 / bpm;
    },
    start: function() {
      _isPlaying = true;
      var channel = 1;
      var velocity = 100;

      var me = this;
      function playNextEvent() {
        turnOffNotes();
        if (!_isPlaying || _tracks.length === 0) {
          return;
        }
        var track = _tracks[0];
        var event = track.nextEvent();
        if (!event) {
          if (!_loop) {
            me.stop();
            return;
          }

          track.reset();
          event = track.nextEvent();
          // * if loop is active, then start from the beginning when the last
          // event was already played
          // * if reset also returns nothing, then it seems that there is nothing
          // to be played, so the sequencer should be stopped
          if (!event) {
            me.stop();
            return;
          }
        }

        if (!event.isRest()) {
          var synth = track.getAudioInstrument()
          event.getPitches().forEach(function(note) {
            _noteOffs.push(note.getPosition());
            synth.noteOn(note.getPosition(), velocity);
          });
        }
        // play next note after this note ended
        setTimeout(playNextEvent, event.getLengthInQN() * _msPerQuarterNote);

        track.updateGUI();
      }

      playNextEvent();
    },
    stop: function() {
      _isPlaying = false;
      _playIndex = 0;
      turnOffNotes();
      _tracks[0].reset();
      _tracks[0].updateGUI();
    }
  };
  return seq;
}
