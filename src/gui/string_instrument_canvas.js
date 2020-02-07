var lib = {};
module.exports = lib;

var notesLib = require("../theory/notes.js");

var stringInstrumentTemplate = document.getElementById("templates").getElementsByClassName("string-instrument-canvas")[0];

var types = {
  // name: [stringBaseNotes, stringGauges, fretCount, scaleLength, nutWidth]
  guitar: [notesLib.parseNotes('15 12 b10 b7 4 1 E2'), [.01, .0135, .017, .026, .036, .048], 17, 25.5, 3], // guitar bar chord voicing: 1 5 8 10 12 (but better use drop voicing -> using octaves in arp pattern)
  bass_guitar: [notesLib.parseNotes('b10 b7 4 1 E1'), [.045, .06, .08, .1], 17, 34, 3],
  concert_ukulele: [notesLib.parseNotes('10 6 4 8 G4'), [.022, .026, .029, .024], 11, 23, 3],
};


/**
 * Returns false if the type is unknown.
 */
lib.createStringInstrumentByType = function(typeName) {
  if (types.hasOwnProperty(typeName)) {
    return lib.createStringInstrument.apply(null, types[typeName]);
  }
  return false;
};

// for finetuning the sizes
var UI_SCALE = 35;

var FRET_THICKNESS = .1 * UI_SCALE;
var NUT_THICKNESS = .2 * UI_SCALE;

//
var MARGIN = 0.5 * UI_SCALE;

var STYLE_SELECTED_PITCH = {
  height: (20/35) * UI_SCALE,
  color: "black",
  getFont: function() { return this.height + "px serif"},
  background: { type: "arc", color: "orange"}
};

var STYLE_ROOT_PITCH = {
  height: (20/35) * UI_SCALE,
  color: "black",
  getFont: function() { return this.height + "px serif"},
  background: { type: "arc", color: "yellow"}
};

var debug = false;
/**
 * An array of pitches/notes provide the base pitches (object.getPosition())
 * of the strings. One note per pitch. .g. bass would be 1 4 b7 b10.
 *
 * Each string has also a gauge/thickness (in inch) which is just for better immersion.
 */
