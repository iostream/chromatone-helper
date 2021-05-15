var lib = {};
module.exports = lib;

var trackLib = require('./track.js');

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = require('../audio/instrument.js').getAudioContext();

lib.createSequencer = function() {
  var _pollDelayInMS = 25;
  var _lookAheadInMS = 100; // https://www.html5rocks.com/en/tutorials/audio/scheduling/

  // XXX Why not just use the requestAnimationFrame() polling?
  // TODO try it out, I would suspect that this solution (two timers) will also play audio while the browser tab is in
  // background but the one timer solution would in some situations not play in background so good (mobile versus desktop web browsers). Maybe
  // the user should be able to choose between the one and two timers strategy?
  //
  var _intervalID; // <- return value of setInterval() for the audio scheduling tracks events poller
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
      seq.panic();
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
    },

    panic: function() {
      _tracks.forEach(function(track) {
        var audioInstrument = track.getAudioInstrument();
        if (audioInstrument) {
          audioInstrument.allNotesOff();
        }
      });
    }
  };

  var _lastEndInSeconds = 0;
  var _trackGUIUpdateTimes; // <- queue, in order to update GUI synchronized with the audio thread
  seq.start = function() {
    if (_isPlaying) {
      return;
    }
    _isPlaying = true;

    var velocity = 100;

    var __startTime = false;

    // init _trackGUIUpdateTimes
    _trackGUIUpdateTimes = [];
    _tracks.forEach(function(track, index) {
      _trackGUIUpdateTimes[index] = [];
    });

    // GUI update polling...
    function guiTick() {
      var currentTime = audioCtx.currentTime;
      _trackGUIUpdateTimes.forEach(function(trackUpdateTimes, trackIndex) {
        var i = 0;
        while (trackUpdateTimes[0] <= currentTime) {
          _tracks[trackIndex].updateGUI(true);
          trackUpdateTimes.shift();
        }
      });
      // changing _guiTick disables this polling
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
      if (__startTime === false) {
        __startTime = currentTime;
      }

      var rangeStartInMS = (currentTime - __startTime) * 1000.0;
      var rangeEndInMS = rangeStartInMS + _pollDelayInMS + _lookAheadInMS;
      if (rangeEndInMS < 0) {
        // skip ranges which cannot be in a track, this can happen while repeating
        return;
      }

      _tracks.forEach(function(track, trackIndex) {
        var previousEvent = track.getLastFoundEvent();
        var scheduleTimeInSeconds = __startTime + (track.getSeekPosInMS() / 1000);
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
            if (synth) {
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
            }
            _trackGUIUpdateTimes[trackIndex].push(scheduleTimeInSeconds);
            scheduleTimeInSeconds += event.getLengthInQN() * _secondsPerQuarterNote;
            previousEvent = event;
          });
          if (isSeekingOfTrackDone) {
            var lastFoundEvent = events[events.length - 1];
            var endInSeconds = scheduleTimeInSeconds;
            // XXX already schedule note off for the last event here (because it is simpler to do this way, but it could lead to problems?)
            if (synth && !lastFoundEvent.isRest()) {
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
        __startTime = _lastEndInSeconds;
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
    // GUI timer (stops itself when unset)
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
    _lastEndInSeconds = 0;
    _tracks.forEach(function(track) {
      track.stop();
      track.updateGUI();
    });
  };

  return seq;
}
