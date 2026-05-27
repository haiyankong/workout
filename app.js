const notes = Array.isArray(window.EXERCISE_NOTES) ? window.EXERCISE_NOTES : [];
const trainingLog = Array.isArray(window.TRAINING_LOG)
  ? window.TRAINING_LOG.map((row, index) => ({
      ...row,
      row_index: index,
      sets_estimated: Number(row.sets_estimated) || 0,
      reps_per_set_estimated: Number(row.reps_per_set_estimated) || 0
    }))
  : [];
const currentPlan = window.CURRENT_PLAN || { title: "Current Plan", html: "" };

const state = {
  view: "library",
  levelOne: "",
  levelTwo: ""
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  levelOneSelect: $("#levelOneSelect"),
  levelTwoSelect: $("#levelTwoSelect"),
  resetLibrary: $("#resetLibrary"),
  directoryMeta: $("#directoryMeta"),
  directoryList: $("#directoryList"),
  readerPanel: $("#readerPanel"),
  planDocument: $("#planDocument"),
  startDate: $("#startDate"),
  endDate: $("#endDate"),
  bodyPart: $("#bodyPart"),
  exerciseSearch: $("#exerciseSearch"),
  resetFilters: $("#resetFilters"),
  exerciseOptions: $("#exerciseOptions"),
  statRecords: $("#statRecords"),
  statDays: $("#statDays"),
  statSets: $("#statSets"),
  statReps: $("#statReps"),
  bodyPartChart: $("#bodyPartChart"),
  monthChart: $("#monthChart"),
  topExercises: $("#topExercises"),
  bodyPartTotal: $("#bodyPartTotal"),
  monthTotal: $("#monthTotal"),
  exerciseTotal: $("#exerciseTotal"),
  visibleRows: $("#visibleRows"),
  logRows: $("#logRows"),
  emptyState: $("#emptyState"),
  copyrightYear: $("#copyrightYear")
};

const numberFormat = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const historyPreviewLimit = 8;

function cleanTitle(title) {
  return String(title || "").trim();
}

function formatNumber(value) {
  return numberFormat.format(Math.round(Number(value || 0) * 10) / 10);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function byCountThenName(a, b) {
  return b.value - a.value || a.name.localeCompare(b.name, "zh-CN");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sumSets(items) {
  return items.reduce((sum, row) => sum + row.sets_estimated, 0);
}

function estimateReps(items) {
  return items.reduce((sum, row) => {
    if (!row.sets_estimated || !row.reps_per_set_estimated) return sum;
    return sum + row.sets_estimated * row.reps_per_set_estimated;
  }, 0);
}

function groupBy(items, getKey, getValue = () => 1) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    if (!key) return map;
    map.set(key, (map.get(key) || 0) + getValue(item));
    return map;
  }, new Map());
}

function monthLabel(date) {
  return date.slice(0, 7);
}

function allItems() {
  return notes.flatMap((section) => section.items.map((item) => ({ section, item })));
}

function selectedSection() {
  return notes.find((section) => section.id === state.levelOne);
}

function selectedItem(section = selectedSection()) {
  if (!section) return null;
  return section.items.find((item) => item.id === state.levelTwo);
}

function populateSelectors() {
  notes.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = cleanTitle(section.title);
    elements.levelOneSelect.appendChild(option);
  });
}

function populateLevelTwo() {
  const section = selectedSection();
  elements.levelTwoSelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = section ? "All exercises" : "Select a category first";
  elements.levelTwoSelect.appendChild(defaultOption);
  elements.levelTwoSelect.disabled = !section;

  if (!section) return;

  section.items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = cleanTitle(item.title);
    elements.levelTwoSelect.appendChild(option);
  });
}

function renderDirectory() {
  const sections = state.levelOne ? [selectedSection()].filter(Boolean) : notes;
  elements.directoryList.replaceChildren();
  elements.directoryMeta.textContent = state.levelOne ? "Filtered" : "All";

  sections.forEach((section) => {
    const wrapper = document.createElement("section");
    wrapper.className = "directory-section";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = cleanTitle(section.title);
    button.addEventListener("click", () => {
      state.levelOne = section.id;
      state.levelTwo = "";
      syncControls();
      renderLibrary();
    });

    const meta = document.createElement("span");
    meta.textContent = `${section.items.length} exercises`;

    const itemList = document.createElement("div");
    itemList.className = "directory-items";
    section.items.forEach((item) => {
      const itemButton = document.createElement("button");
      itemButton.type = "button";
      itemButton.textContent = cleanTitle(item.title);
      itemButton.addEventListener("click", () => {
        state.levelOne = section.id;
        state.levelTwo = item.id;
        syncControls();
        renderLibrary();
      });
      itemList.appendChild(itemButton);
    });

    wrapper.append(button, meta, itemList);
    elements.directoryList.appendChild(wrapper);
  });
}

