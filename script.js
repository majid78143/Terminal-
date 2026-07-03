/*
  LiveHTML Pro - Flask Edition
  Poora logic client-side JS me hai (koi backend API call nahi).
  Features: Upload, Live Preview, Write typing animation, Console tab, Status bar.
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
  autofocus: true,
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

// ---------- Tabs (Code+Preview / Console) ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
  });
});

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

// ---------- Write button: human-jaisi typing animation ----------
document.getElementById("btnWrite").addEventListener("click", async () => {
  if (writing) {
    writeAbort = true;
    return;
  }

  const code = hasFile ? editor.getValue() : SAMPLE_HTML;

  writeBanner.classList.remove("hidden");
  writeBanner.textContent = "Page ko shuru se dobara likha ja raha hai...";
  logConsole("Write process shuru hui.");

  await new Promise((r) => setTimeout(r, 1200));
  writeBanner.classList.add("hidden");

  writing = true;
  writeAbort = false;
  setHasFile(true);
  editor.setValue("");
  previewFrame.srcdoc = "";

  let i = 0;
  while (i < code.length) {
    if (writeAbort) {
      editor.setValue(code);
      break;
    }
    // Realistic burst typing: 2-6 characters at a time
    const chunk = Math.floor(Math.random() * 5) + 2;
    const next = code.slice(i, i + chunk);
    editor.replaceRange(next, { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length });
    editor.scrollIntoView({ line: editor.lastLine(), ch: 0 });
    i += chunk;

    updatePreview();
    updateStatus();

    // Chhoti-chhoti random pause, jaise koi insaan type kar raha ho
    const delay = next.includes("\n") ? 90 : Math.random() * 35 + 8;
    await new Promise((r) => setTimeout(r, delay));
  }

  writing = false;
  updatePreview();
  updateStatus();
  logConsole("Write process complete ho gayi.");
});

// ---------- Initial state ----------
setHasFile(false);
editor.setValue(SAMPLE_HTML);
updatePreview();
updateStatus();
logConsole("LiveHTML Pro (Flask Edition) ready hai.");
