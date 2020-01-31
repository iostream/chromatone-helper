var lib = {};
module.exports = lib;

/**
 * @param chordDef
 */
lib.createChord = function(chordDef, defaultScale) {
  // TODO this is now kind of a mess here!?
  var _scale = chordDef.getScale() || defaultScale;
  var _step = chordDef.getStep();
  var _voicing = chordDef.getVoicing();
  var _inversion = chordDef.getInversion();
  var _transposition = chordDef.getTransposition();
  var _chordDef = chordDef;

  if (_step > 0) {
    var _scale = _scale.clone()
    _scale.shift(_step);
  }

  var _name = chordDef.toString();

  var _notes = false;
  var _arpeggioNotes = false;
  var _invertedArpeggioNotes = false;

  function setDirty() {
    _notes = false;
    _arpeggioNotes = false;
    _invertedArpeggioNotes = false;
  }

  function transposeNotes(notes) {
    if (_transposition != 0) {
      for (var i = 0; i < notes.length; ++i) {
        notes[i].transpose(_transposition);
      }
    }
  }

  var chord = {
    getNotes: function() {
      if (_notes === false) {
        _notes = _voicing.createNotes(_scale, _inversion);
        transposeNotes(_notes);
      }
      return _notes;
    },
    getArpeggioNotes: function() {
      if (_arpeggioNotes === false) {
        _arpeggioNotes = _voicing.createArpeggioNotes(_scale, _inversion);
        transposeNotes(_arpeggioNotes);
      }
      return _arpeggioNotes;
    },
    getInvertedArpeggioNotes: function() {
      if (_invertedArpeggioNotes === false) {
        _invertedArpeggioNotes = _voicing.createInvertedArpeggioNotes(_scale, _inversion);
        transposeNotes(_invertedArpeggioNotes);
      }
      return _invertedArpeggioNotes;
    },
    // TODO I dont like how the find methods are implemented
    getHighestNote: function() {
      return this.findHighestNote();
    },
    getLowestNote: function() {
      return this.findLowestNote();
    },
    findHighestNote: function() {
      return this.getNotes().reduce(
        function(highestNote, note) {
          if (highestNote === null || note.getPosition() > highestNote.getPosition()) {
            highestNote = note;
          }
          return highestNote;
        },
        null
      );
    },
    findLowestNote: function() {
      return this.getNotes().reduce(
        function(lowestNote, note) {
          if (lowestNote === null || note.getPosition() < lowestNote.getPosition()) {
            lowestNote = note;
          }
          return lowestNote;
        },
        null
      );
    },
    transpose: function(semitones) {
      _transposition += semitones;
      setDirty();
    },
    getName: function() {
      return _name + (_inversion > 0 ? (" " + _inversion): "");
    },
    /**
    * Changing the chord definition does not change the chord. The chord
    * was created using this chord definition.
    */
    getChordDefinition: function() {
      return _chordDef;
    }
  };

  return chord;
};
