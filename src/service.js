var lib = {};
module.exports = lib;

var t = require("./theory/base.js"),
 p = require("./progression.js"),
 midi = require("./midi.js");

/**
 * Generates a chord progression and returns a MidiWriter object containing the progression.
 *
 * @param {string[]} scales
 * @param {string} chords
 * @param {string} voicings multi line string
 * @param {int} chromaticRoot
 * @param {string} comment generated by...
 *
 * chords, voicings, chromaticRoot, scales
 */
lib.generateMidi = function(scales, chords, voicings, chromaticRoot, comment) {
  var scaleObjects = scales.map(function(scale) { return t.createScale(scale); });
  var voicingObjects = t.parseVoicings(voicings);
  var chordDefinitions = tchords, voicingObjects, scaleObjects);
  var chordObjects = p.createChordProgression(scaleObjects[0], chordDefinitions).getChords();
  return midi.createMidi(chordObjects, scaleObjects, comment, chromaticRoot);
}
