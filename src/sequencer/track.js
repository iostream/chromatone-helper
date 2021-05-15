var lib = {};
module.exports = lib;

var audioInstrumentLib = require('../audio/instrument.js');

/**
 *
 */
lib.createTrack = function() {
  var _audioInstrument = audioInstrumentLib.createInstrument();
  var _instrumentGUI;
  var _events = [];

  var _muted = false;

  var _msPerQuarterNote;

  var _seekPosMs = 0;
  var _seekPosEvent = false;
  var _lastFoundEvent = false;
  var _audioEventIndex = createEventIndex('audio');

  var _lastHighlighted = false;

  var _guiEventIndex = createEventIndex('gui');

  var track = {
    setMSPerQuarterNote: function(milliSeconds) {
      _msPerQuarterNote = milliSeconds;
    },
    setEvents: function(events) {
      _events = events;
    },
    resetSeeker: function() {
      _audioEventIndex.reset();
      _seekPosMs = 0;
      _seekPosEvent = _audioEventIndex.nextEvent();
    },
    setChordIndex: function(chordIndex) {
      _chordIndex = chordIndex;
    },
    // XXX DELETE ME:
    previousEvent: function() {
      // does the chord index need to be decreased?
      if (_eventIndex === 0) {
        // yes
        --_chordIndex;
        _eventIndex = -1;
        if (_chordIndex < 0) {
          // there are no more chords
          return false;
        }
        _eventIndex = _events[_chordIndex].length - 1;
      } else {
        --_eventIndex;
      }
      var event = _events[_chordIndex][_eventIndex];
      return event;
    },
    getAudioInstrument: function() {
      if (_muted) {
        return false;
      }
      return _audioInstrument;
    },
    setInstrumentGUI: function(instrumentGUI) {
      _instrumentGUI = instrumentGUI;
    },
    /**
     * If updateUsingQueue = true -> update GUI to the state of the first queued entry of the _eventUpdateQueue
     * If updateUsingQueue = false|undefined -> just repaint the current event (the content changed, but not the position of the event within the )
     */
    updateGUI: function(updateUsingQueue) {
      // dehighlight previously highlighted pitches
      if (_lastHighlighted && _lastHighlighted[0]) {
        _instrumentGUI.dehighlightEvent(_lastHighlighted[0], _lastHighlighted[1]);
        _lastHighlighted = false;
      }

      var event;
      if (updateUsingQueue) {
        event = _guiEventIndex.nextEvent();
        if (!event) {
          _guiEventIndex.reset();
          event = _guiEventIndex.nextEvent();
          if (!event) {
            console.error('updateGUI(true) with no event on GUI index position');
          }
        }
      } else {
        return;
        event = _guiEventIndex.getEvent();
      }
      var eventData;

      if (!event) {
        return;
      }

      var chordIndex = _guiEventIndex.getChordIndex();

      // highlight current event and remember event indexes, so it can be dehighlighted later
      _instrumentGUI.highlightEvent(event, chordIndex);
      _lastHighlighted = [event, chordIndex];
    },
    mute: function(on) {
      if (!_muted && on) {
        if (_audioInstrument) {
          _audioInstrument.allNotesOff();
        }
      }
      _muted = on;
    }
  };

  track.stop = function() {
    track.resetSeeker();
    _guiEventIndex.reset();
    if (_audioInstrument) {
      _audioInstrument.allNotesOff();
    }
  };

  /**
   * always seeks forward.
   * returned empty array means: no data
   * getLastFoundEvent() will return false, if there are no more events to be found seeking forward
   */
  track.seekEvents = function(positionInMSRangeStart, positionInMSRangeEnd) {
    if (_events.length === 0) {
      return false;
    }

    // seek start point
    while (_seekPosMs < positionInMSRangeStart) {
      _seekPosEvent = _audioEventIndex.nextEvent();
      if (!_seekPosEvent) {
        break;
      }
      _seekPosMs += _seekPosEvent.getLengthInQN() * _msPerQuarterNote;
    }

    var found = [];
    while (_seekPosEvent && _seekPosMs <= positionInMSRangeEnd) {
      found.push(_seekPosEvent);
      _seekPosMs += _seekPosEvent.getLengthInQN() * _msPerQuarterNote;
      _seekPosEvent = _audioEventIndex.nextEvent();
    }
    if (found.length > 0) {
      _lastFoundEvent = found[found.length - 1];
    }
    return found;
  };

  track.isSeekingDone = function() {
    return _audioEventIndex.getEvent() === false;
  };

  track.getLastFoundEvent = function() {
    return _lastFoundEvent;
  };

  track.getSeekPosInMS = function() {
    return _seekPosMs;
  };

  function createEventIndex(name) {
      var __chordIndex = 0;
      var __eventIndex = -1; // <- index "within" the current chord
      var __currentEvent = false;

    return {
      reset: function() {
        __chordIndex = 0;
        __eventIndex = -1;
        __currentEvent = false;
      },
      getEvent: function() {
        return __currentEvent;
      },
      getChordIndex: function() {
        return __chordIndex;
      },
      nextEvent: function() {
        __currentEvent = false;
        // check whether the current chord/event indexes are still in their array bounds:
        if (__chordIndex >= _events.length) {
          return false;
        }
        // does the chord need to be advanced?
        if ((__eventIndex + 1) >= _events[__chordIndex].length) {
          // yes
          ++__chordIndex;
          __eventIndex = 0;
          if (__chordIndex >= _events.length) {
            // there are no more chords
            return false;
          }
        } else {
          ++__eventIndex;
        }
        __currentEvent = _events[__chordIndex][__eventIndex];
        return __currentEvent;
      }
    };
  };

  return track;
};
