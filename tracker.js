// ============================================================
//  READING TRACKER — Google Apps Script  (v3 — Open Source)
//
//  SETUP STEPS (one-time):
//  1. Create a new Google Sheet
//  2. Open Extensions → Apps Script
//  3. Paste this entire file (replace any existing code)
//  4. Open the 📚 Reading Tracker menu → 🚀 Run Setup Wizard
//     — Creates the ⚙️ Settings tab and prompts for your
//       Anthropic API key, builds all sheet tabs, and installs
//       both daily triggers automatically.
//
//  HOW EVALUATIONS WORK (no external tools needed):
//  • A time-based trigger fires at your configured EVAL HOUR.
//  • evaluatePendingEntries() reads the Daily Log, calls the
//    Anthropic Claude API via UrlFetchApp, writes results back
//    to the sheet, and emails the whole family.
//  • A second trigger fires at ALERT HOUR to remind the family
//    if no reading entry was logged the previous day.
//
//  Works for any student, any grade (K–12), zero code editing.
// ============================================================

// ─── TAB NAMES ──────────────────────────────────────────────
const TABS = {
  SETTINGS:     "⚙️ Settings",
  DAILY_LOG:    "📖 Daily Log",
  READING_PLAN: "📅 Reading Plan",
  BOOK_LIST:    "📚 Book List",
  EVALUATIONS:  "🎯 Claude Evaluations",
};

// ─── GRADE RUBRICS ──────────────────────────────────────────
const RUBRICS = {
  GRADES_1_2: `The student is in grades 1-2. Evaluate for:
- Naming the main character(s)
- Describing one thing that happened (main event)
- Identifying the setting (where/when)
- Using at least one detail from the text
Feedback should be very simple, encouraging, and use short sentences.
Score 7+ if they named a character AND an event. Score 5-6 if very vague.
Ask questions like: "Who is the story about?" "What happened first?"`,

  GRADES_3_4: `The student is in grades 3-4. Evaluate for:
- Identifying problem and solution
- Describing the setting with detail
- Including at least 2 specific events in sequence
- Using one piece of text evidence (a detail, action, or description)
Feedback should be encouraging and specific.
Score 7+ if they included a problem/solution AND evidence.
Ask questions like: "What problem did the character face?" "What detail from the book supports your idea?"`,

  GRADES_5_6: `The student is in grades 5-6. Evaluate for:
- Comprehension of key events, characters, and setting
- Use of specific textual evidence (details, actions, descriptions)
- Clarity and sentence structure
- Capturing main events and turning points
Score 7-8 for solid comprehension with evidence; 5-6 for decent but vague; 4 or below for sparse.
Ask one recall question, one evidence question, one higher-order thinking question about theme or character motivation.`,

  GRADES_7_8: `The student is in grades 7-8. Evaluate for:
- Analysis of character motivation and development
- Identification of theme and how events support it
- Use of literary devices (foreshadowing, symbolism, irony) if present
- Cited textual evidence with explanation
- Clear topic sentence and organized paragraph structure
Score 8+ only if they demonstrate analysis beyond plot summary.
Ask questions that require synthesis and inference, not just recall.`,

  GRADES_9_10: `The student is in grades 9-10. Evaluate for:
- Thesis-based analysis (not just plot summary)
- Multiple pieces of textual evidence with explanation of significance
- Author's purpose and craft choices
- Connection to broader themes or real-world context
Score 8+ if they move beyond plot into analytical writing.`,

  GRADES_11_12: `The student is in grades 11-12. Evaluate for:
- Sophisticated literary analysis with arguable thesis
- Rhetorical analysis (how language/structure creates meaning)
- Synthesis across chapters or texts if applicable
- Evidence cited with line/page reference when possible
- Academic writing conventions
Score 9-10 only for genuinely analytical writing with strong evidence.`,
};

