var lib = {};
module.exports = lib;

var tLib = require("../../theory/base.js");

var pianoRollTemplate = document.getElementById("templates").getElementsByClassName("piano-roll")[0];

lib.createPianoRoll = function(lowestPosition, highestPosition, lengthInQN) {
  var parentElement = pianoRollTemplate.cloneNode(true);
  return construct(parentElement, lowestPosition, highestPosition, lengthInQN);
}

function construct(element, lowestPosition, highestPosition, lengthInQN) {
  var _element = element;
  var _positionInQN = 0;
  var _highestPosition = highestPosition;
  var canvas = _element.getElementsByTagName("canvas")[0];
  var _ctx = canvas.getContext("2d");
  var _styles = createStyles(_ctx);

  var lengthOfMeasureInQN = 4;

  // sizes
  var zebraWidth = 35.5;
  var zebraBlackKeyWidth = 27.5;
  var eightNoteWidth = 20;
  var semitoneHeight = 20 * 0.4;
  var thinLine = 0.5;
  var thickLine = 1;
  var headerHeight = 1.5 * semitoneHeight;

  var width = zebraWidth + lengthInQN * 2 * eightNoteWidth;
  var height = headerHeight + (highestPosition - lowestPosition + 1) * semitoneHeight + 1;

  var scale = 1.5;
  canvas.width = width * scale;
  canvas.height = height * scale;
  _ctx.scale(scale, scale);

  var x = 0;
  var y = 0;

  // background
  _ctx.fillStyle = "white";
  _ctx.fillRect(0, headerHeight, width, height);

  // horizontal lines and zebra keyboard
  drawLine(x, headerHeight, x, height);
  drawLine(x, headerHeight, zebraWidth, headerHeight);
  drawLine(x, height, zebraWidth, height)
  y = headerHeight;
  _ctx.fillStyle = "lightgrey";
  for (var pos = highestPosition; pos >= lowestPosition; --pos) {
    // zebra keyboard
    var keyStyle = getKeyStyle(pos);
    if (keyStyle == 0) {
      drawLine(x, y, zebraWidth, y);
    } else if (keyStyle == 1) {
      drawLine(zebraBlackKeyWidth, y + (semitoneHeight / 2), zebraWidth, y + (semitoneHeight / 2));
      _ctx.fillRect(zebraWidth, y, width, semitoneHeight);
      _ctx.fillStyle = "black";
      _ctx.fillRect(x, y, zebraBlackKeyWidth, semitoneHeight);
      _ctx.fillStyle = "lightgrey";
    }
    // horizontal line
    drawLine(zebraWidth, y, width, y);
    y += semitoneHeight;
  }
  // horizontal line
  drawLine(x, y, width, y);

  _ctx.fillStyle = "black";

  // vertical lines
  var eighthCount = lengthInQN * 8;
  for (var eighth = 0; eighth < eighthCount; ++eighth) {
    x = zebraWidth + eighth * eightNoteWidth;
    var startY = headerHeight;
    if (eighth % (lengthOfMeasureInQN * 2) === 0) {
      // longer vertical line at the beginning of a bar
      startY = 0;
    }

    if (eighth % 2 === 0) {
      _ctx.lineWidth = thickLine;
    } else {
      _ctx.lineWidth = thinLine;
    }
    drawLine(x, startY, x, height);
  }

  function drawEvent(arpEvent, quarterNotePosition, highlight) {
    if (!arpEvent.isRest()) {
      var x = zebraWidth + quarterNotePosition * 2 * eightNoteWidth;
      var width = arpEvent.getLengthInQN() * 2 * eightNoteWidth;

      arpEvent.getPitches().forEach(function(pitch) {
        var y = headerHeight + (_highestPosition - pitch.getPosition()) * semitoneHeight;
        if (highlight) {
          _styles.event.highlighted(x, y, width, semitoneHeight);
        } else {
          _styles.event.normal(x, y, width, semitoneHeight);
        }
        // TODO add naming
        // _styles.event.text(x, y + semitoneHeight, pitch.);
      });
      // auto scroll/paging:
      if ((x + width) * scale > _element.scrollLeft + _element.clientWidth) {
        var newScrollLeft = x * scale;
        var maxScrollLeft = element.scrollWidth - element.clientWidth;
        _element.scrollLeft = (newScrollLeft > maxScrollLeft) ? maxScrollLeft : newScrollLeft;
      } else if (x * scale < _element.scrollLeft) {
        _element.scrollLeft = 0;
      }
    }
  }

  function drawLine(startX, startY, endX, endY) {
    _ctx.beginPath();
    _ctx.moveTo(startX, startY);
    _ctx.lineTo(endX, endY);
    _ctx.stroke();
  }

  return {
    getElement: function() {
      return _element;
    },
    addEvent: function(arpEvent, description) {
      drawEvent(arpEvent, _positionInQN);
      _positionInQN += arpEvent.getLengthInQN();
    },
    highlightEvent: function(arpEvent, quarterNotes) {
      drawEvent(arpEvent, quarterNotes, true);
    },
    dehighlightEvent: function(arpEvent, quarterNotes) {
      drawEvent(arpEvent, quarterNotes);
    },
    addDiff: function(notes) {
      // noop
    },
    clone: function() {
      return construct(keyboard.cloneNode(true));
    }
  };
}

function getKeyStyle(chromatic) {
  if (chromatic < 0) {
    chromatic += Math.ceil(Math.abs(chromatic) / 12) * 12;
  }
  var relativePosition = chromatic % 12;
  switch (relativePosition) {
    case 4: // fallthrough
    case 11:
      return 0;
    case 1: // fallthrough
    case 3: // fallthrough
    case 6: // fallthrough
    case 8: // fallthrough
    case 10:
      return 1;
    case 0: // fallthrough
    case 2: // fallthrough
    case 5: // fallthrough
    case 7: // fallthrough
    case 9:
      return 2;
    default:
      console.error("No key style found for chromatic position: " + chromatic);
      return 0;
  }
}

function createStyles(context) {
  var _ctx = context;
  return {
    event: {
      normal: function(x, y, width, height) {
        _ctx.strokeStyle = 'black';
        _ctx.fillStyle = 'blue';
        _ctx.fillRect(x, y, width, height);
        _ctx.strokeRect(x, y, width, height);
      },
      highlighted: function(x, y, width, height) {
        var grad1 = context.createLinearGradient(x, y, x + width, y);
        grad1.addColorStop(0, 'orange');
        grad1.addColorStop(1, 'red');
        _ctx.strokeStyle = 'green';
        _ctx.fillStyle = grad1;
        _ctx.fillRect(x, y, width, height);
        _ctx.strokeRect(x, y, width, height);
      }
    }
  }
}
