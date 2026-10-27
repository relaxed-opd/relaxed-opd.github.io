"use strict";

const tokens = [
  { word: "Let", entropy: 0.85, credit: -8.4 },
  { word: "x", entropy: 0.08, credit: -0.04 },
  { word: "be", entropy: 1.7, credit: 0.9 },
  { word: "the", entropy: 0.6, credit: -1.1 },
  { word: "number", entropy: 0.1, credit: -0.02 },
  { word: ".", entropy: 2.2, credit: -5.2 },
  { word: "Then", entropy: 0.35, credit: 0.12 },
  { word: "solve", entropy: 1.1, credit: 1.7 },
];
const creditFloor = Math.log(0.1) / (1 - 0.1);
const entropyThreshold = [...tokens].sort((a, b) => b.entropy - a.entropy)[3].entropy;
const tokenGrid = document.querySelector("#token-grid");
const phaseButtons = [...document.querySelectorAll("[data-phase]")];
const phaseExplanation = document.querySelector("#phase-explanation");
const selectionSummary = document.querySelector("#selection-summary");

function renderPhase(phase) {
  tokenGrid.replaceChildren();
  let selectedCount = 0;
  let clippedCount = 0;
  for (const token of tokens) {
    const selected = phase === "exploration"
      ? token.credit >= creditFloor
      : token.entropy >= entropyThreshold;
    const clipped = selected && token.credit < creditFloor;
    const usedCredit = Math.max(token.credit, creditFloor);
    selectedCount += Number(selected);
    clippedCount += Number(clipped);

    const card = document.createElement("div");
    card.className = `token ${!selected ? "not-selected" : clipped ? "used-clipped" : "is-selected"}`;
    for (const [className, text] of [
      ["token-word", token.word],
      ["token-info", `H = ${token.entropy.toFixed(2)}`],
      ["token-info", `R = ${token.credit.toFixed(2)}`],
      ["token-result", !selected ? "Excluded" : clipped ? `Clipped: ${usedCredit.toFixed(2)}` : `Used: ${usedCredit.toFixed(2)}`],
    ]) {
      const element = document.createElement("div");
      element.className = className;
      element.textContent = text;
      card.append(element);
    }
    tokenGrid.append(card);
  }
  for (const button of phaseButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.phase === phase));
  }
  phaseExplanation.textContent = phase === "exploration"
    ? "Early training rejects credits below the floor, while retaining ordinary credits regardless of entropy."
    : "Later training selects the four highest-entropy tokens. Extreme negative credits on selected tokens are now retained, but clipped to the floor.";
  selectionSummary.textContent = `${selectedCount} / ${tokens.length} selected · ${clippedCount} clipped`;
}

document.querySelector(".phase-controls").hidden = false;
for (const button of phaseButtons) {
  button.addEventListener("click", () => renderPhase(button.dataset.phase));
}
renderPhase("exploration");

const tabList = document.querySelector(".result-tabs");
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
tabList.hidden = false;
for (const tab of tabs) {
  const panel = document.getElementById(tab.getAttribute("aria-controls"));
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", tab.id);
  panel.tabIndex = 0;
}

function selectTab(selectedTab) {
  for (const tab of tabs) {
    const active = tab === selectedTab;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
}
selectTab(tabs[0]);

const figureDialog = document.querySelector("#figure-dialog");
if (typeof figureDialog.showModal === "function") {
  const enlargedFigure = document.querySelector("#enlarged-figure");
  const dialogCaption = document.querySelector("#figure-dialog-caption");
  for (const link of document.querySelectorAll("[data-zoom]")) {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enlargedFigure.src = link.href;
      enlargedFigure.alt = link.querySelector("img").alt;
      dialogCaption.textContent = link.dataset.caption;
      figureDialog.showModal();
      document.body.classList.add("dialog-open");
    });
  }
  document.querySelector("#close-figure").addEventListener("click", () => figureDialog.close());
  figureDialog.addEventListener("click", (event) => {
    if (event.target !== figureDialog) return;
    const rect = figureDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      figureDialog.close();
    }
  });
  figureDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
}

const copyButton = document.querySelector("#copy-citation");
const copyStatus = document.querySelector("#copy-status");
copyButton.hidden = false;
copyButton.addEventListener("click", async () => {
  if (!navigator.clipboard || !window.isSecureContext) {
    copyStatus.textContent = "Clipboard access requires HTTPS or localhost. Select the BibTeX below to copy it, or download the .bib file.";
    return;
  }
  try {
    await navigator.clipboard.writeText(document.querySelector("#bibtex").textContent.trim() + "\n");
    copyStatus.textContent = "BibTeX copied to clipboard.";
    copyButton.textContent = "Copied!";
  } catch (error) {
    console.error("Unable to copy BibTeX:", error);
    copyStatus.textContent = "Clipboard permission was denied. Select the BibTeX below to copy it, or download the .bib file.";
  }
});