// ─── GRADE-BASED BOOK LISTS ─────────────────────────────────
const BOOK_LISTS = {
  "1-2": [
    "Frog and Toad Are Friends – Arnold Lobel",
    "Charlotte's Web – E.B. White",
    "The Boxcar Children – Gertrude Chandler Warner",
    "Magic Tree House: Dinosaurs Before Dark – Mary Pope Osborne",
    "Junie B. Jones and the Stupid Smelly Bus – Barbara Park",
    "Amelia Bedelia – Peggy Parish",
    "Nate the Great – Marjorie Weinman Sharmat",
    "Henry and Mudge – Cynthia Rylant",
    "The Mouse and the Motorcycle – Beverly Cleary",
    "My Father's Dragon – Ruth Stiles Gannett",
  ],
  "3-4": [
    "Because of Winn-Dixie – Kate DiCamillo",
    "Stuart Little – E.B. White",
    "The One and Only Bob – Katherine Applegate",
    "Ramona Quimby, Age 8 – Beverly Cleary",
    "Island of the Blue Dolphins – Scott O'Dell",
    "Sarah, Plain and Tall – Patricia MacLachlan",
    "Charlie and the Chocolate Factory – Roald Dahl",
    "James and the Giant Peach – Roald Dahl",
    "Little House on the Prairie – Laura Ingalls Wilder",
    "The Cricket in Times Square – George Selden",
  ],
  "5-6": [
    "The Giver – Lois Lowry",
    "Hatchet – Gary Paulsen",
    "Number the Stars – Lois Lowry",
    "Holes – Louis Sachar",
    "Bridge to Terabithia – Katherine Paterson",
    "Tuck Everlasting – Natalie Babbitt",
    "Roll of Thunder, Hear My Cry – Mildred D. Taylor",
    "Among the Hidden – Margaret Peterson Haddix",
    "Bud, Not Buddy – Christopher Paul Curtis",
    "Esperanza Rising – Pam Muñoz Ryan",
    "The One and Only Ivan – Katherine Applegate",
    "Wonder – R.J. Palacio",
    "Maniac Magee – Jerry Spinelli",
    "From the Mixed-Up Files of Mrs. Basil E. Frankweiler – E.L. Konigsburg",
    "The Phantom Tollbooth – Norton Juster",
  ],
  "7-8": [
    "The Outsiders – S.E. Hinton",
    "To Kill a Mockingbird – Harper Lee",
    "The Diary of a Young Girl – Anne Frank",
    "Animal Farm – George Orwell",
    "Lord of the Flies – William Golding",
    "A Wrinkle in Time – Madeleine L'Engle",
    "The Watsons Go to Birmingham – Christopher Paul Curtis",
    "Speak – Laurie Halse Anderson",
    "Flowers for Algernon – Daniel Keyes",
    "The House on Mango Street – Sandra Cisneros",
    "Ender's Game – Orson Scott Card",
    "The Maze Runner – James Dashner",
  ],
  "9-10": [
    "Of Mice and Men – John Steinbeck",
    "The Great Gatsby – F. Scott Fitzgerald",
    "Romeo and Juliet – William Shakespeare",
    "Night – Elie Wiesel",
    "The Catcher in the Rye – J.D. Salinger",
    "Brave New World – Aldous Huxley",
    "Fahrenheit 451 – Ray Bradbury",
    "A Raisin in the Sun – Lorraine Hansberry",
    "Their Eyes Were Watching God – Zora Neale Hurston",
    "The Kite Runner – Khaled Hosseini",
    "1984 – George Orwell",
  ],
  "11-12": [
    "Crime and Punishment – Fyodor Dostoevsky",
    "Beloved – Toni Morrison",
    "Hamlet – William Shakespeare",
    "Invisible Man – Ralph Ellison",
    "One Hundred Years of Solitude – Gabriel García Márquez",
    "Things Fall Apart – Chinua Achebe",
    "The Sound and the Fury – William Faulkner",
    "Mrs. Dalloway – Virginia Woolf",
    "Slaughterhouse-Five – Kurt Vonnegut",
    "The Road – Cormac McCarthy",
    "Middlemarch – George Eliot",
    "The Brothers Karamazov – Fyodor Dostoevsky",
  ],
};

// ============================================================
//  SETTINGS — read from ⚙️ Settings tab
// ============================================================

/**
 * Reads the ⚙️ Settings tab (col A = label, col B = value, rows 1–13).
 * Returns null if the tab hasn't been created yet.
 */
function _getSettings() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TABS.SETTINGS);
  if (!sheet) return null;

  const vals = sheet.getRange(1, 2, 13, 1).getValues().map(r => r[0]);

  const studentName  = vals[0]  ? String(vals[0]).trim()  : "Student";
  const grade        = vals[1]  ? parseInt(vals[1], 10)   : 6;
  const readingDays  = vals[2]  ? String(vals[2]).split(",").map(d => d.trim()) : ["Mon","Tue","Wed","Thu","Fri","Sat"];
  const alertHour    = vals[3]  ? parseInt(vals[3], 10)   : 7;
  const evalHour     = vals[4]  ? parseInt(vals[4], 10)   : 20;
  const parent1Name  = vals[5]  ? String(vals[5]).trim()  : "";
  const parent1Email = vals[6]  ? String(vals[6]).trim()  : "";
  const parent2Name  = vals[7]  ? String(vals[7]).trim()  : "";
  const parent2Email = vals[8]  ? String(vals[8]).trim()  : "";
  const siblingName  = vals[9]  ? String(vals[9]).trim()  : "";
  const siblingEmail = vals[10] ? String(vals[10]).trim() : "";
  const studentEmail = vals[11] ? String(vals[11]).trim() : "";

  const family = [];
  if (parent1Name  && parent1Email)  family.push({ name: parent1Name,  email: parent1Email  });
  if (parent2Name  && parent2Email)  family.push({ name: parent2Name,  email: parent2Email  });
  if (siblingName  && siblingEmail)  family.push({ name: siblingName,  email: siblingEmail  });
  if (studentEmail)                  family.push({ name: studentName,  email: studentEmail  });

  return {
    studentName, grade, readingDays, alertHour, evalHour,
    parent1Name, parent1Email, parent2Name, parent2Email,
    siblingName, siblingEmail, studentEmail,
    family,
  };
}

