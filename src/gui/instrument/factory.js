var lib = {};
module.exports = lib;

var keyboard = require("./keyboard.js");
var zebra = require("./zebra.js");
var stringInstrument = require("./string_instrument.js");
// var pianoRollLib = require("./piano_roll.js");

lib.createInstrumentFactory = function(options) {
  var type = options.type || 'chromatic';

  switch(type) {
    case 'chromatic':
      return {
        create: function(lowestPosition, highestPosition) {
          return keyboard.createKeyboard(lowestPosition, highestPosition, 4);
        }
      };
      break;
    case 'zebra':
      return {
        create: function(lowestPosition, highestPosition) {
          return zebra.createZebraKeyboard(lowestPosition, highestPosition);
        }
      };
      break;
    // case 'piano_roll':
    //   return {
    //     create: function(lowestPosition, highestPosition) {
    //       return pianoRollLib.createPianoRoll(lowestPosition, highestPosition);
    //     }
    //   };
    //   break;
    default:
      return {
        create: function(lowestPosition, highestPosition) {
          var instrument = stringInstrument.createStringInstrumentByType(type);
          if (!instrument) {
            console.error("create() - Unknown instrument type: " + type);
            return;
          }
          return instrument;
        }
      };
      break;
  }
}
