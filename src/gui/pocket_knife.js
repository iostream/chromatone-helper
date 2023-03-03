var lib = {};
module.exports = lib;

lib.initPocketKnife = function(form) {
  form.pocket_knife.addEventListener("change", function() {
    var value = form.pocket_knife.value;
    if (handleUrlAction(value)) {
      return;
    }
    console.error("Unknown pocket knife value: " + value);
  });
}

function handleUrlAction(value) {
  var newUrlBase;
  switch (value) {
    case 'localhost':
      newUrlBase = 'http://localhost:3042/';
      break;
    case 'www':
      newUrlBase = 'https://iostream.github.io/chromatone-helper/multi-track-sequencer/';
      break;
    case 'file':
      newUrlBase = 'file:///home/iostream/chromatone-helper/chromatone-helper/chromatone-index.html';
      break;
    default:
      return false;
  }
  var url = new URL(document.location.href);
  var newUrl = newUrlBase + url.hash;
  if (value === 'file') {
    alert(newUrl);
    return;
  }
  document.location.href = newUrl;
}