// ─── GRADE ENGINE ────────────────────────────────────────────

function _getGradeRubric(grade) {
  const g = parseInt(grade, 10);
  if (g <= 2)  return RUBRICS.GRADES_1_2;
  if (g <= 4)  return RUBRICS.GRADES_3_4;
  if (g <= 6)  return RUBRICS.GRADES_5_6;
  if (g <= 8)  return RUBRICS.GRADES_7_8;
  if (g <= 10) return RUBRICS.GRADES_9_10;
  return RUBRICS.GRADES_11_12;
}

function _getBooksForGrade(grade) {
  const g = parseInt(grade, 10);
  if (g <= 2)  return BOOK_LISTS["1-2"];
  if (g <= 4)  return BOOK_LISTS["3-4"];
  if (g <= 6)  return BOOK_LISTS["5-6"];
  if (g <= 8)  return BOOK_LISTS["7-8"];
  if (g <= 10) return BOOK_LISTS["9-10"];
  return BOOK_LISTS["11-12"];
}

// ============================================================
//  TRIGGER-BASED EVALUATION  (runs nightly at EVAL HOUR)
// ============================================================

/**
 * evaluatePendingEntries() — called by a time-based trigger.
 * Finds every Daily Log row with a summary but no Claude evaluation,
 * calls the Anthropic API for each, writes results to the sheet,
 * and emails the family.  No external tools required.
 */
function evaluatePendingEntries() {
  const settings = _getSettings();
  if (!settings) { Logger.log("Settings tab not found — skipping evaluation."); return; }

  const apiKey = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if (!apiKey) { Logger.log("ANTHROPIC_API_KEY not set — skipping evaluation."); return; }

  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet  = ss.getSheetByName(TABS.DAILY_LOG);
  const evalSheet = ss.getSheetByName(TABS.EVALUATIONS);
  const data      = logSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row       = data[i];
    const date      = row[0];
    const book      = row[1];
    const chapter   = row[2];
    const summary   = row[6];   // col G
    const claudeEval = row[8];  // col I

    const hasSummary = summary && summary.toString().trim() !== ""
                    && !summary.toString().includes("← fills this");
    const needsEval  = !claudeEval || claudeEval.toString().trim() === "";

    if (!hasSummary || !needsEval) continue;

    const entry = {
      rowNumber: i + 1,
      date:      date ? _formatDate(new Date(date)) : "",
      book:      book    ? book.toString()    : "",
      chapter:   chapter ? chapter.toString() : "",
      startPage: row[3]  ? row[3].toString()  : "",
      endPage:   row[4]  ? row[4].toString()  : "",
      summary:   summary.toString(),
    };

    try {
      const result = _evaluateEntry(entry, settings, apiKey);
      _writeEvaluationToSheet(logSheet, evalSheet, entry, result);
      _sendEvaluationEmail(entry, result, settings);
    } catch (err) {
      Logger.log(`Row ${entry.rowNumber} evaluation failed: ${err.message}`);
      logSheet.getRange(entry.rowNumber, 9).setValue(`⚠️ Evaluation failed: ${err.message}`);
    }
  }

  SpreadsheetApp.flush();
}

/**
 * Builds the prompt, calls the Claude API, and returns a parsed result object.
 */
