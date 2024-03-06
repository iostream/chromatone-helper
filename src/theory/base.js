var lib = {};
module.exports = lib;

var scaleLib = require("./scale.js");
var voicingLib = require("./voicing.js");
var notesLib = require("./notes.js");
var chordDefinitionLib = require("./chord_definition.js");
lib.createScale = scaleLib.createScale;
lib.parseVoicings = voicingLib.parseVoicings;
lib.isVoicing = voicingLib.isVoicing;
lib.parseChordDefinitions = chordDefinitionLib.parseChordDefinitions;
lib.parseNote = notesLib.parseNote;
lib.parseNotes = notesLib.parseNotes;
lib.parseKeyPosition = notesLib.parseKeyPosition;