function itemCard(section, item) {
  const card = document.createElement("button");
  card.className = "item-card";
  card.type = "button";
  card.innerHTML = `
    <h3>${escapeHtml(cleanTitle(item.title))}</h3>
    <p>${escapeHtml(item.summary || cleanTitle(section.title))}</p>
  `;
  card.addEventListener("click", () => {
    state.levelOne = section.id;
    state.levelTwo = item.id;
    syncControls();
    renderLibrary();
  });
  return card;
}

function renderOverview() {
  const grid = document.createElement("div");
  grid.className = "item-grid";
  notes.forEach((section) => {
    const card = document.createElement("button");
    card.className = "item-card";
    card.type = "button";
    card.innerHTML = `
      <h3>${escapeHtml(cleanTitle(section.title))}</h3>
      <p>${section.items.length} exercises</p>
    `;
    card.addEventListener("click", () => {
      state.levelOne = section.id;
      state.levelTwo = "";
      syncControls();
      renderLibrary();
    });
    grid.appendChild(card);
  });

  elements.readerPanel.innerHTML = `
    <div class="reader-title">
      <div>
        <h2>All Categories</h2>
        <p>${notes.length} categories, ${allItems().length} exercises</p>
      </div>
    </div>
  `;
  elements.readerPanel.appendChild(grid);
}

function renderSection(section) {
  const grid = document.createElement("div");
  grid.className = "item-grid";
  section.items.forEach((item) => grid.appendChild(itemCard(section, item)));

  elements.readerPanel.innerHTML = `
    <div class="reader-title">
      <div>
        <h2>${escapeHtml(cleanTitle(section.title))}</h2>
        <p>${section.items.length} exercises</p>
      </div>
    </div>
  `;
  elements.readerPanel.appendChild(grid);
}

function renderItem(section, item) {
  elements.readerPanel.innerHTML = `
    <div class="reader-title">
      <div>
        <h2>${escapeHtml(cleanTitle(item.title))}</h2>
        <p>${escapeHtml(cleanTitle(section.title))}</p>
      </div>
    </div>
    <div class="note-content">${item.html}</div>
  `;
}

function renderPlan() {
  elements.planDocument.innerHTML = currentPlan.html || '<p class="empty">No plan yet</p>';
}

function renderLibrary() {
  renderDirectory();
  const section = selectedSection();
  const item = selectedItem(section);

  if (!section) {
    renderOverview();
    return;
  }

  if (!item) {
    renderSection(section);
    return;
  }

  renderItem(section, item);
}

function syncControls() {
  elements.levelOneSelect.value = state.levelOne;
  populateLevelTwo();
  elements.levelTwoSelect.value = state.levelTwo;
}

function createBarRow({ name, value, max, suffix = "" }) {
  const row = document.createElement("div");
  row.className = "bar-row";
  const width = max > 0 ? Math.max((value / max) * 100, 3) : 0;
  const safeName = escapeHtml(name);
  row.innerHTML = `
    <span class="bar-label" title="${safeName}">${safeName}</span>
    <span class="bar-track"><span class="bar-fill" style="--bar-width: ${width}%"></span></span>
    <span class="bar-value">${formatNumber(value)}${suffix}</span>
  `;
  return row;
}

function renderBars(container, entries, options = {}) {
  container.replaceChildren();
  const max = entries.reduce((best, item) => Math.max(best, item.value), 0);
  entries.forEach((item) => {
    container.appendChild(createBarRow({ ...item, max, suffix: options.suffix || "" }));
  });
}

function renderRanks(items) {
  elements.topExercises.replaceChildren();
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "rank-item";
    const safeName = escapeHtml(item.name);
    row.innerHTML = `
      <span class="rank-name" title="${safeName}">${safeName}</span>
      <span class="rank-count">${formatNumber(item.value)} sets</span>
    `;
    elements.topExercises.appendChild(row);
  });
}

function populateHistoryFilters() {
  const dates = unique(trainingLog.map((row) => row.date)).sort();
  const parts = unique(trainingLog.map((row) => row.body_part)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const exercises = unique(trainingLog.map((row) => row.exercise)).sort((a, b) => a.localeCompare(b, "zh-CN"));

  if (dates.length) {
    const first = dates[0];
    const last = dates[dates.length - 1];
    elements.startDate.min = first;
    elements.startDate.max = last;
    elements.endDate.min = first;
    elements.endDate.max = last;
    elements.startDate.value = first;
    elements.endDate.value = last;
  }

  parts.forEach((part) => {
    const option = document.createElement("option");
    option.value = part;
    option.textContent = part;
    elements.bodyPart.appendChild(option);
  });

  exercises.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise;
    elements.exerciseOptions.appendChild(option);
  });
}

