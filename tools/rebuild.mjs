import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*.+$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function cleanTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function localizeMedia(html) {
  return html.replace(/https:\/\/haiyankong\.github\.io\/workout-note\//g, "media/");
}

function figureShortcode(line) {
  const attrs = {};
  for (const match of line.matchAll(/(\w+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  if (!attrs.src) return null;
  const src = attrs.src.replace("https://haiyankong.github.io/workout-note/", "media/");
  const caption = attrs.caption || attrs.alt || "";
  const width = attrs.width ? ` style="max-width:${escapeHtml(attrs.width)}"` : "";
  return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}"${width}>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function renderMarkdownLines(lines) {
  const html = [];
  let paragraph = [];
  let unordered = [];
  let ordered = [];
  let table = [];
  let quote = [];

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushLists() {
    if (unordered.length) {
      html.push(`<ul>${unordered.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      unordered = [];
    }
    if (ordered.length) {
      html.push(`<ol>${ordered.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ol>`);
      ordered = [];
    }
  }

  function flushTable() {
    if (table.length < 2) {
      table.forEach((line) => paragraph.push(line));
      table = [];
      return;
    }
    const rows = table
      .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    if (!rows.length) return;
    const [head, ...body] = rows;
    html.push(`<div class="markdown-table"><table><thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    table = [];
  }

  function flushQuote() {
    if (quote.length) {
      html.push(`<blockquote>${quote.map((item) => `<p>${inlineMarkdown(item)}</p>`).join("")}</blockquote>`);
      quote = [];
    }
  }

  function flushAll() {
    flushTable();
    flushQuote();
    flushParagraph();
    flushLists();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      flushLists();
      flushQuote();
      table.push(line);
      continue;
    }

    flushTable();

    if (/^-{3,}$/.test(line)) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    const quoteItem = line.match(/^>\s*(.+)$/);
    if (quoteItem) {
      flushParagraph();
      flushLists();
      quote.push(quoteItem[1]);
      continue;
    }

    flushQuote();

    const figure = line.startsWith("{{< figure") ? figureShortcode(line) : null;
    if (figure) {
      flushAll();
      html.push(figure);
      continue;
    }

    if (/^<\/?(center|video|source)\b/i.test(line)) {
      flushAll();
      html.push(localizeMedia(line));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = Math.min(6, heading[1].length);
      html.push(`<h${level}>${inlineMarkdown(cleanTitle(heading[2]))}</h${level}>`);
      continue;
    }

    const unorderedItem = line.match(/^-\s+(.+)$/);
    if (unorderedItem) {
      flushParagraph();
      ordered = [];
      unordered.push(unorderedItem[1]);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      unordered = [];
      ordered.push(orderedItem[1]);
      continue;
    }

    if (/^\*\*[^*]+[：:]\*\*\s+/.test(line)) {
      flushAll();
      html.push(`<p class="markdown-meta">${inlineMarkdown(line)}</p>`);
      continue;
    }

    flushLists();
    paragraph.push(line);
  }

  flushAll();
  return html.join("\n");
}

function stripFrontMatter(markdown) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

function parseExerciseNotes(markdown) {
  const sections = [];
  const lines = stripFrontMatter(markdown).split(/\r?\n/);
  let currentSection = null;
  let currentItem = null;
  let buffer = [];
  let sectionBuffer = [];

  function flushItem() {
    if (!currentItem) return;
    currentItem.html = renderMarkdownLines(buffer);
    currentItem.summary = buffer.find((line) => line.trim().startsWith("目的："))?.replace(/^\s*目的：\s*/, "").trim() || "";
    currentItem.id = `${currentSection.id}-${slugify(currentItem.title)}`;
    currentSection.items.push(currentItem);
    currentItem = null;
    buffer = [];
  }

  function hasMeaningfulContent(linesToCheck) {
    return linesToCheck.some((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("{{< toc") && trimmed !== "---";
    });
  }

  function flushSectionOverview() {
    if (!currentSection || !hasMeaningfulContent(sectionBuffer)) {
      sectionBuffer = [];
      return;
    }

    const title = "概览";
    currentSection.items.push({
      title,
      summary: sectionBuffer.find((line) => line.trim().startsWith("目的："))?.replace(/^\s*目的：\s*/, "").trim() || "",
      html: renderMarkdownLines(sectionBuffer),
      id: `${currentSection.id}-${slugify(title)}`
    });
    sectionBuffer = [];
  }

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      flushItem();
      flushSectionOverview();
      const title = cleanTitle(h1[1]);
      currentSection = { title, id: slugify(title), items: [] };
      sections.push(currentSection);
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2 && currentSection) {
      flushItem();
      flushSectionOverview();
      currentItem = { title: cleanTitle(h2[1]), summary: "", html: "" };
      continue;
    }

    if (currentItem) buffer.push(line);
    else if (currentSection) sectionBuffer.push(line);
  }

  flushItem();
  flushSectionOverview();
  return sections;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  const zh = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (zh) return `${zh[1]}-${zh[2].padStart(2, "0")}-${zh[3].padStart(2, "0")}`;
  return text;
}

function estimateSets(value) {
  const text = String(value || "").trim();
  const multiply = text.match(/^(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
  if (multiply) return Number(multiply[1]) * Number(multiply[2]);
  const nums = text.match(/\d+(?:\.\d+)?/g);
  return nums ? Number(nums[0]) : "";
}

function estimateReps(value) {
  const text = String(value || "").trim();
  const nums = text.match(/\d+(?:\.\d+)?/g);
  if (!nums) return "";
  if (nums.length >= 2 && /[-~至到]/.test(text)) {
    return Math.round(((Number(nums[0]) + Number(nums[1])) / 2) * 10) / 10;
  }
  return Number(nums[0]);
}

function normalizeTrainingLog(csvText) {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const headers = rows.shift() || [];
  const isChinese = headers.includes("日期");

  const normalized = rows.map((values, index) => {
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] || ""]));
    const date = normalizeDate(isChinese ? row["日期"] : row.date);
    const setsRaw = isChinese ? row["组数"] : row.sets_raw;
    const repsRaw = isChinese ? row["次数/组"] : row.reps_per_set_raw;
    return {
      source_order: Number(row.source_order) || index + 1,
      date,
      body_part: (isChinese ? row["部位"] : row.body_part || "").trim(),
      exercise: (isChinese ? row["动作"] : row.exercise || "").trim(),
      sets_raw: String(setsRaw || "").trim(),
      sets_estimated: Number(row.sets_estimated) || estimateSets(setsRaw),
      reps_per_set_raw: String(repsRaw || "").trim(),
      reps_per_set_estimated: Number(row.reps_per_set_estimated) || estimateReps(repsRaw),
      weight_raw: String(isChinese ? row["重量"] : row.weight_raw || "").trim(),
      notes: String(isChinese ? row["备注"] : row.notes || "").trim()
    };
  });

  return normalized.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    return dateCompare || a.source_order - b.source_order;
  });
}

