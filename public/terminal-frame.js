// This document always runs in an opaque sandbox. Never grant allow-same-origin.
window.addEventListener("message", function start(event) {
  if (event.source !== parent || event.data?.channel !== "cq-terminal-start" || typeof event.data.doc !== "string" || event.data.doc.length > 600000) return;
  window.removeEventListener("message", start);
  document.open();
  document.write(event.data.doc);
  document.close();
});
