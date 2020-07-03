var lib = {};
module.exports = lib;

var audioInstrumentLib = require('../audio/instrument.js');

/**
 * XXX This design won't work fur multi track purposes.
 */
lib.createTrack = function() {
  var _audioInstrument = audioInstrumentLib.createInstrument();
  var _instrumentGUI;
  var _events = [];

  var _chordIndex = 0;
  var _eventIndex = -1; // <- index "within" the current chord

  var _seekPosMs = 0;
  var _seekPosEvent = false;
  var _seekEventStartInMs;
  var _msPerQuarterNote;

  var _lastFoundEvent = false;

  var _lastHighlighted = false;
  var track = {
    setMSPerQuarterNote: function(milliSeconds) {
      _msPerQuarterNote = milliSeconds;
    },
    setEvents: function(events) {
      _events = events;
    },
    resetSeeker: function() {
      _seekEventStartInMs = 0;
      _chordIndex = 0;
      _eventIndex = -1;
      _seekPosMs = 0;
      _seekPosEvent = false;
      _lastFoundEvent = false;
    },
    setChordIndex: function(chordIndex) {
      _chordIndex = chordIndex;
    },
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
      return _events[_chordIndex][_eventIndex];
    },
    nextEvent: function() {
      // check whether the current chord/event indexes are still in their array bounds:
      if (_chordIndex >= _events.length) {
        return false;
      }
      // does the chord need to be advanced?
      if ((_eventIndex + 1) >= _events[_chordIndex].length) {
        // yes
        ++_chordIndex;
        _eventIndex = 0;
        if (_chordIndex >= _events.length) {
          // there are no more chords
          return false;
        }
      } else {
        ++_eventIndex;
      }
      return _events[_chordIndex][_eventIndex];
    },
    getAudioInstrument: function() {
      return _audioInstrument;
    },
    setInstrumentGUI: function(instrumentGUI) {
      _instrumentGUI = instrumentGUI;
    },
    updateGUI: function() {
      if (!_instrumentGUI || _chordIndex >= _events.length) {
        return;
      }

      // dehighlight previous pitches
      if (_lastHighlighted && _events.length > _lastHighlighted[0] && _events[_lastHighlighted[0]].length > _lastHighlighted[1]) {
        _instrumentGUI.dehighlightEvent(_events[_lastHighlighted[0]][_lastHighlighted[1]], _lastHighlighted[0]);
      }

      // check for initial state: no pitches are active, so return
      if (_eventIndex == -1) {
        return;
      }

      // highlight current event and remember event indexes, so it can be dehighlighted later
      _instrumentGUI.highlightEvent(_events[_chordIndex][_eventIndex], _chordIndex);
      _lastHighlighted = [_chordIndex, _eventIndex];
    }
  };

  track.stop = function() {
    track.resetSeeker();
    if (_audioInstrument) {
      _audioInstrument.allNotesOff();
    }
  };

  track.isSeekingDone = function() {
    return !_seekPosEvent;
  };

  /**
   * always seeks forward.
   * returned empty array means: no data
   * returned false means: track has reached its end
   */
  track.seekEvents = function(positionInMSRangeStart, positionInMSRangeEnd) {
    if (_events.length === 0) {
      _lastFoundEvent = false;
      return false;
    }

    if (_seekPosMs === 0 || positionInMSRangeStart === 0) {
      track.resetSeeker();
      _seekPosEvent = track.nextEvent();
    }

    // seek start point
    while (_seekPosMs < positionInMSRangeStart) {
      _seekPosEvent = track.nextEvent();
      if (!_seekPosEvent) {
        break;
      }
      _seekPosMs += _seekPosEvent.getLengthInQN() * _msPerQuarterNote;
    }

    var found = [];
    while (_seekPosEvent && _seekPosMs <= positionInMSRangeEnd) {
      found.push(_seekPosEvent);
      _seekPosMs += _seekPosEvent.getLengthInQN() * _msPerQuarterNote;
      _seekPosEvent = track.nextEvent();
    }
    if (found.length > 0) {
      _lastFoundEvent = found[found.length - 1];
    }
    return found;
 };

 track.getLastFoundEvent = function() {
   return _lastFoundEvent;
 };

 track.getSeekPosInMS = function() {
   return _seekPosMs;
 };

  return track;
};
