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
  calendarTotal: $("#calendarTotal"),
  calendarActiveDays: $("#calendarActiveDays"),
  calendarBestCount: $("#calendarBestCount"),
  calendarLongestStreak: $("#calendarLongestStreak"),
  calendarYears: $("#calendarYears"),
  startDate: $("#startDate"),
  endDate: $("#endDate"),
  bodyPart: $("#bodyPart"),
  exerciseSearch: $("#exerciseSearch"),
  resetFilters: $("#resetFilters"),
  exerciseOptions: $("#exerciseOptions"),
  bodyPartChart: $("#bodyPartChart"),
  monthChart: $("#monthChart"),
  topExercises: $("#topExercises"),
  bodyPartTotal: $("#bodyPartTotal"),
  monthTotal: $("#monthTotal"),
  exerciseTotal: $("#exerciseTotal"),
  visibleRows: $("#visibleRows"),
  logRows: $("#logRows"),
  emptyState: $("#emptyState")
};

const numberFormat = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const historyPreviewLimit = 8;
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfWeek(date) {
  return addDays(date, -date.getUTCDay());
}

function endOfWeek(date) {
  return addDays(date, 6 - date.getUTCDay());
}

function formatDateLabel(dateKey) {
  const date = typeof dateKey === "string" ? parseDateKey(dateKey) : dateKey;
  if (!date) return "";
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function contributionLevel(count) {
  if (!count) return 0;
  return Math.min(count, 4);
}

function contributionText(count, dateKey) {
  const contribution = count === 1 ? "contribution" : "contributions";
  return `${count} ${contribution} on ${formatDateLabel(dateKey)}`;
}

function longestContributionStreak(dateCounts) {
  const activeDates = [...dateCounts.keys()].sort();
  let longest = 0;
  let current = 0;
  let previousDate = null;

  activeDates.forEach((dateKey) => {
    const date = parseDateKey(dateKey);
    if (!date) return;
    const followsPrevious = previousDate && formatDateKey(addDays(previousDate, 1)) === dateKey;
    current = followsPrevious ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDate = date;
  });

  return longest;
}

function renderCalendarMonths(container, weeks, year) {
  container.replaceChildren();
  container.style.gridTemplateColumns = `repeat(${weeks.length}, var(--calendar-cell-size))`;

  const fragment = document.createDocumentFragment();
  weeks.forEach((weekStart) => {
    const label = document.createElement("span");
    const monthStart = Array.from({ length: 7 }, (_, day) => addDays(weekStart, day)).find((date) => {
      return date.getUTCFullYear() === year && date.getUTCDate() === 1;
    });

    if (monthStart) {
      label.textContent = monthNames[monthStart.getUTCMonth()];
    }

    fragment.appendChild(label);
  });

  container.appendChild(fragment);
}

function renderContributionGrid(grid, months, dateCounts, year) {
  const firstDate = new Date(Date.UTC(year, 0, 1));
  const lastDate = new Date(Date.UTC(year, 11, 31));
  const calendarStart = startOfWeek(firstDate);
  const calendarEnd = endOfWeek(lastDate);
  const weeks = [];

  for (let cursor = calendarStart; cursor <= calendarEnd; cursor = addDays(cursor, 7)) {
    weeks.push(cursor);
  }

  renderCalendarMonths(months, weeks, year);

  grid.replaceChildren();
  grid.style.gridTemplateColumns = `repeat(${weeks.length}, var(--calendar-cell-size))`;

  const fragment = document.createDocumentFragment();
  weeks.forEach((weekStart) => {
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(weekStart, day);
      const dateKey = formatDateKey(date);
      const isInYear = date.getUTCFullYear() === year;
      const count = isInYear ? dateCounts.get(dateKey) || 0 : 0;
      const cell = document.createElement("span");
      const label = contributionText(count, dateKey);
      cell.className = `contribution-cell level-${contributionLevel(count)}${isInYear ? "" : " is-outside-year"}`;

      if (isInYear) {
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", "0");
        cell.setAttribute("aria-label", label);
        cell.title = label;
      } else {
        cell.setAttribute("aria-hidden", "true");
      }

      fragment.appendChild(cell);
    }
  });

  grid.appendChild(fragment);
}

function renderYearCalendar(year, dateCounts) {
  const yearKey = String(year);
  const yearEntries = [...dateCounts.entries()].filter(([dateKey]) => dateKey.startsWith(`${yearKey}-`));
  const total = yearEntries.reduce((sum, [, count]) => sum + count, 0);
  const activeDays = yearEntries.length;
  const panel = document.createElement("section");
  panel.className = "panel contribution-panel";
  panel.setAttribute("aria-label", `${year} training contribution calendar`);
  panel.innerHTML = `
    <div class="panel-heading calendar-heading">
      <div>
        <h2>${escapeHtml(yearKey)}</h2>
        <p>${formatNumber(total)} contributions across ${formatNumber(activeDays)} active days</p>
      </div>
    </div>

    <div class="contribution-scroll">
      <div class="contribution-months" aria-hidden="true"></div>
      <div class="contribution-body">
        <div class="contribution-weekdays" aria-hidden="true">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>
        <div class="contribution-grid" role="grid" aria-label="${escapeHtml(yearKey)} training contributions by day"></div>
      </div>
    </div>
  `;

  renderContributionGrid(
    panel.querySelector(".contribution-grid"),
    panel.querySelector(".contribution-months"),
    dateCounts,
    year
  );

  return panel;
}

function renderCalendar() {
  const dateCounts = groupBy(trainingLog, (row) => row.date);
  const dates = [...dateCounts.keys()].sort();

  elements.calendarTotal.textContent = formatNumber(trainingLog.length);
  elements.calendarActiveDays.textContent = formatNumber(dates.length);
  elements.calendarLongestStreak.textContent = formatNumber(longestContributionStreak(dateCounts));

  if (!dates.length) {
    elements.calendarBestCount.textContent = "0";
    elements.calendarYears.innerHTML = '<section class="panel empty">No training data</section>';
    return;
  }

  const [, bestCount] = [...dateCounts.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0];
  const years = unique(dates.map((dateKey) => Number(dateKey.slice(0, 4))))
    .filter(Boolean)
    .sort((a, b) => b - a);

  elements.calendarBestCount.textContent = formatNumber(bestCount);
  elements.calendarYears.replaceChildren();

  years.forEach((year) => {
    elements.calendarYears.appendChild(renderYearCalendar(year, dateCounts));
  });
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
  const width = max > 0 ? (value / max) * 100 : 0;
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
renderCalendar();
populateHistoryFilters();
renderHistory();
