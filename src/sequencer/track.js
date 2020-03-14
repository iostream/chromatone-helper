var lib = {};
module.exports = lib;

var audioInstrumentLib = require('../audio/instrument.js');

lib.createTrack = function() {
  var _audioInstrument = audioInstrumentLib.createInstrument();
  var _instrumentGUI;
  var _events = [];

  var _chordIndex = 0;
  var _eventIndex = -1; // <- index "within" the current chord

  var _lastHighlighted = false;

  var track = {
    setEvents: function(events) {
      _events = events;
    },
    reset: function() {
      _chordIndex = 0;
      _eventIndex = -1;
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

      if (_lastHighlighted && _events.length > _lastHighlighted[0] && _events[_lastHighlighted[0]].length > _lastHighlighted[1]) {
        _instrumentGUI.dehighlightEvent(_events[_lastHighlighted[0]][_lastHighlighted[1]], _lastHighlighted[0]);
      }

      if (_eventIndex == -1) {
        return;
      }

      _instrumentGUI.highlightEvent(_events[_chordIndex][_eventIndex], _chordIndex);
      _lastHighlighted = [_chordIndex, _eventIndex];
    }
  };

  return track;
};
