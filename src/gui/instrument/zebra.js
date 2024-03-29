var lib = {};
module.exports = lib;

var tLib = require("../../theory/base.js");

var zebraKeyboardTemplate = document.getElementById("templates").getElementsByClassName("zebra")[0];

lib.createZebraKeyboard = function(lowestPosition, highestPosition) {
  function isDisplacedButton(chromatic) {
    if (chromatic < 0) {
      chromatic += Math.ceil(Math.abs(chromatic) / 12) * 12;
    }
    var relativePosition = chromatic % 12;
    return relativePosition === 1 || relativePosition === 3 || relativePosition === 6
      || relativePosition === 8 || relativePosition === 10;
  }

  function createButton(chromatic) {
    var button = document.createElement("span");
    // c<chromaticPosition>
    button.className = "c" + chromatic;
    if (isDisplacedButton(chromatic)) {
      button.className += " d";
    }
    return button;
  }
  function createHalfButton(chromatic) {
    var button = createButton(chromatic);
    button.className += " half";
    return button;
  }
  function findNoteElement(note) {
    var absoluteChromatic = note.getPosition();
    // find buttons to light
    var query = "span.c" + absoluteChromatic;
    var noteEl = keyboard.querySelector(query);
    if (noteEl === null || typeof noteEl === "undefined") {
      return false;
    }
    return noteEl;
  }

  var keyboard = zebraKeyboardTemplate.cloneNode(true);
  var keyArea = keyboard.getElementsByClassName("keys")[0];
  var rowEl = document.createElement("div");
  var chromatic = lowestPosition;
  rowEl.className = "row";

  // if the button before the first button is displaced
  // or if the first button is displaced
  // then add one half button before the actual needed buttons
  if (isDisplacedButton(chromatic - 1) || isDisplacedButton(chromatic)) {
    rowEl.appendChild(createHalfButton(chromatic - 1));
  }
  while (chromatic <= highestPosition) {
    rowEl.appendChild(createButton(chromatic));
    chromatic += 1;
  }
  // if the button after the last button would be displaced
  // or the last button is displaced,
  // then add one half button at the end
  if (isDisplacedButton(chromatic) || isDisplacedButton(chromatic - 1)) {
    rowEl.appendChild(createHalfButton(chromatic));
  }
  keyArea.appendChild(rowEl);

  var debug = false;
  function construct(keyboard) {
    return {
      getElement: function() {
        return keyboard;
      },
      clear: function() {
        var button;
        var selectedButtons = keyboard.getElementsByClassName('selected');
        while (selectedButtons.length) {
          button = selectedButtons[0];
          button.title = '';
          button.innerHTML = '';
          button.classList.remove('selected');
          button.classList.remove('root');
        }
      },
      add: function(notes, description) {
        var notes = tLib.parseNotes(notes);
        if (debug) {
          console.log("ZebraKeyboard - Adding notes: ", notes.map(function(note){ return note.toString(); }));
        }

        // add each
        for (var i=0; i<notes.length; ++i) {
          var note = notes[i];
          var noteEl = findNoteElement(note);
          if (!noteEl) {
            console.error("Could not find button to light by note \"" + note.toString() + "\" using query " + query);
            continue;
          }
          // add label
          var name = note.findIntervalName();
          noteEl.setAttribute("title", name);
          var nameEl = document.createElement('p');
          nameEl.className = 'note-text';
          nameEl.textContent = name;
          noteEl.appendChild(nameEl);
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
            descriptionEl[0].textContent = description;
          }
        }
      },
      addDiff: function(notes) {
        // currently noop
      },
      highlightPitch: function(pitch) {
        var noteEl = findNoteElement(pitch);
        if (!noteEl) {
          // XXX skip this error to not flood the console...?!
          console.error("highlightPitch() - Could not find pitch: " + pitch.getPosition());
          return;
        }
        noteEl.classList.add('played');
      },
      dehighlightPitch: function(pitch) {
        var noteEl = findNoteElement(pitch);
        if (!noteEl) {
          // XXX skip this error to not flood the console...?!
          console.error("dehighlightPitch() - Could not find pitch: " + pitch.getPosition());
          return;
        }
        noteEl.classList.remove('played');
      },
      clone: function() {
        return construct(keyboard.cloneNode(true));
      }
    };
  }

  return construct(keyboard);
}
