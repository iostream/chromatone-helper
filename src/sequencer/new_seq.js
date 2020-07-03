var lib = {};
module.exports = lib;

var trackLib = require('./track.js');

lib.createSequencer = function() {

  var _pollDelayInMs = 20;
  var _playAheadInMs = 4;
  var _intervalID;

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

  function playNextEvent(track) {
    return playEvent(track, true);
  }

  function playPreviousEvent(track) {
    return playEvent(track, false);
  }

  var seq = {
    createTrack: function() {
      var track = trackLib.createTrack();
      _tracks.push(track);
      return track;
    },
    getTracks: function() {
      return _tracks;
    },
    setLoop: function(loop) {
      _loop = loop;
    },
    setBpm: function(bpm) {
      _msPerQuarterNote = 60000 / bpm;
    },
    /**
     * TODO: chord index
     */
    setChordIndex: function(chordIndex, trackIndex) {
      var trackIndex = trackIndex || 0;
      _tracks[trackIndex].setChordIndex(chordIndex);

      // TODO All other tracks need to seek to their right positions

    },
    stepForward: function(trackIndex) {
      if (_isPlaying || _tracks.length === 0) {
        return;
      }
      var trackIndex = trackIndex || 0;
      var track = _tracks[trackIndex];
      playNextEvent(track);

      // TODO All other tracks need to seek to their right positions
      // TODO update all tracks
      track.updateGUI();
    },
    stepBackward: function(trackIndex) {
      if (_isPlaying || _tracks.length === 0) {
        return;
      }
      var trackIndex = trackIndex || 0;
      var track = _tracks[trackIndex];
      playPreviousEvent(track);

      // TODO All other tracks need to seek to their right positions
      // TODO update all tracks
      track.updateGUI();
    },
    start: function() {
      if (_isPlaying) {
        return;
      }
      _isPlaying = true;

      _intervalID = windows.setInterval(function() {



        track.updateGUI();
      }, _pollDelayInMs);


      var me = this;
      function --s() {
        if (!_isPlaying) {
          return;
        }
        var track = _tracks[0];
        var event = playNextEvent(track);
        if (!event) {
          return;
        }

        // play next note after this note ended
        setTimeout(playNextEvents, event.getLengthInQN() * _msPerQuarterNote);


      }

      playNextEvents();
    },
    pause: function() {
      _isPlaying = false;
      turnOffNotes();
      if (_intervalID) {
        clearInterval(_intervalID);
        _intervalID = false;
      }
    },
    stop: function() {
      _isPlaying = false;
      _playIndex = 0;
      turnOffNotes();
      if (_intervalID) {
        clearInterval(_intervalID);
        _intervalID = false;
      }
      _tracks.forEach(function(track) {
        track.reset();
        track.updateGUI();
      });
    },
    updateGUI: function() {
      _tracks.forEach(function(track) {
        track.updateGUI();
      });
    }
  };
  function playEvent(track, next) {
    turnOffNotes();
    if (!track) {
      return;
    }
    var velocity = 100;
    var event = (next) ? track.nextEvent() : track.previousEvent();
    if (!event) {
      if (!_loop) {
        seq.stop();
        return;
      }

      track.reset();
      event = track.nextEvent();
      // * if loop is active, then start from the beginning when the last
      // event was already played
      // * if reset also returns nothing, then it seems that there is nothing
      // to be played, so the sequencer should be stopped
      if (!event) {
        seq.stop();
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

    return event;
  }
  return seq;
}
