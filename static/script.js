/*
  LiveHTML Pro - Flask Edition
  Poora logic client-side JS me hai (koi backend API call nahi).
  Features: Upload, Live Preview, Write typing animation, Console tab, Status bar.
  Mobile par Code aur Preview alag-alag sub-tabs se switch hote hain (stack nahi karte),
  taaki chhoti screen par scroll na karna pade.
*/

// ---------- Sample starter code ----------
const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello, Developer!</h1>
  <p>Upload apni HTML file ya "Write" dabakar dekhein.</p>
</body>
</html>`;

// ---------- CodeMirror setup ----------
const editor = CodeMirror(document.getElementById("editorHost"), {
  value: "",
  mode: "htmlmixed",
  theme: "material-darker",
  lineNumbers: true,
  matchBrackets: true,
  autofocus: false,
  lineWrapping: false,
  extraKeys: { "Ctrl-F": "findPersistent", "Cmd-F": "findPersistent" }
});

let hasFile = false;
let writing = false;
let writeAbort = false;

// ---------- Elements ----------
const emptyState = document.getElementById("emptyState");
const previewFrame = document.getElementById("previewFrame");
const consoleLog = document.getElementById("consoleLog");
const writeBanner = document.getElementById("writeBanner");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const editorPaneEl = document.getElementById("dropZone");
const previewPaneEl = document.getElementById("previewPane");
const toolbar = document.getElementById("toolbar");
const btnMenu = document.getElementById("btnMenu");
const typingModeBar = document.getElementById("typingModeBar");
const typingProgress = document.getElementById("typingProgress");
const btnStopTyping = document.getElementById("btnStopTyping");
const typeCapture = document.getElementById("typeCapture");
const btnExitZoom = document.getElementById("btnExitZoom");

// ---------- Console helper ----------
function logConsole(message, isError = false) {
  const time = new Date().toLocaleTimeString("en-IN", { hour12: false });
  const line = document.createElement("div");
  line.className = "line" + (isError ? " err" : "");
  line.innerHTML = `<span class="time">[${time}]</span>${message}`;
  consoleLog.appendChild(line);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

// ---------- Live preview update ----------
function updatePreview() {
  previewFrame.srcdoc = editor.getValue();
}

// ---------- Status bar update ----------
function updateStatus() {
  const code = editor.getValue();
  const cursor = editor.getCursor();
  document.getElementById("statCursor").textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
  document.getElementById("statChars").textContent = `${code.length} Chars`;
  document.getElementById("statWords").textContent = `${(code.match(/\S+/g) || []).length} Words`;
  document.getElementById("statLines").textContent = `${editor.lineCount()} Lines`;
}

editor.on("change", () => {
  updatePreview();
  updateStatus();
});
editor.on("cursorActivity", updateStatus);

// ---------- Show / hide empty state ----------
function setHasFile(value) {
  hasFile = value;
  emptyState.classList.toggle("hidden", value);
}

// ---------- Tabs (Code / Preview / Console) ----------
// "code" aur "preview" dono asal me panel-code hi dikhate hain (desktop par side-by-side
// already visible hote hain); mobile par hum bata dete hain kaunsa pane full-width dikhana hai.
function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));

  const showPanel = tabName === "console" ? "console" : "code";
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(`panel-${showPanel}`).classList.add("active");

  editorPaneEl.classList.toggle("mobile-active", tabName !== "preview");
  previewPaneEl.classList.toggle("mobile-active", tabName === "preview");

  if (tabName === "preview" || tabName === "code") {
    // CodeMirror ko refresh karna zaroori hai jab hidden se visible hota hai
    setTimeout(() => editor.refresh(), 50);
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

// ---------- Mobile toolbar toggle ----------
if (btnMenu) {
  btnMenu.addEventListener("click", () => {
    toolbar.classList.toggle("open");
  });
}

// ---------- File upload (button + drag-drop) ----------
function loadFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
    logConsole("Galat file type! Sirf .html file upload karein.", true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    editor.setValue(e.target.result);
    setHasFile(true);
    updatePreview();
    updateStatus();
    logConsole(`File "${file.name}" successfully load ho gayi.`);
  };
  reader.readAsText(file);
}

document.getElementById("btnUpload").addEventListener("click", () => fileInput.click());
document.getElementById("btnUploadCenter").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

["dragover", "dragenter"].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  })
);
dropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  loadFile(file);
});

// ---------- Toolbar actions ----------
document.getElementById("btnRun").addEventListener("click", () => {
  updatePreview();
  logConsole("Preview re-run ki gayi.");
});

document.getElementById("btnRefresh").addEventListener("click", () => {
  previewFrame.srcdoc = "";
  setTimeout(updatePreview, 50);
  logConsole("Live preview refresh ki gayi.");
});

document.getElementById("btnCopy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.getValue());
  logConsole("Code clipboard me copy ho gaya.");
});

document.getElementById("btnDownload").addEventListener("click", () => {
  const blob = new Blob([editor.getValue()], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "index.html";
  a.click();
  logConsole("File download shuru ho gayi.");
});

document.getElementById("btnFullscreen").addEventListener("click", () => {
  const preview = document.querySelector(".preview-pane");
  if (!document.fullscreenElement) {
    preview.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

document.getElementById("btnClearConsole").addEventListener("click", () => {
  consoleLog.innerHTML = "";
});

// ---------- Preview auto-zoom jab typing complete ho jaye ----------
function zoomPreviewIn() {
  activateTab("preview");
  previewPaneEl.classList.add("zoomed");
  btnExitZoom.classList.remove("hidden");
}
function zoomPreviewOut() {
  previewPaneEl.classList.remove("zoomed");
  btnExitZoom.classList.add("hidden");
}
btnExitZoom.addEventListener("click", zoomPreviewOut);

// ---------- Write button: REAL keyboard se typing reveal ----------
// Yahan koi fake/auto animation nahi hai. Click karte hi hidden input ko turant
// (bina kisi await/delay ke) focus kiya jata hai taaki mobile/desktop ka asli
// OS keyboard khule. Fir aap jo bhi real key dabayenge, utne hi naye characters
// upload ki gayi code se reveal hoke editor me aayenge.
let sourceCode = "";
let revealedCount = 0;
let typingModeActive = false;

function updateTypingProgress() {
  typingProgress.textContent = `${revealedCount} / ${sourceCode.length}`;
}

function revealChars(count) {
  if (count <= 0) return;
  const next = sourceCode.slice(revealedCount, revealedCount + count);
  if (!next) return;
  editor.replaceRange(next, { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length });
  editor.scrollIntoView({ line: editor.lastLine(), ch: 0 });
  revealedCount += next.length;
  updatePreview();
  updateStatus();
  updateTypingProgress();

  if (revealedCount >= sourceCode.length) {
    finishTypingMode();
  }
}

function startTypingMode() {
  if (typingModeActive) return;
  sourceCode = hasFile ? editor.getValue() : SAMPLE_HTML;
  if (!sourceCode) {
    logConsole("Pehle koi HTML file upload karein.", true);
    return;
  }

  // IMPORTANT: focus() sabse pehle, synchronously call hota hai (koi await/setTimeout
  // se pehle nahi), warna iOS Safari par asli keyboard nahi khulega.
  typeCapture.value = "";
  typeCapture.focus();

  typingModeActive = true;
  revealedCount = 0;
  setHasFile(true);
  editor.setValue("");
  previewFrame.srcdoc = "";
  updateTypingProgress();

  typingModeBar.classList.remove("hidden");
  activateTab("code");
  logConsole("Typing mode shuru: apne keyboard se type karke code reveal karein.");
}

function stopTypingMode(revealRest) {
  if (!typingModeActive) return;
  typingModeActive = false;
  typingModeBar.classList.add("hidden");
  typeCapture.blur();
  typeCapture.value = "";

  if (revealRest && revealedCount < sourceCode.length) {
    revealChars(sourceCode.length - revealedCount);
    return;
  }
  logConsole("Typing mode rok diya gaya.");
}

function finishTypingMode() {
  typingModeActive = false;
  typingModeBar.classList.add("hidden");
  typeCapture.blur();
  typeCapture.value = "";
  logConsole("Write process complete ho gayi.");
  zoomPreviewIn();
}

typeCapture.addEventListener("input", () => {
  if (!typingModeActive) return;
  const delta = typeCapture.value.length;
  if (delta > 0) {
    revealChars(delta);
  }
  // Capture ko reset karte hain taaki agli keystroke bhi delta ki tarah gine
  typeCapture.value = "";
});

// Backspace ya doosri special keys se bhi capture khaali na rah jaye, isliye
// keydown par bhi ek chhota sa fallback check.
typeCapture.addEventListener("keydown", (e) => {
  if (!typingModeActive) return;
  if (e.key === "Escape") {
    stopTypingMode(false);
  }
});

btnStopTyping.addEventListener("click", () => stopTypingMode(true));

document.getElementById("btnWrite").addEventListener("click", () => {
  if (typingModeActive) {
    stopTypingMode(true);
    return;
  }
  startTypingMode();
});

// ---------- Initial state ----------
activateTab("code");
setHasFile(false);
editor.setValue(SAMPLE_HTML);
updatePreview();
updateStatus();
logConsole("LiveHTML Pro (Flask Edition) ready hai.");
