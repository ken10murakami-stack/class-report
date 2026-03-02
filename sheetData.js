const REQUIRED_COLUMNS = {
  category: ["category", "カテゴリ", "カテゴリ名"],
  option: ["option", "選択肢"],
  example: ["example", "文例", "文章"]
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += ch;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase();
}

function pickColumnIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

export function buildDatabaseFromCsv(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some((cell) => cell.trim() !== ""));

  if (rows.length < 2) {
    throw new Error("CSVにデータ行がありません。");
  }

  const headers = rows[0];
  const categoryIndex = pickColumnIndex(headers, REQUIRED_COLUMNS.category);
  const optionIndex = pickColumnIndex(headers, REQUIRED_COLUMNS.option);
  const exampleIndex = pickColumnIndex(headers, REQUIRED_COLUMNS.example);

  if (categoryIndex === -1 || optionIndex === -1 || exampleIndex === -1) {
    throw new Error("CSVヘッダーは category/option/example（または カテゴリ/選択肢/文例）に対応してください。");
  }

  const database = {};

  for (const row of rows.slice(1)) {
    const category = (row[categoryIndex] ?? "").trim();
    const option = (row[optionIndex] ?? "").trim();
    const example = (row[exampleIndex] ?? "").trim();

    if (!category || !option || !example) {
      continue;
    }

    if (!database[category]) {
      database[category] = { options: {} };
    }

    if (!database[category].options[option]) {
      database[category].options[option] = [];
    }

    database[category].options[option].push(example);
  }

  if (Object.keys(database).length === 0) {
    throw new Error("CSVから有効なデータを構築できませんでした。");
  }

  return database;
}

export async function loadDatabaseFromSheet(csvUrl) {
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`スプレッドシート取得に失敗しました (${response.status})`);
  }

  const csvText = await response.text();
  return buildDatabaseFromCsv(csvText);
}