lib.createStringInstrument = function(stringBaseNotes, stringGauges, fretCount, scaleLength, nutWidth) {
  var _stringPitches = stringBaseNotes;
  var _container = stringInstrumentTemplate.cloneNode(true);
  var _canvas = _container.getElementsByTagName('canvas')[0];
  var _fretCount = fretCount;
  var _fretDistancesToNut = [];

  scaleLength *= UI_SCALE;
  nutWidth *= UI_SCALE;

  // index 0 is the nut (= 0) and 1 is fret one, 2 fret 2, etc...
  // this way it corresponds with the string positions (0=open string,
  // 1=first fret used, 2=second fret used, etc.)
  for (var i = 0; i < _fretCount + 1; ++i) {
    _fretDistancesToNut.push(calculateFretDistanceToNut(i, fretCount, scaleLength));
  }

  var _canvasWidth = 2 + _fretDistancesToNut[fretCount];

  _canvas.height = MARGIN * 2 + nutWidth;
  _canvas.width = _canvasWidth;

  var ctx = _canvas.getContext('2d');
  var nutYStart = MARGIN;
  var nutYEnd = MARGIN + nutWidth;
  // draw the nut
  drawLine(ctx, 0, nutYStart, 0, nutYEnd);
  // draw the frets
  for (var i = 1; i <= fretCount; ++i) {
    var distance = _fretDistancesToNut[i];
    drawLine(ctx, distance, nutYStart, distance, nutYEnd);
  }

  // draw the strings....

  // distance from string to the edge of the fret board
  var _stringRoom = (nutWidth / stringGauges.length) * 0.25;
  // distance from one string to another string
  var _stringDistance = (nutWidth - _stringRoom * 2) / (stringGauges.length - 1);

  var stringY = MARGIN + _stringRoom;
  for (var string = 0; string < stringGauges.length; ++string) {
    drawLine(ctx, 0, stringY, _canvasWidth, stringY);
    stringY = stringY + _stringDistance;
  }

  return {
    getElement: function() {
      return _container;
    },
    add: function(notes, description, options) {
      var notes = notesLib.parseNotes(notes);
      if (debug) {
        console.log("StringInstrument - Adding notes: ", notes.map(function(note){ return note.toString(); }));
      }

      // add description
      if (typeof description !== "undefined") {
        var descriptionEl = _container.getElementsByClassName("description");
        if (descriptionEl.length > 0) {
          descriptionEl[0].innerHTML = description;
        }
      }

      // highlight each pitch which actually exists on the board while also
      // highlighting the pitches which are in a different register
      // (this is brute force, but works for all kinds of fretted string instruments with constant fret count (no banjo))
      _stringPitches.forEach(function(stringPitch, stringIndex) {
        var relativeStringPosition = stringPitch.getPosition() % 12;
        var selected = {};
        notes.forEach(function(pitchToAdd) {
          var position = pitchToAdd.getPosition();
          // check for all registers
          var stringRegister = -1;
          var relativePosition = position % 12;
          for (;;) {
            stringRegister += 1;
            positionOnString = (relativePosition - relativeStringPosition) + stringRegister * 12;
            if (positionOnString < 0) {
              continue;
            }
            if (_fretCount <= positionOnString) {
              break;
            }

            var isDifferentRegister = position !== stringPitch.getPosition() + positionOnString;
            if (options.all_registers || !isDifferentRegister) {
              var isSelected = selected.hasOwnProperty(positionOnString);
              if (isDifferentRegister && isSelected && !options.all_intervalls) {
                // do nothing, if this is a different register and the note is already
                // marked and all intervals shall not be shown
                continue;
              }
              var stringY = MARGIN + _stringRoom + _stringDistance * stringIndex;
              markNoteElement(ctx, positionOnString, stringY, pitchToAdd, isDifferentRegister, options.all_intervals, isSelected);
              selected[positionOnString] = true;
            }
          }
        });
      });
      // also mark notes which are in different registers....
    },
    addDiff: function(notes) {
      // noop
    },
    clone: function() {
      console.error("StringInstrument.clone() is not implemented");
      // TODO return construct(keyboard.cloneNode(true));
    }
  };

  function markNoteElement(ctx, fretIndex, stringY, note, isDifferentRegister, allIntervals, selected) {
    // add label
    var name = note.findIntervalName();
    if (isDifferentRegister) {
      name = '(' + name + ')';
    }

    if (selected && allIntervals) {
      // append to existing name
      var existingName = noteEl.getAttribute("title");
      name = existingName + "/" + name;
    }

    // ctx.fillText(name, _fretDistancesToNut[fretIndex] + (_fretDistancesToNut[fretIndex + 1] - _fretDistancesToNut[fretIndex]) / 2, stringY);

    var textStyle = note.isRoot() ? STYLE_ROOT_PITCH : STYLE_SELECTED_PITCH;
    var startX = _fretDistancesToNut[fretIndex];
    var startY = stringY - textStyle.height;
    var endX = _fretDistancesToNut[fretIndex + 1];
    var endY = stringY + textStyle.height;
    drawText(ctx, name, textStyle, startX, startY, endX, endY);


    /*noteEl.setAttribute("title", name);
    noteEl.innerHTML = '<span class="note-text">' + name + "</span>";
    noteEl.classList.add("selected");*/

    // mark root
    /*if (note.isRoot()) {
      noteEl.classList.add("root");
    }*/
  }
}

function drawLine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawText(ctx, text, textStyle, startX, startY, endX, endY) {
  ctx.font = typeof(textStyle.getFont) === 'function' ? textStyle.getFont() : '10px serif';
  var textWidth = ctx.measureText(text).width;
  var height = endY - startY;
  var width = endX - startX;
  if (textStyle.background) {
    if (textStyle.background.type === 'arc') {
      ctx.beginPath();
      ctx.fillStyle = textStyle.background.color;
      var halfWidthPos = startX + width / 2;
      var halfHeightPos = startY + height / 2;
      var radius = textWidth / 2;
      var radius2 = textStyle.height / 2;
      // ctx.arc(halfWidthPos, halfHeightPos, Math.max(textWidth, textStyle.height) / 2, 0, 2 * Math.PI);
      ctx.ellipse(halfWidthPos, halfHeightPos, radius, radius2, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  ctx.strokeStyle = ctx.fillStyle = textStyle.color || 'black';

  var x = startX + width / 2 - textWidth / 2;
  var y = startY + height / 2 + textStyle.height / 2;
  ctx.fillText(text, x, y);

}


function calculateFretDistanceToNut(fretIndex, fretCount, scaleLength) {
  return scaleLength - (scaleLength / Math.pow(2, (fretIndex / 12)));
}

function createString() {
  var el = document.createElement("p");
  return el;
}

var markingsPerFret = {
  // fret index => count of markings
  0: 2, 3: 1, 5: 1, 7: 1, 9: 1
};
