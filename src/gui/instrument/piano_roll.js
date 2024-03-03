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
  var _scrollElement = _element.getElementsByClassName("scroll")[0];
  var _positionInQN = 0;
  var _highestPosition = highestPosition;
  var contentCanvas = _element.getElementsByClassName("content")[0];
  var _contentCtx = contentCanvas.getContext("2d");
  var pianoCanvas = _element.getElementsByClassName("piano")[0];
  var _pianoCtx = pianoCanvas.getContext("2d");
  var _styles = createStyles(_contentCtx);

  var lengthOfMeasureInQN = 4;

  // sizes
  var zebraWidth = 35;
  var zebraBlackKeyWidth = 27.5;
  var eightNoteWidth = 20.5;
  var semitoneHeight = 20 * 0.4;
  var thinLine = 0.5 ;
  var thickLine = 1;
  var headerHeight = 1.5 * semitoneHeight;

  var contentWidth = lengthInQN * 2 * eightNoteWidth;
  var contentHeight = headerHeight + (highestPosition - lowestPosition + 1) * semitoneHeight + 1;

  var scale = 1.5;
  contentCanvas.width = contentWidth * scale;
  contentCanvas.height = contentHeight * scale;
  _contentCtx.scale(scale, scale);
  pianoCanvas.width = zebraWidth * scale;
  pianoCanvas.height = contentCanvas.height;
  _pianoCtx.scale(scale, scale);

  drawPiano();
  drawContentPanel();

  function drawContentPanel() {
    var x = 0;
    var y = 0;

    // background
    _contentCtx.fillStyle = "white";
    _contentCtx.fillRect(0, headerHeight, contentWidth, contentHeight);

    y = headerHeight;
    _contentCtx.fillStyle = "lightgrey";
    _contentCtx.beginPath();
    for (var pos = highestPosition; pos >= lowestPosition; --pos) {
      // zebra keyboard
      var keyStyle = getKeyStyle(pos);
      if (keyStyle == 1) {
        _contentCtx.fillRect(x, y, contentWidth, semitoneHeight);
      }
      // horizontal line
      _contentCtx.moveTo(x, y);
      _contentCtx.lineTo(contentWidth, y);
      y += semitoneHeight;
    } 
    // horizontal line
    _contentCtx.moveTo(x, y);
    _contentCtx.lineTo(contentWidth, y);
    _contentCtx.stroke();

    _contentCtx.fillStyle = "black";

    // vertical lines
    var eighthCount = lengthInQN * 8;
    for (var eighth = 0; eighth < eighthCount; ++eighth) {
      x = eighth * eightNoteWidth;
      var startY = headerHeight;
      if (eighth % (lengthOfMeasureInQN * 2) === 0) {
        // longer vertical line at the beginning of a bar
        startY = 0;
      }

      if (eighth % 2 === 0) {
        _contentCtx.lineWidth = thickLine;
      } else {
        _contentCtx.lineWidth = thinLine;
      }
      _contentCtx.moveTo(x, startY);
      _contentCtx.lineTo(x, contentHeight);
    }
    _contentCtx.stroke();
  }

  function drawPiano() {
    // background
    _pianoCtx.fillStyle = "white";
    _pianoCtx.fillRect(0, headerHeight, zebraWidth, contentHeight);

    var x = 0;
    var y = 0;

    // border
    _pianoCtx.strokeRect(0.5, headerHeight, zebraWidth - 1, contentHeight - headerHeight - 1);

    // zebra keyboard
    y = headerHeight;
    for (var pos = highestPosition; pos >= lowestPosition; --pos) {
      // zebra keyboard
      var keyStyle = getKeyStyle(pos);
      if (keyStyle == 0) {
        _pianoCtx.beginPath();
        _pianoCtx.moveTo(x, y)
        _pianoCtx.lineTo(zebraWidth, y);
        _pianoCtx.stroke();
      } else if (keyStyle == 1) {
        _pianoCtx.beginPath();
        _pianoCtx.moveTo(zebraBlackKeyWidth, y + (semitoneHeight / 2));
        _pianoCtx.lineTo(zebraWidth, y + (semitoneHeight / 2));
        _pianoCtx.stroke();
        _pianoCtx.fillStyle = "black";
        _pianoCtx.fillRect(x, y, zebraBlackKeyWidth, semitoneHeight);
      }
      y += semitoneHeight;
    }
  }

  function drawEvent(arpEvent, quarterNotePosition, highlight) {
    if (!arpEvent.isRest()) {
      var x = quarterNotePosition * 2 * eightNoteWidth;
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
      if ((x + width) * scale > _scrollElement.scrollLeft + _scrollElement.clientWidth) {
        var newScrollLeft = x * scale;
        var maxScrollLeft = _scrollElement.scrollWidth - _scrollElement.clientWidth;
        _scrollElement.scrollLeft = (newScrollLeft > maxScrollLeft) ? maxScrollLeft : newScrollLeft;
      } else if (x * scale < _scrollElement.scrollLeft) {
        _scrollElement.scrollLeft = 0;
      }
    }
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
  var radii = 5;

  return {
    event: {
      normal: function(x, y, width, height) {
        _ctx.strokeStyle = 'black';
        _ctx.fillStyle = 'blue';
        _ctx.beginPath(); 
        _ctx.roundRect(x, y, width, height, radii);
        _ctx.fill();
        _ctx.stroke();
      },
      highlighted: function(x, y, width, height) {
        var grad1 = context.createLinearGradient(x, y, x + width, y);
        grad1.addColorStop(0, 'orange');
        grad1.addColorStop(1, 'red');
        _ctx.strokeStyle = 'black';
        _ctx.fillStyle = grad1;
        _ctx.beginPath();
        _ctx.roundRect(x, y, width, height, radii);
        _ctx.fill();
        _ctx.stroke();
      },
      text: function(x, y, text) {
        _ctx.fillStyle = 'black';
        _ctx.fillText(text, x, y);
      }
    }
  }
}