function filteredHistoryRows() {
  const start = elements.startDate.value;
  const end = elements.endDate.value;
  const bodyPart = elements.bodyPart.value;
  const query = elements.exerciseSearch.value.trim().toLowerCase();

  return trainingLog.filter((row) => {
    if (start && row.date < start) return false;
    if (end && row.date > end) return false;
    if (bodyPart && row.body_part !== bodyPart) return false;
    if (query && !row.exercise.toLowerCase().includes(query)) return false;
    return true;
  });
}

function renderHistoryStats(items) {
  const days = unique(items.map((row) => row.date)).length;
  const sets = sumSets(items);
  const reps = estimateReps(items);

  elements.statRecords.textContent = formatNumber(items.length);
  elements.statDays.textContent = formatNumber(days);
  elements.statSets.textContent = formatNumber(sets);
  elements.statReps.textContent = formatNumber(reps);
}

function renderHistoryOverview(items) {
  const byPart = [...groupBy(items, (row) => row.body_part, (row) => row.sets_estimated)]
    .map(([name, value]) => ({ name, value }))
    .sort(byCountThenName)
    .slice(0, historyPreviewLimit);
  const byMonth = [...groupBy(items, (row) => monthLabel(row.date), (row) => row.sets_estimated)]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.name.localeCompare(a.name))
    .slice(0, historyPreviewLimit);
  const top = [...groupBy(items, (row) => row.exercise, (row) => row.sets_estimated)]
    .map(([name, value]) => ({ name, value }))
    .sort(byCountThenName)
    .slice(0, historyPreviewLimit);

  renderBars(elements.bodyPartChart, byPart, { suffix: " sets" });
  renderBars(elements.monthChart, byMonth, { suffix: " sets" });
  renderRanks(top);

  elements.bodyPartTotal.textContent = `${formatNumber(byPart.reduce((sum, item) => sum + item.value, 0))} sets`;
  elements.monthTotal.textContent = `${formatNumber(byMonth.reduce((sum, item) => sum + item.value, 0))} sets`;
  elements.exerciseTotal.textContent = `${unique(items.map((row) => row.exercise)).length} exercises`;
}

function renderHistoryTable(items) {
  const sorted = [...items].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.row_index - a.row_index;
  });

  elements.logRows.replaceChildren();
  elements.emptyState.hidden = sorted.length > 0;
  elements.visibleRows.textContent = `${sorted.length} records`;

  const fragment = document.createDocumentFragment();
  sorted.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.date)}</td>
      <td>${escapeHtml(row.body_part)}</td>
      <td>${escapeHtml(row.exercise)}</td>
      <td>${row.sets_raw ? escapeHtml(row.sets_raw) : '<span class="cell-muted">-</span>'}</td>
      <td>${row.reps_per_set_raw ? escapeHtml(row.reps_per_set_raw) : '<span class="cell-muted">-</span>'}</td>
      <td>${row.weight_raw ? escapeHtml(row.weight_raw) : '<span class="cell-muted">-</span>'}</td>
      <td>${row.notes ? escapeHtml(row.notes) : '<span class="cell-muted">-</span>'}</td>
    `;
    fragment.appendChild(tr);
  });
  elements.logRows.appendChild(fragment);
}

function renderHistory() {
  const items = filteredHistoryRows();
  renderHistoryStats(items);
  renderHistoryOverview(items);
  renderHistoryTable(items);
}

function resetHistoryFilters() {
  const dates = unique(trainingLog.map((row) => row.date)).sort();
  elements.startDate.value = dates[0] || "";
  elements.endDate.value = dates[dates.length - 1] || "";
  elements.bodyPart.value = "";
  elements.exerciseSearch.value = "";
  renderHistory();
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `${view}View`);
  });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

elements.levelOneSelect.addEventListener("change", () => {
  state.levelOne = elements.levelOneSelect.value;
  state.levelTwo = "";
  syncControls();
  renderLibrary();
});

elements.levelTwoSelect.addEventListener("change", () => {
  state.levelTwo = elements.levelTwoSelect.value;
  renderLibrary();
});

elements.resetLibrary.addEventListener("click", () => {
  state.levelOne = "";
  state.levelTwo = "";
  syncControls();
  renderLibrary();
});

[elements.startDate, elements.endDate, elements.bodyPart, elements.exerciseSearch].forEach((control) => {
  control.addEventListener("input", renderHistory);
  control.addEventListener("change", renderHistory);
});

elements.resetFilters.addEventListener("click", resetHistoryFilters);

populateSelectors();
syncControls();
renderLibrary();
renderPlan();
populateHistoryFilters();
renderHistory();
elements.copyrightYear.textContent = new Date().getFullYear();
