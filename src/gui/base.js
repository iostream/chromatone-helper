var lib = {};
module.exports = lib;

var keyboard = require("./keyboard.js");
var zebra = require("./zebra.js");
var stringInstrument = require("./string_instrument.js");

function $_(id) { return document.getElementById(id); }
/**
 * References to DOM elements...
 */
var chordTemplate = $_("templates").getElementsByClassName("chord")[0],
  chordGroupTemplate = $_("templates").getElementsByClassName("chord-group")[0],
  chordReferenceGroupTemplate = $_("templates").getElementsByClassName("chord-reference-group")[0],
  chordSection = $_("chords");

function addChord(chord, parent, instrumentOptions, nextChord, lowestPosition) {
  lowestPosition = lowestPosition || 0;
  parent = parent || chordSection;
  var instrument;

  instrumentType = instrumentOptions.type || 'chromatic';
  if (instrumentType == 'zebra') {
    instrument = zebra.createZebraKeyboard(lowestPosition, chord.getHighestNote().getPosition());
  } else if (instrumentType == 'chromatic') {
    instrument = keyboard.createKeyboard(lowestPosition, chord.getHighestNote().getPosition(), 4);
  } else {
    instrument = stringInstrument.createStringInstrumentByType(instrumentType);
  }

  if (!instrument) {
    console.error("addChord() - Unknown instrument type: " + instrumentType);
    return;
  }

  var name;
  if (typeof chord.getName !== "undefined") {
    name = chord.getName();
  }
  instrument.add(chord, name, instrumentOptions);

  if (nextChord) {
    instrument.addDiff(nextChord);
  }

  parent.appendChild(instrument.getElement());

  return instrument
}
lib.addChord = addChord;

function createChordReferenceGroup(title, section) {
  var groupEl = section.appendChild(chordReferenceGroupTemplate.cloneNode(true)),
    titleEl = groupEl.getElementsByClassName("title")[0] || false;

  if (titleEl && title) {
    titleEl.innerHTML = title;
  }
  return groupEl;
}

function addChordGroup(chords, title, section, nextChordAfterGroup, instrumentOptions) {
  section = section || chordSection;
  nextChordAfterGroup = nextChordAfterGroup || null;

  var groupEl = section.appendChild(chordGroupTemplate.cloneNode(true)),
    titleEl = groupEl.getElementsByClassName("title")[0] || false;

  if (titleEl && title) {
    titleEl.innerHTML = title;
  }

  // TODO legacy code?
  if (!Array.isArray(chords)) {
    // make the array out of the string:
    var chordDefinitions = chords.trim().split(",");
    chords = [];
    for (var i = 0; i < chordDefinitions.length; ++i) {
      chords.push(tLib.parseNotes(chordDefinitions[i]));
    }
  }

  for (var i = 0; i < chords.length; ++i) {
    // add chord to the new keyboard
    var keyboard = addChord(chords[i], groupEl, instrumentOptions);
    var nextChord = chords[(i + 1) % chords.length];

    // mark differences between voicings/notes, won't work all the time, because it's very simple:
    // last chord of group and nextChordAfterGroup was passed?
    if (i === chords.length - 1 && nextChordAfterGroup !== null) {
      nextChord = nextChordAfterGroup;
    }
    keyboard.addDiff(nextChord);
  }
}
lib.addChordGroup = addChordGroup;

function addChordsRecursive(chords, chordDefinitionOrComposit, parentElement, instrumentOptions, lowestPosition) {
  if (typeof chordDefinitionOrComposit.getChildren === "function") {
    var groupElement = createChordReferenceGroup(chordDefinitionOrComposit.getName(), parentElement);
    chordDefinitionOrComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
      addChordsRecursive(chords, chordDefinitionOrComposit2, groupElement, instrumentOptions, lowestPosition);
    });
    parentElement.appendChild(groupElement);
  } else {
    var chord = chords.shift();
    var nextChord = chords.length > 0 ? chords[0] : false;
    addChord(chord, parentElement, instrumentOptions, nextChord, lowestPosition);
  }
}

lib.addChordProgressionUsingChordDefinitionComposit = function(progression, chordDefinitionComposit, instrumentOptions, parentElement) {
  var chords = progression.getChords();
  var chordsCopy = chords.slice();
  parentElement = parentElement || chordSection;
  chordDefinitionComposit.getChildren().forEach(function(chordDefinitionOrComposit2) {
    addChordsRecursive(chords, chordDefinitionOrComposit2, parentElement, instrumentOptions, progression.getLowestPosition());
  });
}

function addBreak(section) {
  section = section || chordSection;
  section.appendChild(document.createElement("br"));
}
lib.addBreak = addBreak;