function trainingCsv(rows) {
  const headers = ["source_order", "date", "body_part", "exercise", "sets_raw", "sets_estimated", "reps_per_set_raw", "reps_per_set_estimated", "weight_raw", "notes"];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\r\n") + "\r\n";
}

function parsePlan(markdown) {
  const lines = markdown.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim() || "当前训练计划";
  return {
    title,
    html: renderMarkdownLines(lines)
  };
}

await fs.mkdir(path.join(root, "data"), { recursive: true });

const exerciseMarkdown = await fs.readFile(path.join(root, "content", "exercise-notes.md"), "utf8");
const exerciseNotes = parseExerciseNotes(exerciseMarkdown);
await fs.writeFile(path.join(root, "data", "exercise-notes.js"), `window.EXERCISE_NOTES = ${JSON.stringify(exerciseNotes, null, 2)};\n`, "utf8");

const planMarkdown = await fs.readFile(path.join(root, "content", "current-plan.md"), "utf8");
const currentPlan = parsePlan(planMarkdown);
await fs.writeFile(path.join(root, "data", "current-plan.js"), `window.CURRENT_PLAN = ${JSON.stringify(currentPlan, null, 2)};\n`, "utf8");
await fs.writeFile(path.join(root, "data", "current-plan.md"), planMarkdown, "utf8");

const logRows = normalizeTrainingLog(await fs.readFile(path.join(root, "data", "training-log.csv"), "utf8"));
await fs.writeFile(path.join(root, "data", "training-log.csv"), `\uFEFF${trainingCsv(logRows)}`, "utf8");
await fs.writeFile(path.join(root, "data", "training-data.js"), `window.TRAINING_LOG = ${JSON.stringify(logRows, null, 2)};\n`, "utf8");

console.log(`Rebuilt Workout HUB: ${exerciseNotes.length} categories, ${exerciseNotes.reduce((sum, section) => sum + section.items.length, 0)} actions, ${logRows.length} training rows.`);
