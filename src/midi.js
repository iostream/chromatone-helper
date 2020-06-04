var lib = {};
module.exports = lib;

function buildScalesDescription(scales) {
  return scales.map(function(scale, i) {
    return "*".repeat(i) + ": " + scale.toString();
  }).join("\n");
}

/**
 * @see https://github.com/grimmdude/MidiWriterJS
 *
 * @return MidiWriter object
 */
lib.createMidi = function(chordEvents, chords, scales, generatorUrl) {
  var MidiWriter = require("midi-writer-js");

  // Start with a new track
  var track = new MidiWriter.Track();

  track.setTempo(140);
  track.addTrackName(buildScalesDescription(scales) + " Generated via: " + generatorUrl);

  var restingTime = 0;
  chordEvents.forEach(function(events) {
    events.forEach(function(event) {
      // Tn : where n is an explicit number of ticks (T128 = 1 beat)
      var eventDuration = "T" + event.getLengthInQN() * 128;
      if (event.isRest()) {
        restingTime += event.getLengthInQN();
      } else {
        var pitches = event.getPitches().map(function(note) {
          return note.getPosition();
        });
        var noteData = {pitch: pitches, duration: eventDuration};
        if (restingTime > 0) {
          // Tn : where n is an explicit number of ticks (T128 = 1 beat)
          noteData.wait = "T" + restingTime * 128;
          restingTime = 0;
        }
        track.addEvent(new MidiWriter.NoteEvent(noteData));
      }
      // TODO can we bring back chord names in MIDI export?
      // track.addMarker(chord.getName());
    });
  });

  var writer = new MidiWriter.Writer([track]);
  return writer;
}
