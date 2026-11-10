const $ = (id) => document.getElementById(id);
const drop = $("drop"), input = $("file");
const CUTOFF = window.CUTOFF;

function showOnly(name) {
  for (const id of ["empty", "loading", "error", "result"]) $(id).hidden = id !== name;
}

function showPreview(blob) {
  $("preview").src = URL.createObjectURL(blob);
  $("previewBox").hidden = false;
  drop.hidden = true;
}

function reset() {
  input.value = "";
  $("previewBox").hidden = true;
  drop.hidden = false;
  document.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active"));
  showOnly("empty");
}

async function analyse(blob, name, truth) {
  showPreview(blob);
  showOnly("loading");
  const form = new FormData();
  form.append("image", blob, name);
  try {
    const res = await fetch("/predict", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    render(data, truth);
  } catch (err) {
    $("errorText").textContent = err.message;
    showOnly("error");
  }
}

function render(data, truth) {
  const pct = Math.round(data.score * 100);
  const cut = Math.round(data.cutoff * 100);

  const pill = $("verdict");
  pill.innerHTML = data.flagged
    ? "Cancer detected<small>Must be reviewed</small>"
    : "Cancer not detected<small>Does not rule out cancer</small>";
  pill.className = "pill " + (data.flagged ? "flag" : "clear");

  $("scoreNum").textContent = pct + "%";
  $("tick").style.left = cut + "%";
  $("tickLabel").textContent = "cut-off " + cut + "%";
  $("explain").textContent = data.flagged
    ? `The score (${pct}%) is above the cut-off (${cut}%), so this image would be sent for a second look.`
    : `The score (${pct}%) is below the cut-off (${cut}%), so this image is not flagged. Note that about 1 in 5 cancers is still missed at this cut-off.`;

  const t = $("truth");
  if (truth) {
    const right = data.flagged === (truth === "Cancer");
    t.innerHTML = `Actual label: <b>${truth}</b> · model was <b class="${right ? "right" : "wrong"}">${right ? "right" : "wrong"}</b>`;
    t.hidden = false;
  } else {
    t.hidden = true;
  }

  $("gauge").style.setProperty("--cut", cut + "%");
  const marker = $("marker");
  marker.className = "marker " + (data.flagged ? "flag" : "clear");
  marker.style.left = "0%";
  showOnly("result");
  // the marker slides from 0 to the score
  requestAnimationFrame(() => requestAnimationFrame(() => { marker.style.left = pct + "%"; }));
}

/* upload by click or keyboard */
input.addEventListener("change", () => {
  const file = input.files[0];
  if (file) analyse(file, file.name, null);
});
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
});

/* drag and drop */
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) analyse(file, file.name, null);
});

$("again").addEventListener("click", reset);

/* sample images */
document.querySelectorAll(".thumb").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".thumb").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    const src = btn.querySelector("img").src;
    const blob = await (await fetch(src)).blob();
    analyse(blob, src.split("/").pop(), btn.dataset.label);
  });
});