function _evaluateEntry(entry, settings, apiKey) {
  const rubric = _getGradeRubric(settings.grade);
  const prompt = `You are evaluating a reading comprehension summary written by a student.

Student: ${settings.studentName}
Grade: ${settings.grade}
Book: ${entry.book}
Chapter/Section: ${entry.chapter}
Pages: ${entry.startPage}–${entry.endPage}

Grade Rubric:
${rubric}

Student's Summary:
${entry.summary}

Evaluate this summary and respond with ONLY a valid JSON object — no markdown, no code fences, no explanation outside the JSON. Use this exact structure:
{
  "evaluation": "2–3 sentence overall assessment, warm but honest",
  "missingPoints": "• Point one\n• Point two\n• Point three",
  "improvements": "• Step one\n• Step two\n• Step three",
  "score": <integer 1–10>,
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

  const raw = _callClaudeAPI(prompt, apiKey);

  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed  = JSON.parse(cleaned);

  // Normalise — guard against Claude returning arrays instead of strings
  const _str = (v, sep) => Array.isArray(v) ? v.join(sep) : (v != null ? String(v) : "");
  const rawScore = Array.isArray(parsed.score) ? parsed.score[0] : parsed.score;

  return {
    evaluation:   _str(parsed.evaluation,   " "),
    missingPoints: _str(parsed.missingPoints, "\n"),
    improvements:  _str(parsed.improvements,  "\n"),
    score:         parseFloat(rawScore) || 0,
    questions:     Array.isArray(parsed.questions) ? parsed.questions : [String(parsed.questions || "")],
  };
}

/**
 * Calls the Anthropic Messages API via UrlFetchApp.
 * Returns the raw text content of Claude's reply.
 */
function _callClaudeAPI(prompt, apiKey) {
  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    payload: JSON.stringify({
      model:      "claude-opus-4-7",
      max_tokens: 1024,
      messages:   [{ role: "user", content: prompt }],
    }),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`Anthropic API returned HTTP ${code}: ${response.getContentText().substring(0, 200)}`);
  }

  const body = JSON.parse(response.getContentText());
  return body.content[0].text;
}

/**
 * Writes evaluation results to the Daily Log (cols I, J, L) and Evaluations tab.
 */
function _writeEvaluationToSheet(logSheet, evalSheet, entry, result) {
  const scoreDisp = result.score > 0 ? String(result.score) : "";
  const questions = result.questions.join("\n\n");

  logSheet.getRange(entry.rowNumber, 9).setValue(
    `Score: ${scoreDisp}/10\n\n${result.evaluation}\n\n📌 Missing Points:\n${result.missingPoints}\n\n🔧 Improvements:\n${result.improvements}`
  );
  logSheet.getRange(entry.rowNumber, 10).setValue(questions);
  logSheet.getRange(entry.rowNumber, 12).setValue("✅ Done");

  // Append row to Evaluations tab — all values cast to primitives (avoids Java ref bug)
  evalSheet.appendRow([
    String(entry.date    || ""),   // A — Date
    String(entry.book    || ""),   // B — Book
    String(entry.chapter || ""),   // C — Chapter
    String(entry.summary || ""),   // D — Student Summary
    result.missingPoints,          // E — Missing Evidence Points
    result.improvements,           // F — Improvement Steps
    result.score,                  // G — Score (stored as number)
    questions,                     // H — Questions to Answer
    "",                            // I — Student Answers (filled manually)
  ]);
}

// ============================================================
//  WEB APP ENDPOINTS (optional — for custom integrations)
// ============================================================

/**
 * doGet — returns student name, grade, and unevaluated rows.
 * Only needed if you want a custom external evaluator.
 * The standard path is the evaluatePendingEntries() trigger above.
 */
function doGet(e) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const sheet    = ss.getSheetByName(TABS.DAILY_LOG);
  const settings = _getSettings();
  const data     = sheet.getDataRange().getValues();

  const pending = [];
  for (let i = 1; i < data.length; i++) {
    const row        = data[i];
    const summary    = row[6];
    const claudeEval = row[8];

    if (summary && summary.toString().trim() !== ""
        && !summary.toString().includes("← fills this")
        && (!claudeEval || claudeEval.toString().trim() === "")) {
      pending.push({
        rowNumber: i + 1,
        date:      row[0] ? _formatDate(new Date(row[0])) : "",
        book:      row[1] ? row[1].toString() : "",
        chapter:   row[2] ? row[2].toString() : "",
        startPage: row[3] ? row[3].toString() : "",
        endPage:   row[4] ? row[4].toString() : "",
        summary:   summary.toString(),
      });
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      studentName: settings ? settings.studentName : "Student",
      grade:       settings ? settings.grade       : 6,
      pending,
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * doPost — receives an evaluation payload from an external tool and writes it
 * to the sheet.  Only needed if you want a custom external evaluator.
 */
function doPost(e) {
  try {
    const payload   = JSON.parse(e.postData.contents);
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet  = ss.getSheetByName(TABS.DAILY_LOG);
    const evalSheet = ss.getSheetByName(TABS.EVALUATIONS);
    const settings  = _getSettings();

    const row = parseInt(payload.rowNumber, 10);

    const _toString = (v, sep) =>
      Array.isArray(v) ? v.join(sep) : (v != null ? String(v) : "");

    const rawScore = Array.isArray(payload.score) ? payload.score[0] : payload.score;
    const result = {
      evaluation:    _toString(payload.evaluation,   "\n"),
      missingPoints: _toString(payload.missingPoints, "\n• "),
      improvements:  _toString(payload.improvements,  "\n• "),
      score:         parseFloat(rawScore) || 0,
      questions:     Array.isArray(payload.questions) ? payload.questions : [String(payload.questions || "")],
    };

    const entry = {
      rowNumber: row,
      date:      payload.date    || "",
      book:      payload.book    || "",
      chapter:   payload.chapter || "",
      summary:   payload.summary || "",
    };

    _writeEvaluationToSheet(logSheet, evalSheet, entry, result);
    SpreadsheetApp.flush();
    _sendEvaluationEmail(entry, result, settings);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", row }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log(err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
//  DAILY MISSING-ENTRY TRIGGER  (fires at ALERT HOUR)
// ============================================================

function checkDailyEntry() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const sheet    = ss.getSheetByName(TABS.DAILY_LOG);
  const settings = _getSettings();

  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Skip if yesterday wasn't a configured reading day
  if (settings && settings.readingDays && settings.readingDays.length > 0) {
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const ydayName = dayNames[yesterday.getDay()];
    if (!settings.readingDays.includes(ydayName)) return;
  }

  const yDateStr = _formatDate(yesterday);
  const data     = sheet.getDataRange().getValues();
  const found    = data.slice(1).some(row => {
    const cell = row[0];
    return cell && _formatDate(new Date(cell)) === yDateStr;
  });

  if (!found) _sendMissingEntryEmail(yDateStr, settings);
}

function _sendMissingEntryEmail(missedDate, settings) {
  if (!settings || settings.family.length === 0) return;
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const url = ss.getUrl();

  const subject = `📚 Reading Reminder: No entry logged for ${missedDate}`;
  const html    = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a73e8;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">📚 Reading Tracker</h2>
        <p style="margin:4px 0 0;opacity:.85">Daily Accountability Alert</p>
      </div>
      <div style="background:#f8f9fa;padding:24px;border:1px solid #dee2e6;border-top:none;border-radius:0 0 8px 8px">
        <p>Hi Family,</p>
        <p>No reading log entry was found for <strong>${missedDate}</strong>.</p>
        <p>Please remind <strong>${settings.studentName}</strong> to:</p>
        <ol>
          <li>Open the <a href="${url}">Reading Tracker</a></li>
          <li>Log today's reading — book, chapter, pages, and summary</li>
        </ol>
        <div style="background:#fff3e0;border-left:4px solid #FF9800;padding:12px 16px;margin:16px 0;border-radius:4px">
          <strong>Reminder:</strong> Claude evaluates the daily summary every evening at ${settings.evalHour}:00.
          A missing entry means no feedback tonight!
        </div>
        <a href="${url}" style="background:#1a73e8;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">
          Open Reading Tracker →
        </a>
      </div>
    </div>`;

  settings.family.forEach(m => GmailApp.sendEmail(m.email, subject, "", { htmlBody: html }));
}

