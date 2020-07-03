var lib = {};
module.exports = lib;

var trackLib = require('./track.js');

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = require('../audio/instrument.js').getAudioContext();

lib.createSequencer = function() {

  var _pollDelayInMS = 25;
  var _lookAheadInMS = 50;
  var _intervalID;
  var _guiTick; // <- currently registered callback with requestAnimationFrame()

  var _tracks = [];
  var _loop = false;
  var _playIndex = 0;
  var _isPlaying = false;
  var _noteOffs = [];
  var _secondsPerQuarterNote;

  function playNextEvent(track) {
    return playEvent(track, true);
  }

  function playPreviousEvent(track) {
    return playEvent(track, false);
  }

  var seq = {
    createTrack: function() {
      var track = trackLib.createTrack();
      track.setMSPerQuarterNote(_secondsPerQuarterNote * 1000);
      _tracks.push(track);
      return track;
    },
    popTrack: function() {
      _tracks.pop();
    },
    getTracks: function() {
      return _tracks;
    },
    setLoop: function(loop) {
      _loop = loop;
    },
    setBpm: function(bpm) {
      // XXX Doing it this way sometimes does stop the audio when incrementing bpm very fast
      _secondsPerQuarterNote = 60 / bpm;
      _tracks.forEach(function(track) {
        track.setMSPerQuarterNote(_secondsPerQuarterNote * 1000);
        track.resetSeeker();
      });
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
    updateGUI: function() {
      _tracks.forEach(function(track) {
        track.updateGUI();
      });
    }
  };

  var _lastEndInSeconds = false;
  var _trackGUIUpdateTimes; // <- in order to update GUI synchronized with the audio thread
  seq.start = function() {
    if (_isPlaying) {
      return;
    }
    _isPlaying = true;

    var velocity = 100;

    var _startTime = false;

    // init _trackGUIUpdateTimes
    _trackGUIUpdateTimes = [];
    _tracks.forEach(function(track, index) {
      _trackGUIUpdateTimes[index] = [];
    });

    // GUI update polling...
    function guiTick() {
      _trackGUIUpdateTimes.forEach(function(trackUpdateTimes, trackIndex) {
        var i = 0;
        var currentTime = audioCtx.currentTime;
        var updateTrack = false;
        while (trackUpdateTimes[0] <= currentTime) {
          updateTrack = true;
          trackUpdateTimes.shift();
        }
        if (updateTrack) {
          _tracks[trackIndex].updateGUI();
        }
      });
      if (_guiTick === guiTick) {
        requestAnimationFrame(_guiTick);
      }
    }
    _guiTick = guiTick;

    requestAnimationFrame(_guiTick);

    // Audio update polling....
    function tick() {
      var isSeekingDone = true;

      var currentTime = audioCtx.currentTime;
      if (_startTime === false) {
        _startTime = currentTime;
      }

      var rangeStartInMS = (currentTime - _startTime) * 1000.0;
      var rangeEndInMS = rangeStartInMS + _pollDelayInMS + _lookAheadInMS;

      _tracks.forEach(function(track, trackIndex) {
        var previousEvent = track.getLastFoundEvent();
        var scheduleTimeInSeconds = _startTime + (track.getSeekPosInMS() / 1000);
        var events = track.seekEvents(rangeStartInMS, rangeEndInMS);
        // the end time of an event is the start time of the next event
        // first start time is 0
        var isSeekingOfTrackDone = track.isSeekingDone();
        if (!isSeekingOfTrackDone) {
          isSeekingDone = false;
        }
        var synth = track.getAudioInstrument();
        if (events.length > 0) {
          events.forEach(function(event) {
            if (previousEvent) {
              if (!previousEvent.isRest()) {
                synth.allNotesOff(scheduleTimeInSeconds);
              }
            }
            if (!event.isRest()) {
              event.getPitches().forEach(function(note) {
                synth.noteOn(note.getPosition(), velocity, scheduleTimeInSeconds);
              });
            }
            // XXX Why +0.1 is needed? (Without is, the GUI updates are too late)
            _trackGUIUpdateTimes[trackIndex].push(scheduleTimeInSeconds + 0.1);
            // XXX Updating GUI should involve Window.requestAnimationFrame()?
            // setTimeout(
            //   function() { track.updateGUI(); },
            //   (scheduleTimeInSeconds - currentTime) * 1000
            // );
            scheduleTimeInSeconds += event.getLengthInQN() * _secondsPerQuarterNote;
          });
          if (isSeekingOfTrackDone) {
            var lastFoundEvent = events[events.length - 1];
            var endInSeconds = scheduleTimeInSeconds;
            // XXX already schedule note off for the last event here (because it is simpler to do this way, but it could lead to problems?)
            if (!lastFoundEvent.isRest()) {
              synth.allNotesOff(endInSeconds);
            }
            if (endInSeconds > _lastEndInSeconds) {
              _lastEndInSeconds = endInSeconds;
            }
          }
        }
      });

      if (isSeekingDone) {
        if (!_loop) {
          // schedule stop
          // XXX there certainly is a better way for doing this
          setTimeout(function() { seq.stop(); }, (_lastEndInSeconds - currentTime) * 1000);
          return;
        }

        // setup next repeat
        _tracks.forEach(function(track) {
          track.resetSeeker();
        });
        _startTime = _lastEndInSeconds;
      }
    }
    _intervalID = window.setInterval(tick, _pollDelayInMS);
  };

  function stopTimers() {
    // Audio timer:
    if (_intervalID) {
      clearInterval(_intervalID);
      _intervalID = false;
    }
    // GUI timer (stops itself)
    _guiTick = false;
  }

  seq.pause = function() {
    _isPlaying = false;
    stopTimers();
  };

  seq.stop = function() {
    _isPlaying = false;
    _playIndex = 0;
    stopTimers();
    _lastEndInSeconds = false;
    _tracks.forEach(function(track) {
      track.stop();
      track.updateGUI();
    });
  };

  return seq;
}
