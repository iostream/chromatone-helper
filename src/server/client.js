var lib = {};
module.exports = lib;

const host = require("./host.js");

/**
 * Format:
 * many lines each containing of:
 * <iPosOut> <endTime> <pitch>
 */
function serializeProgressionForDAW(chordEvents, chords, scales, generatorUrl) {
  var result = generatorUrl + "\n";
  var chordIPosOut = 0;
  // for each chord definition...
  chordEvents.forEach(function(events) {
    // for each event...
    events.forEach(function(event) {
      var eventLengthInQN = event.getLengthInQN();
      if (!event.isRest()) {
        var pitchEndTime = chordIPosOut + eventLengthInQN;
        event.getPitches().forEach(function(note) {
          var pitch = note.getPosition();
          result += (chordIPosOut + " " + pitchEndTime + " " + pitch + "\n");
        });
      }

      chordIPosOut += eventLengthInQN;
    });
  });

  return result;
}

function upload(path, text) {
  var request = new XMLHttpRequest();
  var url = "http://" + host.hostName + ":" + host.hostPort + "/" + path;
  request.open("POST", url, false);

  request.onreadystatechange = function () {
    // check for 2xx status codes
    if (request.readyState === 4 && request.status >= 200 && request.status < 300) {
      console.log("Successfully sent upload to server: " + request.responseText);
    } else {
      console.error("Upload to " + url + " failed with status " + request.status + " and ready state " + request.readyState);
    }
  };
  request.send(text);
}

lib.uploadToDAW = function(events, chords, scales, generatorUrl) {
  var text = serializeProgressionForDAW(events, chords, scales, generatorUrl);
  if (!text) {
    console.error("Skipping DAW upload, because the serialization into the DAW format did not work.");
    return;
  }
  upload("daw", text);
}

lib.uploadMidi = function(midiAsBase64String) {
  var prefix = "data:audio/midi;base64,";
  if (midiAsBase64String.indexOf(prefix) !== 0) {
    console.error("Skipping MIDI upload, because of an unexpected input: " + midiAsBase64String);
    return;
  }
  var data = midiAsBase64String.substr(prefix.length);
  upload("midi", data);
};