// ============================================================
//  EVALUATION EMAIL  (fired after writing results to sheet)
// ============================================================

function _sendEvaluationEmail(entry, result, settings) {
  if (!settings || settings.family.length === 0) return;
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const url = ss.getUrl();

  const subject      = `📚 Reading Evaluation — ${entry.book} (${entry.chapter}) — ${entry.date}`;
  const scoreDisp    = result.score > 0 ? String(result.score) : "—";
  const questionsHtml = result.questions
    .filter(Boolean)
    .map(q => `<li style="margin-bottom:8px">${q}</li>`).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#1a73e8;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">📚 Reading Evaluation</h2>
        <p style="margin:4px 0 0;opacity:.85">${entry.book} · ${entry.chapter} · ${entry.date}</p>
      </div>
      <div style="padding:24px;border:1px solid #dee2e6;border-top:none;border-radius:0 0 8px 8px">
        <h3 style="color:#1a73e8;margin-top:0">Overall Evaluation</h3>
        <p>${result.evaluation.replace(/\n/g, "<br>")}</p>
        <div style="background:#e8f5e9;border-left:4px solid #4CAF50;padding:12px 16px;border-radius:4px;margin:12px 0">
          <strong>Score: ${scoreDisp}/10</strong>
        </div>
        <h3 style="color:#e65100">📌 Missing Evidence &amp; Key Points</h3>
        <p style="white-space:pre-line">${result.missingPoints}</p>
        <h3 style="color:#6a1b9a">🔧 Steps to Improve</h3>
        <p style="white-space:pre-line">${result.improvements}</p>
        <h3 style="color:#0d47a1">❓ Questions for ${settings.studentName}</h3>
        <ol>${questionsHtml}</ol>
        <p style="font-size:13px;color:#555"><em>
          ${settings.studentName} — write your answers in the
          <strong>🎯 Claude Evaluations</strong> tab, "Answers" column.
        </em></p>
        <a href="${url}" style="background:#1a73e8;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:16px">
          Open Reading Tracker →
        </a>
      </div>
    </div>`;

  settings.family.forEach(m => GmailApp.sendEmail(m.email, subject, "", { htmlBody: html }));
}

// ============================================================
//  SETUP WIZARD  (guided first-run)
// ============================================================

/**
 * runSetupWizard() — guided first-run.
 * Creates the Settings tab → user fills it in → collects API key →
 * builds all sheet tabs → installs both triggers → shares with family.
 */
function runSetupWizard() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Step 1 — create Settings tab with pre-filled labels
  _setupSettings(ss);
  ui.alert(
    "📚 Reading Tracker Setup — Step 1 of 4",
    "Welcome! Your ⚙️ Settings tab has been created.\n\n" +
    "Please fill in ALL rows now:\n" +
    "  • STUDENT NAME — your child's first name\n" +
    "  • GRADE — integer 1 through 12\n" +
    "  • READING DAYS — e.g. Mon,Tue,Wed,Thu,Fri,Sat\n" +
    "  • ALERT HOUR — hour to send the missing-entry email (0–23)\n" +
    "  • EVAL HOUR — hour Claude evaluates summaries (0–23)\n" +
    "  • Parent, sibling, and student email addresses\n\n" +
    "Click OK once the Settings tab is filled in.",
    ui.ButtonSet.OK
  );

  // Step 2 — validate settings
  const settings = _getSettings();
  if (!settings || !settings.studentName || settings.studentName === "Student") {
    ui.alert("⚠️ STUDENT NAME looks empty. Please fill in the ⚙️ Settings tab and run the wizard again.");
    return;
  }
  if (!settings.parent1Email) {
    ui.alert("⚠️ PARENT 1 EMAIL is required. Please fill it in and run the wizard again.");
    return;
  }

  // Step 3 — Anthropic API key (stored securely, never in sheet)
  const keyResult = ui.prompt(
    "🔐 Step 2 of 4: Anthropic API Key",
    "Enter your Anthropic API key (starts with sk-ant-...).\n\n" +
    "This is stored in Script Properties — it will NEVER appear in the sheet or any cell.\n\n" +
    "Get your key at console.anthropic.com → API Keys.",
    ui.ButtonSet.OK_CANCEL
  );
  if (keyResult.getSelectedButton() !== ui.Button.OK) return;
  const apiKey = keyResult.getResponseText().trim();
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    ui.alert("❌ Invalid key format. Keys start with sk-ant-. Please run the wizard again.");
    return;
  }
  PropertiesService.getScriptProperties().setProperty("ANTHROPIC_API_KEY", apiKey);

  // Step 4 — build all sheet tabs
  ui.alert(
    "🛠️ Step 3 of 4: Building Your Sheet",
    `Setting up tabs for ${settings.studentName} (Grade ${settings.grade}).\n\nClick OK to continue.`,
    ui.ButtonSet.OK
  );
  _setupDailyLog(ss);
  _setupReadingPlan(ss);
  _setupBookList(ss);
  _setupEvaluations(ss);
  const blank = ss.getSheetByName("Sheet1");
  if (blank) ss.deleteSheet(blank);
  SpreadsheetApp.flush();

  // Step 5 — install both triggers and share
  _installTriggersSilent(settings.alertHour, settings.evalHour);
  shareSheet();

  ui.alert(
    "✅ Step 4 of 4: Setup Complete!",
    `Reading Tracker is ready for ${settings.studentName} (Grade ${settings.grade})!\n\n` +
    "Two triggers have been installed:\n" +
    `  ⏰ ${settings.alertHour}:00 — Daily reminder if no entry logged\n` +
    `  🤖 ${settings.evalHour}:00 — Claude evaluates today's summary\n\n` +
    "(Triggers fire within ±15 minutes of the scheduled hour.)\n\n" +
    "Share the spreadsheet URL with your student — they fill in the\n" +
    "📖 Daily Log each day after reading.",
    ui.ButtonSet.OK
  );
}

