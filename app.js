import { database as localDatabase } from "./data.js";
import { loadDatabaseFromSheet } from "./sheetData.js";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1Ec5qLTAAHfuVO-JdGqQz9UYaJf_aSL-ynkBZSu9jFFc/export?format=csv&gid=0";

const sectionsRoot = document.getElementById("category-sections");
const generateBtn = document.getElementById("generate-btn");
const clearBtn = document.getElementById("clear-btn");
const output = document.getElementById("output");
const status = document.getElementById("status");
const source = document.getElementById("data-source");

let categories = [];

function randomPick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createOption(categoryName, optionName) {
  const label = document.createElement("label");
  label.className = "option";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = categoryName;
  input.value = optionName;

  const text = document.createElement("span");
  text.textContent = optionName;

  label.append(input, text);
  return label;
}

function renderCategories() {
  sectionsRoot.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const [categoryName, { options }] of categories) {
    const card = document.createElement("section");
    card.className = "category-card";

    const heading = document.createElement("h3");
    heading.textContent = categoryName;

    card.appendChild(heading);

    for (const optionName of Object.keys(options)) {
      card.appendChild(createOption(categoryName, optionName));
    }

    fragment.appendChild(card);
  }

  sectionsRoot.appendChild(fragment);
}

function getCheckedOptionsForCategory(categoryName) {
  return Array.from(
    document.querySelectorAll(`input[name="${categoryName}"]:checked`)
  ).map((input) => input.value);
}

function generateReport() {
  status.textContent = "";
  const sentences = [];

  for (const [categoryName, { options }] of categories) {
    const checked = getCheckedOptionsForCategory(categoryName);

    if (checked.length === 0) {
      continue;
    }

    const selectedOption = randomPick(checked);
    const examples = options[selectedOption] ?? [];

    if (examples.length === 0) {
      continue;
    }

    sentences.push(randomPick(examples));
  }

  if (sentences.length === 0) {
    output.value = "";
    status.textContent = "少なくとも1つの選択肢にチェックを入れてください。";
    return;
  }

  output.value = sentences.join("\n");
}

function clearSelection() {
  for (const checkbox of document.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = false;
  }

  output.value = "";
  status.textContent = "";
}

async function initialize() {
  let db = localDatabase;

  if (SHEET_CSV_URL) {
    try {
      db = await loadDatabaseFromSheet(SHEET_CSV_URL);
      source.textContent = "データソース: Googleスプレッドシート";
    } catch (error) {
      source.textContent = "データソース: ローカルデータ（スプレッドシート取得失敗）";
      status.textContent = `スプレッドシート取得に失敗したため、ローカルデータを使用します。(${error.message})`;
    }
  }

  categories = Object.entries(db);
  renderCategories();
}

generateBtn.addEventListener("click", generateReport);
clearBtn.addEventListener("click", clearSelection);
initialize();
