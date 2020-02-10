var lib = {};
module.exports = lib;

lib.createReceiptBuilder = function() {
  return {
    getResult: function() {

    }
  };
}
var scaleObjects = scales.map(function(scale) { return t.createScale(scale); });
var voicingObjects = t.parseVoicings(voicings);
var chordDefinitions = tchords, voicingObjects, scaleObjects);
var chordObjects = p.createChordProgression(chordDefinitions).getChords();

/**
 * One receipt contains everything which is used to define a chord progression (and later also multi track songs).
 * (The chord definitions reference all used scales, voicings, rhythm and arpeggio patterns.)
 */
function createReceipt = function(chordDefinitions, bpm, instrumentType) {
  var _tracks = [createTrack(chordDefinitions, "Chromatone-Helper", instrumentType)]; // currently there only is one track
  var _bpm = bpm || 120;

  return {
    getTracks: function() {
      return _tracks;
    },
    getBeatPerMinutes: function() {
      return _bpm;
    }
  };
}

function createTrack(name, chordDefinitions, instrumentType) {
  var _name = name;
  var _chordDefs = chordDefinitions;
  var _instrumentType = instrumentType;
  return {
    getName: function() {
      return _name;
    },
    getChordDefinitions: function() {
      return _chordDefs;
    },
    /**
    * chromatic|zebra|string_instrument
    */
    getInstrumentType: function() {
      return _instrumentType;
    }
  };
}