// ============================================================
//  TRIGGER MANAGEMENT
// ============================================================

function installTrigger() {
  const settings = _getSettings();
  const alert    = settings ? settings.alertHour : 7;
  const eval_    = settings ? settings.evalHour  : 20;
  _installTriggersSilent(alert, eval_);
  SpreadsheetApp.getUi().alert(
    `✅ Two triggers installed:\n` +
    `  ${alert}:00 — daily missing-entry reminder\n` +
    `  ${eval_}:00 — Claude evaluates summaries`
  );
}

function _installTriggersSilent(alertHour, evalHour) {
  // Remove existing triggers for both handlers before reinstalling
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === "checkDailyEntry" || fn === "evaluatePendingEntries") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("checkDailyEntry")
    .timeBased().everyDays(1).atHour(alertHour || 7).create();
  ScriptApp.newTrigger("evaluatePendingEntries")
    .timeBased().everyDays(1).atHour(evalHour || 20).create();
}

// ============================================================
//  SAFE HEADER + FORMATTING UPDATE  (keeps existing data)
// ============================================================

/**
 * updateHeadersOnly() — refreshes headers, widths, dropdowns, and
 * conditional formatting WITHOUT touching any data rows.
 */
function updateHeadersOnly() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const sheet    = ss.getSheetByName(TABS.DAILY_LOG);
  const settings = _getSettings();
  const name     = settings ? settings.studentName : "Student";
  const sibling  = settings ? settings.siblingName : "Sibling";

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Daily Log tab not found. Run the Setup Wizard first.");
    return;
  }

  _applyDailyLogFormatting(sheet, name, sibling);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("✅ Headers updated. All existing data is intact.");
}

// ============================================================
//  SHEET SETUP  (called by wizard; clears and rebuilds)
// ============================================================

function setupSheet() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = _getSettings();

  if (!settings) {
    SpreadsheetApp.getUi().alert("⚠️ Settings tab not found. Run the Setup Wizard from the menu first.");
    return;
  }

  _setupDailyLog(ss);
  _setupReadingPlan(ss);
  _setupBookList(ss);
  _setupEvaluations(ss);
  const blank = ss.getSheetByName("Sheet1");
  if (blank) ss.deleteSheet(blank);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    `✅ Sheet rebuilt for ${settings.studentName} (Grade ${settings.grade}).\n` +
    "Triggers are still running — no need to reinstall them."
  );
}

