var lib = {};
module.exports = lib;

const audioContextWrapper = require('../audio/audio_context_wrapper.js');

const trackLib = require('./track.js');

lib.createSequencer = function () {
  var _pollDelayInMS = 25;
  var _lookAheadInMS = 200; // https://www.html5rocks.com/en/tutorials/audio/scheduling/

  // XXX Why not just use the requestAnimationFrame() polling?
  // TODO try it out, I would suspect that this solution (two timers) will also play audio while the browser tab is in
  // background but the one timer solution would in some situations not play in background so good (mobile versus desktop web browsers). Maybe
  // the user should be able to choose between the one and two timers strategy?
  //
  var _intervalID; // <- return value of setInterval() for the audio scheduling tracks events poller
  var _guiTick; // <- currently registered callback with requestAnimationFrame()

  var _tracks = [];
  var _loop = false;
  var _isPlaying = false;
  var _isPaused = false;
  var _secondsPerQuarterNote;

  var _onStopCallbacks = [];

  function playNextEvent(track) {
    return playEvent(track, true);
  }

  function playPreviousEvent(track) {
    return playEvent(track, false);
  }

  var seq = {
    isEmpty: function () {
      return !_tracks.some(track => track.getEvents().length > 0);
    },
    createTrack: function () {
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
      _tracks.forEach(track => {
        track.setMSPerQuarterNote(_secondsPerQuarterNote * 1000);
        track.resetSeeker();
      });
      seq.panic();
    },
    getBpm: function() {
      return 60 / _secondsPerQuarterNote;
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
      _tracks.forEach(track => {
        track.updateGUI();
      });
    },
    panic: function() {
      _tracks.forEach(track => {
        var audioInstrument = track.getAudioInstrument();
        if (audioInstrument) {
          audioInstrument.allNotesOff();
        }
      });
    },
    addStopCallback: function(callback) {
      _onStopCallbacks.push(callback);
    },
    isPlaying: function() {
      return _isPlaying;
    },
    isPaused: function() {
      return _isPaused;
    }
  };

  var _lastEndInSeconds = 0;
  var _trackGUIUpdateTimes; // <- queue, in order to update GUI synchronized with the audio thread

  seq.resetGUIUpdates = function () {
    _trackGUIUpdateTimes = [];
    for (var i = 0; i < _tracks.length; ++i) {
      _trackGUIUpdateTimes.push([]);
    }
  }

  var debug;
  if (false) {
    debug = new VisualDebug(10);
  }

  seq.start = function () {
    var audioCtx = audioContextWrapper.getAudioContext();
    if (_isPlaying) {
      return;
    }
    if (debug) {
      debug.reset();
    }

    _isPlaying = true;
    _isPaused = false;

    var velocity = 100;

    var __startTime = false;

    seq.resetGUIUpdates();

    var loopCount = 0;

    // GUI update polling...
    function guiTick() {
      var currentTime = audioCtx.currentTime;
      _trackGUIUpdateTimes.forEach((trackUpdateTimes, trackIndex) => {
        for (var updateInfo of trackUpdateTimes) {
          if (updateInfo[0] > currentTime) {
            break;
          }
          _tracks[trackIndex].updateGUI(updateInfo[1], updateInfo[2], updateInfo[3]);
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
      // whether all tracks have no events left
      var isSeekingDone = true;

      var currentTime = audioCtx.currentTime;
      if (debug) {
        debug.addTick(currentTime);
      }
      if (__startTime === false) {
        __startTime = currentTime;
      }

      var rangeStartInMS = (currentTime - __startTime) * 1000.0;
      var rangeEndInMS = rangeStartInMS + _pollDelayInMS + _lookAheadInMS;
      if (rangeEndInMS < 0) {
        // console.log("skipping", rangeStartInMS, rangeEndInMS);
        // skip ranges which cannot be in a track, this can happen while repeating
        return;
      }

      for (let trackIndex = 0; trackIndex < _tracks.length; ++trackIndex) {
        let track = _tracks[trackIndex];
        var previousEvent = track.getLastFoundEvent();
        var scheduleTimeInSeconds = __startTime + (track.getSeekPosInMS() / 1000);
        // console.log("seeking", rangeStartInMS, rangeEndInMS);
        var events = track.seekEvents(rangeStartInMS, rangeEndInMS);
        // the end time of an event is the start time of the next event
        // first start time is 0
        var isSeekingOfTrackDone = track.isSeekingDone();
        if (!isSeekingOfTrackDone) {
          isSeekingDone = false;
        }
        var synth = track.getAudioInstrument();
        if (events.length > 0) {
          events.forEach(eventInfo => {
            var event = eventInfo[0];
            var positionInQN = eventInfo[1];
            var chordIndex = eventInfo[2];
            if (debug) {
              debug.addFound(currentTime, scheduleTimeInSeconds);
            }
            if (synth && !track.isMuted()) {
              if (previousEvent && !previousEvent.isRest()) {
                previousEvent.getPitches().forEach(function (note) {
                  synth.noteOff(note.getPosition(), scheduleTimeInSeconds);
                });
              }
              if (!event.isRest()) {
                event.getPitches().forEach(note => {
                  synth.noteOn(note.getPosition(), velocity, scheduleTimeInSeconds);
                });
              }
            }
            _trackGUIUpdateTimes[trackIndex].push([scheduleTimeInSeconds, event, positionInQN, chordIndex]);
            scheduleTimeInSeconds += event.getLengthInQN() * _secondsPerQuarterNote;
            previousEvent = event;
          });
        }
        if (isSeekingOfTrackDone) {
          var lastFoundEvent = track.getLastFoundEvent();
          var endInSeconds = scheduleTimeInSeconds;
          // XXX already schedule note off for the last event here (because it is simpler to do this way, but it could lead to problems?)
          if (synth && lastFoundEvent && !lastFoundEvent.isRest()) {
            lastFoundEvent.getPitches().forEach(note => {
              synth.noteOff(note.getPosition(), endInSeconds);
            });
          }
          if (endInSeconds > _lastEndInSeconds) {
            _lastEndInSeconds = endInSeconds;
          }
        }
      };

      if (isSeekingDone) {
        if (!_loop) {
          // schedule stop
          // XXX there certainly is a better way for doing this
          setTimeout(function () { seq.stop(); }, (_lastEndInSeconds - currentTime) * 1000);
          return;
        }

        // setup next repeat
        _tracks.forEach(track => {
          track.resetSeeker();
        });
        __startTime = _lastEndInSeconds;
        // console.log("start time", __startTime, "currentTime", currentTime, "loop number", ++loopCount);
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

  seq.pause = function () {
    if (_isPlaying) {
      _isPlaying = false;
      stopTimers();
      _isPaused = true;
    }
  };

  seq.stop = function () {
    _isPlaying = false;
    _isPaused = false;
    stopTimers();
    _lastEndInSeconds = 0;
    _tracks.forEach(track => {
      track.stop();
      track.updateGUI();
    });
    _onStopCallbacks.forEach(callback => {
      callback();
    });
  };

  return seq;
}

function VisualDebug(sizeInSeconds) {
  var parent = document.getElementById("interactive");
  var pixelsPerSecond = parent.offsetWidth / sizeInSeconds;
  console.log("Visual Debug", "pixelsPerSecond", pixelsPerSecond);
  var offsetYPerSeconds = 1;
  var width = pixelsPerSecond * sizeInSeconds;
  var height = offsetYPerSeconds * pixelsPerSecond;
  var canvas = createCanvas(width, height);
  parent.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  ctx.width = width;
  ctx.height = height;

  var foundMarkerHeight = 10;
  var xPixelOffset = 0;
  var tickFoundCount = 0;
  var lastXEnd = lastXEnd;

  this.addTick = function(posInSeconds) {
    if (tickFoundCount > 0) {
      // visualize number of queued events
      ctx.fillText("" + tickFoundCount, lastXEnd, lastY)
    }
    tickFoundCount = 0;

    var x = posInSeconds * pixelsPerSecond - xPixelOffset;
    if (x > width) {
      xPixelOffset += width;
      x = posInSeconds * pixelsPerSecond - xPixelOffset;
      ctx.clearRect(0, 0, ctx.width, ctx.height);
    }
    line(x, 0, x, height).stroke();
  }

  this.addFound = function(posInSeconds, foundPosInSeconds) {
    ++tickFoundCount;
    if (tickFoundCount > 1) {
      // not returning would just draw redudandent lines 
      return;
    }
    var xStart = posInSeconds * pixelsPerSecond - xPixelOffset;
    var y = xStart % height;
    var xEnd = foundPosInSeconds * pixelsPerSecond - xPixelOffset;

    line(xStart, y, xEnd, y).stroke()
    line(xEnd, y - foundMarkerHeight, xEnd, y + foundMarkerHeight).stroke();

    lastY = y;
    lastXEnd = xEnd;
  }

  this.reset = function() {
    xPixelOffset = 0;
  }

  function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function line(startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    return ctx;
  }
}
