#!/usr/bin/env node

require("dotenv").config();

const inquirer = require("inquirer").default;
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

// ===================== AI SETUP =====================

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// ===================== CLI COMMAND =====================

const command = process.argv[2];

if (!command || command === "triage") {
  runTriage();
} else if (command === "review") {
  reviewDraft();
} else if (command === "export") {
  exportTicket();
} else {
  console.log("Unknown command. Use:");
  console.log("  triage");
  console.log("  triage review");
  console.log("  triage export");
}

// ===================== VALIDATION =====================

function validateText(input, fieldName) {
  const value = input.trim();

  if (!value) return `${fieldName} cannot be empty`;

  if (/^[^a-zA-Z0-9]+$/.test(value)) {
    return `${fieldName} must contain real words, not just symbols`;
  }

  if (/^(.)\1+$/.test(value)) {
    return `${fieldName} cannot be repeated characters`;
  }

  if (!/[a-zA-Z]/.test(value)) {
    return `${fieldName} must include at least one letter`;
  }

  if (value.length < 5) {
    return `${fieldName} is too short`;
  }

  if (/https?:\/\/\S+/.test(value)) {
    return `${fieldName} should not contain links`;
  }

  return true;
}

// ===================== TRIAGE =====================

async function runTriage() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "What is the issue title?",
      validate: (input) => validateText(input, "Title")
    },
    {
      type: "input",
      name: "description",
      message: "Describe the issue in detail:",
      validate: (input) => {
        const base = validateText(input, "Description");
        if (base !== true) return base;

        if (input.trim().length < 10) {
          return "Description should be at least 10 characters";
        }

        return true;
      }
    }
  ]);

  const cleanTitle = answers.title.trim().replace(/\s+/g, " ");
  const cleanDescription = answers.description.trim().replace(/\s+/g, " ");

  process.stdout.write("\n🤖 Generating AI summary...");

  let aiRaw;

  try {
    aiRaw = await generateSummary(cleanTitle, cleanDescription);
  } catch (err) {
    console.log("\n❌ Something went wrong.");
    return;
  }

  console.log(" done!\n");

  const cleaned = aiRaw.replace(/```json|```/g, "").trim();

  let parsed;

  try {
    parsed = JSON.parse(cleaned);

    if (!parsed.improved_title || !parsed.summary || !parsed.severity) {
      throw new Error("Missing fields");
    }

  } catch (err) {
    console.log("❌ AI returned invalid format.");
    console.log("\nRaw output:\n", aiRaw);
    return;
  }

  const ticket = {
    original: {
      title: cleanTitle,
      description: cleanDescription
    },
    ai: parsed,
    createdAt: new Date().toISOString()
  };

  saveDraft(ticket);

  console.log("==============================");
  console.log("     AI GENERATED DRAFT");
  console.log("==============================\n");

  console.log(`Title    : ${parsed.improved_title}`);
  console.log(`Summary  : ${parsed.summary}`);
  console.log(`Severity : ${parsed.severity.toUpperCase()}`);

  console.log("\n✔ Draft saved!");
  console.log("👉 Run: triage review");
}

// ===================== AI FUNCTION (WITH FALLBACK) =====================

async function generateSummary(title, description) {
  if (!process.env.GOOGLE_API_KEY) {
    console.log("\n⚠️ GOOGLE_API_KEY not set -> using fallback mode\n");
    return fallbackSummary(title, description);
  }

  const prompt = `
You are a support engineer assistant.

Title: ${title}
Description: ${description}

Return ONLY valid JSON:
{
  "improved_title": "",
  "summary": "",
  "severity": "low | medium | high"
}
`;

  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      return response.text;

    } catch (err) {
      if (err.status === 503 && attempt < MAX_RETRIES) {
        console.log(`\n⚠️ AI busy... retrying`);
        await new Promise(res => setTimeout(res, 1500));
      } else {
        console.log("\n⚠️ AI unavailable → using fallback mode\n");
        return fallbackSummary(title, description);
      }
    }
  }
}

// ===================== FALLBACK (OFFLINE AI) =====================

function fallbackSummary(title, description) {
  let severity = "low";

  const text = (title + " " + description).toLowerCase();

  if (
    text.includes("not working") ||
    text.includes("cannot") ||
    text.includes("error") ||
    text.includes("fail")
  ) {
    severity = "high";
  } else if (
    text.includes("slow") ||
    text.includes("issue") ||
    text.includes("problem")
  ) {
    severity = "medium";
  }

  return JSON.stringify({
    improved_title: title.charAt(0).toUpperCase() + title.slice(1),
    summary: description,
    severity: severity
  });
}

// ===================== FILE HANDLING =====================

function saveDraft(data) {
  fs.writeFileSync("draft.json", JSON.stringify(data, null, 2));
}

// ===================== REVIEW =====================

function reviewDraft() {
  if (!fs.existsSync("draft.json")) {
    console.log("❌ No draft found. Run `triage` first.");
    return;
  }

  const data = JSON.parse(fs.readFileSync("draft.json"));

  console.log("==============================");
  console.log("        REVIEW DRAFT");
  console.log("==============================\n");

  console.log("Original Input:");
  console.log(data.original);

  console.log("\nAI Output:");
  console.log(data.ai);
}

// ===================== EXPORT =====================

function exportTicket() {
  if (!fs.existsSync("draft.json")) {
    console.log("❌ No draft found. Run `triage` first.");
    return;
  }

  const data = JSON.parse(fs.readFileSync("draft.json"));

  fs.writeFileSync("ticket.json", JSON.stringify(data, null, 2));

  console.log("✅ Exported to ticket.json");
}
