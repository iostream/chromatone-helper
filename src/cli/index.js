var service = require("../service.js");

/**
 * Example call:
 * node index.js --scales="1 2 3 4 5 6 7, 1 2 3 4 5" --chords="2 5 1" --voicings="1 3 5 6" --chromaticRoot=0
 */

var params = parseCliArguments(process.argv);
var generatedBy = process.argv.join(" ");
var midiWriter = service.generateMidi(params.scales, params.chords, params.voicings, params.chromaticRoot, generatedBy);
midiWriter.stdout();

function parseCliArguments(argv) {
  var parsedArguments = {
    // supply defaults...
    fileName: "output.midi",
    scales: "1 2", // TODO if there is not at least a scale with two notes, often an error occurs...
    chords: "",
    voicings: "",
    chromaticRoot: 0
  };
  argv.forEach(function(cliParameter) {
    var splitPoint = cliParameter.indexOf("=");
    if (cliParameter.length < 3 || splitPoint === -1) {
      return;
    }
    var key = cliParameter.substr(0, splitPoint).substr(2);
    var value = cliParameter.substr(splitPoint + 1);

    parsedArguments[key] = value;
  });

  parsedArguments.scales = parsedArguments.scales.split(",");
  parsedArguments.chromaticRoot = parseInt(parsedArguments.chromaticRoot);

  return parsedArguments;
}
