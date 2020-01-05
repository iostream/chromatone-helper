var std4Voicing = "1 3 5 7";
var std6Voicing = "1 3 5 6";
module.exports.progressions = [
// [ scales, chords, optional voicing ]
  [["1 2 b3 4 5 6 b7", "1 2 b3 4 b5 5 6"], "6 2 4 5 1, 1* 2 4* 5 1*, 1", std4Voicing],
  [["1 2 3 #4 5 6 7"], "2 5 1 6 4 5 1", std4Voicing],
  [["1 b2 b3 4 b5 b6 b7", "1 2 3 4 5 6 b7"], "2 5 1 6, 4 5 1* 4, 5 1* 4  5, 1* 4", std6Voicing],
  [["1 b2 #3 b5 b6 6 b7"], "1 6 2 4 5 1", std4Voicing],
  [["1 b2 b3 3 4 5 b6"], "1 6 2 4 5 1", std4Voicing],
  [["1 2 3 4 5 6 7"], "2i2 5 1, 2 5 1", std6Voicing],
  [["1 2 3 4 5 6 7"], "4 5 4 5, 1 2 6 4 1", std4Voicing],
  [["1 2 3 4 5 6 7", "1 2 3 4 5 6 7"], "4 5 4 5, 1 2 6 4 1", std6Voicing],
  [["1 3 4 5 6"], "1 2 3 4 5, 4 3 2 1", std4Voicing],
  [["1 b2 b3 3 5 b6 b7", "1 2 3 4 5 6 b7"], "2Vb 5 1Va 6, 4 5Vb 1* 4, 5 1* 4Vb  5, 1* 4", "a: 1 3 5 7\nb: 6 8 11 13\n3 6 8 11"]
];

module.exports.voicings = [
  ["1 3 5 7"],
  ["1 2 5 7"],
  ["1 4 5 7"],
  ["1 4 7 9"],
  ["1 3 7 10 14"],
  ["3 7 8"]
];

module.exports.scales = [
// 7 note scales
  ["1 2 3  4 5 6  7"], // major
  ["1 2 3  4 5 b6 7"], // harmonic major
  ["1 2 b3 4 5 6  7"], // melodic minor
  ["1 2 b3 4 5 b6 7"], // harmonic minor
// 8 note scales
  ["1 2 3 4 5 b6 6 7"],
  ["1 b2 b3 3 4 b5 b6 b7"], // "by me"
// 5/6 note scales
  ["1 3   4 5 6"],
  ["1 2 3 b5 b6 b7"], // wholetone scale
  ["1 #2 3 5 #5 7"], // augmented scale
  ["1 b2 b3 4 5 b6"] // "by me"
];

module.exports.arpeggioPatterns = [
  [">*_"],// play all notes of voicing at once
  [">*"] // play all notes of the voicing after one another in order of the voicing
];

module.exports.rhythmPatterns = [
  ["8 8 8 8 8 8 8 8"], // 8 events
  ["6 6 6 6 6 6 q=3"], // 6 events in 3 beats/quarter notes = 6
  ["4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4"] // 16 events
];