function _setupSettings(ss) {
  if (ss.getSheetByName(TABS.SETTINGS)) return; // don't overwrite existing data

  const sheet = ss.insertSheet(TABS.SETTINGS, 0);
  sheet.setTabColor("#607D8B");

  const rows = [
    ["STUDENT NAME",    ""],
    ["GRADE",           ""],
    ["READING DAYS",    "Mon,Tue,Wed,Thu,Fri,Sat"],
    ["ALERT HOUR (AM)", "7"],
    ["EVAL HOUR (PM)",  "20"],
    ["PARENT 1 NAME",   ""],
    ["PARENT 1 EMAIL",  ""],
    ["PARENT 2 NAME",   ""],
    ["PARENT 2 EMAIL",  ""],
    ["SIBLING NAME",    ""],
    ["SIBLING EMAIL",   ""],
    ["STUDENT EMAIL",   ""],
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);

  const labelCol = sheet.getRange(1, 1, rows.length, 1);
  labelCol.setBackground("#37474F").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 400);
  sheet.setFrozenColumns(1);

  sheet.getRange(2, 2).setNote("Integer 1–12. Drives the grade rubric for AI evaluation.");
  sheet.getRange(3, 2).setNote("Comma-separated 3-letter codes: Mon,Tue,Wed,Thu,Fri,Sat,Sun");
  sheet.getRange(4, 2).setNote("24h format (0–23). 7 = 7 AM. Missing-entry reminder.");
  sheet.getRange(5, 2).setNote("24h format (0–23). 20 = 8 PM. Claude evaluation trigger.");
}

function _setupDailyLog(ss) {
  const settings = _getSettings();
  const name    = settings ? settings.studentName : "Student";
  const sibling = settings ? settings.siblingName : "Sibling";

  let sheet = ss.getSheetByName(TABS.DAILY_LOG) || ss.insertSheet(TABS.DAILY_LOG);
  sheet.clear();
  sheet.setTabColor("#4CAF50");

  _applyDailyLogFormatting(sheet, name, sibling);

  // Pages Read auto-formula in col F for data rows
  for (let r = 2; r <= 200; r++) {
    sheet.getRange(r, 6).setFormula(`=IF(AND(D${r}<>"",E${r}<>""),E${r}-D${r}+1,"")`);
  }

  // Wrap text on all data rows so content is readable in the cell
  sheet.getRange(2, 1, 199, 12).setWrap(true).setVerticalAlignment("top");

  // Set a comfortable default height for data rows (shows ~3 lines of text)
  sheet.setRowHeightsForced(2, 199, 70);
}

/**
 * Shared formatting logic used by both _setupDailyLog and updateHeadersOnly.
 */
function _applyDailyLogFormatting(sheet, name, sibling) {
  const sibLabel = sibling ? `Sibling Evaluation\n(${sibling})` : "Sibling Evaluation";
  const headers  = [
    "Date", "Book Title", "Chapter / Section", "Start Page", "End Page",
    "Pages Read", `Summary by ${name}`, sibLabel,
    "Claude Evaluation", "Questions to Answer", "Family Notes", "Status",
  ];

  const hr = sheet.getRange(1, 1, 1, headers.length);
  hr.setValues([headers]);
  hr.setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setRowHeight(1, 50);

  [100,180,160,90,90,90,320,200,320,260,180,110]
    .forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // Status dropdown — col L
  sheet.getRange(2, 12, 200).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["✅ Done","⏳ In Progress","❌ Missed"], true).build()
  );

  sheet.setFrozenRows(1);

  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("❌ Missed").setBackground("#fce8e6")
      .setRanges([sheet.getRange("A2:L200")]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("✅ Done").setBackground("#e6f4ea")
      .setRanges([sheet.getRange("A2:L200")]).build(),
  ]);
}

function _setupReadingPlan(ss) {
  let sheet = ss.getSheetByName(TABS.READING_PLAN) || ss.insertSheet(TABS.READING_PLAN);
  sheet.clear();
  sheet.setTabColor("#FF9800");

  const headers = [
    "Book Title","Total Chapters","Total Pages","Start Date",
    "Target End Date","Chapters / Week","Current Chapter","% Complete","Notes",
  ];
  const hr = sheet.getRange(1,1,1,headers.length);
  hr.setValues([headers]).setBackground("#e65100").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  [200,120,120,110,130,130,130,110,220].forEach((w,i) => sheet.setColumnWidth(i+1,w));

  for (let r = 2; r <= 20; r++) {
    sheet.getRange(r,8).setFormula(
      `=IF(AND(B${r}<>"",G${r}<>""),ROUND((G${r}/B${r})*100,1)&"%","")`
    );
  }
}

