var lib = {};
module.exports = lib;

var tLib = require("../theory/base.js");

var chromaticKeyboardTemplate = document.getElementById("templates").getElementsByClassName("chromatic")[0];

function createChromaticKeyboard(lowestPosition, highestPosition, rowCount) {
  var keyboard = chromaticKeyboardTemplate.cloneNode(true);
  var keyArea = keyboard.getElementsByClassName("keys")[0];

  var rowIteration = 0;
  var baseRowColumnCount = Math.ceil((highestPosition - lowestPosition) / 2 + 1);
  for (var row = 0; row < rowCount; ++row) {
    // the first shall never be a cross row (because of the cut out parts there)
    var isCrossRow = !!(row % 2);
    var rowEl = document.createElement("div");
    var chromatic = lowestPosition;
    // e.g. class="row x i1" -> second iteration of cross rows
    if (isCrossRow) {
      rowEl.className = "row i" + Math.floor(rowIteration) + " x";
      chromatic += 1;
    } else {
      rowEl.className = "row i" + Math.floor(rowIteration);
    }
    var rowColumnCount = baseRowColumnCount;
    if (isCrossRow) {
      rowColumnCount -= 1;
    }
    for (var column = 0; column < rowColumnCount; ++column) {
      var button = document.createElement("span");
      // c<chromaticPosition>
      // r<row>
      button.className = "c" + chromatic;
      rowEl.appendChild(button);
      chromatic += 2;
    }

    keyArea.insertBefore(rowEl, keyArea.firstChild);

    rowIteration += 0.5;
  }

  var debug = false;
  function construct(keyboard) {
    return {
      getElement: function() {
        return keyboard;
      },
      add: function(notes, description) {
        var notes = tLib.parseNotes(notes);
        if (debug) {
          console.log("ChromaticKeyboard - Adding notes: ", notes.map(function(note){ return note.toString(); }));
        }

        // add each
        var firstNoteIsOnCrossRow = notes.length > 0 && (notes[0].getPosition() % 2) === 1;
        for (var i=0; i<notes.length; ++i) {
          var note = notes[i];
          var absoluteChromatic = note.getPosition();
          var iteration = note.isUp() ? 1 : 0;
          if (i !== 0 && firstNoteIsOnCrossRow && (absoluteChromatic % 2) === 0) {
            ++iteration;
          }

          // find buttons to light
          var query = ".row.i" + iteration + " span.c" + absoluteChromatic;
          var noteEl = keyboard.querySelector(query);
          if (noteEl === null || typeof noteEl === "undefined") {
            console.error("Could not find button to light by note \"" + note.toString() + "\" using query " + query);
            continue;
          }
          // add label
          noteEl.innerHTML = '<div class="note-text">' + note.findIntervalName() + "</div>";
          noteEl.classList.add("selected");
          // mark root
          if (note.isRoot()) {
            noteEl.classList.add("root");
          }
        }

        // add description
        if (typeof description !== "undefined") {
          var descriptionEl = keyboard.getElementsByClassName("description");
          if (descriptionEl.length > 0) {
            descriptionEl[0].innerHTML = description;
          }
        }
      },
      addDiff: function(notes) {
        notes = tLib.parseNotes(notes);
        // get all selected notes
        var noteEls = keyboard.getElementsByClassName("selected");
        // query their positions and wrap them each together with their position in an array
        var noteArrays = [];
        for (var i=0; i<noteEls.length; ++i) {
          noteArrays.push([noteEls[i], parseInt(noteEls[i].className.substring(1))]);
        }
        // order them
        noteArrays.sort(function(a, b) { return b[1] - a[1]; });
        // add the diffs
        for (var i=0; i<notes.length; ++i) {
          var el = noteArrays.pop();
          if (!el) {
            console.error("addDiff() - Missing note on keyboard for note " + notes[i].toString());
            continue;
          }
          var diff = notes[i].getPosition() - el[1];
          // do not mark no differences ... yet
          if (diff === 0) {
            continue;
          }
          // use half notes, because smaller numbers are faster to comprehend
          var text = diff / 2;
          // build and append dom element
          var diffEl = document.createElement("div");
          diffEl.className = "diff";
          diffEl.appendChild(document.createTextNode(text));
          el[0].appendChild(diffEl);
        }
      },
      clone: function() {
        return construct(keyboard.cloneNode(true));
      }
    };
  }

  return construct(keyboard);
}
lib.createKeyboard = createChromaticKeyboard;
