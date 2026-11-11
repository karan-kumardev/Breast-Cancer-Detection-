const $ = (id) => document.getElementById(id);
const STAGGER = 450;     // ms between the cards, so the sliders move one after another

function card(file) {
  return [...document.querySelectorAll(".sample")].find((c) => c.dataset.file === file);
}

function showCard(r, cutoff) {
  const el = card(r.file);
  if (!el) return;
  const pct = Math.round(r.score * 100);
  const cut = Math.round(cutoff * 100);

  el.querySelector(".status").hidden = true;
  el.querySelector(".out").hidden = false;

  const pill = el.querySelector(".pill");
  pill.className = "pill " + (r.flagged ? "flag" : "clear");
  pill.innerHTML = r.flagged
    ? "Cancer detected<small>Must be reviewed</small>"
    : "Cancer not detected<small>Does not rule out cancer</small>";

  el.querySelector(".score").textContent = pct + "%";
  const gauge = el.querySelector(".gauge");
  gauge.style.setProperty("--cut", cut + "%");
  el.querySelector(".tick").style.left = cut + "%";
  el.querySelector(".tick span").textContent = "cut-off " + cut + "%";

  const right = r.flagged === (r.label === "Cancer");
  el.querySelector(".verdict-note").innerHTML =
    `Actual label: <b>${r.label}</b> · model was <b class="${right ? "right" : "wrong"}">${right ? "right" : "wrong"}</b>`;

  el.classList.remove("flag", "clear");
  el.classList.add(r.flagged ? "flag" : "clear");

  const marker = el.querySelector(".marker");
  marker.className = "marker " + (r.flagged ? "flag" : "clear");
  marker.style.left = "0%";
  requestAnimationFrame(() => requestAnimationFrame(() => { marker.style.left = pct + "%"; }));
}

function showSummary(results, cutoff) {
  const above = results.filter((r) => r.flagged).length;
  const right = results.filter((r) => r.flagged === (r.label === "Cancer")).length;
  const box = $("summary");
  box.innerHTML = `${above} of ${results.length} images crossed the cut-off (${Math.round(cutoff * 100)}%) <span>· the model was right on ${right} of ${results.length}</span>`;
  box.hidden = false;
}

async function runAll() {
  const btn = $("runAll");
  btn.disabled = true;
  btn.textContent = "Testing…";
  $("summary").hidden = true;
  document.querySelectorAll(".sample").forEach((c) => {
    c.classList.remove("flag", "clear");
    c.querySelector(".out").hidden = true;
    const s = c.querySelector(".status");
    s.hidden = false;
    s.textContent = "Analysing…";
  });

  try {
    const res = await fetch("/predict_all", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.results.length) throw new Error("No results. Did you run make_demo.py?");
    data.results.forEach((r, i) => setTimeout(() => showCard(r, data.cutoff), i * STAGGER));
    setTimeout(() => showSummary(data.results, data.cutoff), data.results.length * STAGGER + 400);
    setTimeout(() => { btn.disabled = false; btn.textContent = "Test again"; }, data.results.length * STAGGER + 400);
  } catch (err) {
    document.querySelectorAll(".sample .status").forEach((s) => { s.hidden = false; s.textContent = err.message; });
    btn.disabled = false;
    btn.textContent = "Test all images";
  }
}

$("runAll").addEventListener("click", runAll);

/* privacy mode toggle */
$("privacy").addEventListener("click", () => {
  const on = document.body.classList.toggle("private");
  $("privacy").textContent = "Privacy mode: " + (on ? "on" : "off");
  $("privacy").setAttribute("aria-pressed", on);
});