function _setupBookList(ss) {
  const settings  = _getSettings();
  const grade     = settings ? settings.grade : 6;
  const bookArray = _getBooksForGrade(grade);

  let sheet = ss.getSheetByName(TABS.BOOK_LIST) || ss.insertSheet(TABS.BOOK_LIST);
  sheet.clear();
  sheet.setTabColor("#9C27B0");

  const hr = sheet.getRange(1,1,1,4);
  hr.setValues([["📚 Book Title","Author","Status","Notes / School Assignment"]]);
  hr.setBackground("#7B1FA2").setFontColor("#ffffff").setFontWeight("bold");
  [280,180,100,200].forEach((w,i) => sheet.setColumnWidth(i+1,w));

  sheet.getRange(2,3,30).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["Not Started","In Progress","Completed","School Book"],true).build()
  );

  bookArray.forEach((book, i) => {
    const parts = book.split(" – ");
    sheet.getRange(i+2,1).setValue(parts[0] || book);
    sheet.getRange(i+2,2).setValue(parts[1] || "");
    sheet.getRange(i+2,3).setValue("Not Started");
  });

  // Populate book title dropdown in Daily Log col B
  const dailyLog = ss.getSheetByName(TABS.DAILY_LOG);
  if (dailyLog) {
    const titles = bookArray.map(b => b.split(" – ")[0]);
    dailyLog.getRange(2, 2, 200).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(titles, true).build()
    );
  }

  sheet.setFrozenRows(1);
}

/**
 * fixEvaluationsTab() — clears any cells containing Java array reference garbage
 * strings ([Ljava.lang.Object;@...) left by a past formatting bug.
 * Safe to run at any time.
 */
function fixEvaluationsTab() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TABS.EVALUATIONS);
  if (!sheet) { SpreadsheetApp.getUi().alert("Evaluations tab not found."); return; }

  const data    = sheet.getDataRange().getValues();
  let   cleared = 0;

  for (let r = 1; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = String(data[r][c]);
      if (val.startsWith("[Ljava.lang.Object;") || val.startsWith("[L")) {
        sheet.getRange(r + 1, c + 1).clearContent();
        cleared++;
      }
    }
  }

  // Ensure Score column (G) stores numbers
  sheet.getRange(2, 7, Math.max(data.length - 1, 1)).setNumberFormat("0");

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    `✅ Fixed ${cleared} corrupted cell(s).\n\nTrigger will re-evaluate tonight, or run "Evaluate Now" from the menu.`
  );
}

function _setupEvaluations(ss) {
  const settings = _getSettings();
  const name     = settings ? settings.studentName : "Student";

  let sheet = ss.getSheetByName(TABS.EVALUATIONS) || ss.insertSheet(TABS.EVALUATIONS);
  sheet.clear();
  sheet.setTabColor("#F44336");

  const headers = [
    "Date","Book","Chapter",`${name}'s Summary`,
    "Missing Evidence Points","Improvement Steps",
    "Score (1–10)","Questions Asked",`${name}'s Answers`,
  ];
  const hr = sheet.getRange(1,1,1,headers.length);
  hr.setValues([headers]).setBackground("#b71c1c").setFontColor("#ffffff").setFontWeight("bold");
  [100,180,160,320,280,280,110,280,280].forEach((w,i) => sheet.setColumnWidth(i+1,w));

  // Wrap text so evaluations are readable in the cell
  sheet.getRange(2, 1, 199, 9).setWrap(true).setVerticalAlignment("top");
  sheet.setRowHeightsForced(2, 199, 70);
  sheet.setFrozenRows(1);
}

// ============================================================
//  SHARING
// ============================================================

function shareSheet() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = _getSettings();

  if (!settings || settings.family.length === 0) {
    SpreadsheetApp.getUi().alert("⚠️ No family emails found in the ⚙️ Settings tab.");
    return;
  }

  settings.family.forEach(m => {
    try { ss.addEditor(m.email); }
    catch(e) { Logger.log(`Could not share with ${m.email}: ${e.message}`); }
  });
  SpreadsheetApp.getUi().alert("✅ Sheet shared with all family members!");
}

// ============================================================
//  CUSTOM MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📚 Reading Tracker")
    .addItem("🚀 Run Setup Wizard (first time)", "runSetupWizard")
    .addItem("▶️ Evaluate Now (manual run)", "evaluatePendingEntries")
    .addSeparator()
    .addItem("🔄 Update Headers Only (safe — keeps data)", "updateHeadersOnly")
    .addItem("🛠️ Fix Corrupted Cells in Evaluations Tab", "fixEvaluationsTab")
    .addSeparator()
    .addItem("⚙️ Rebuild All Sheet Tabs (clears data)", "setupSheet")
    .addItem("🔗 Share with Family", "shareSheet")
    .addItem("⏰ Reinstall Daily Triggers", "installTrigger")
    .addSeparator()
    .addItem("🔔 Test: Send Missing Entry Email", "testMissingEmail")
    .addToUi();
}

function testMissingEmail() {
  const settings = _getSettings();
  _sendMissingEntryEmail(_formatDate(new Date()), settings);
  SpreadsheetApp.getUi().alert("✅ Test email sent!");
}

// ============================================================
//  UTILITIES
// ============================================================

function _formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
