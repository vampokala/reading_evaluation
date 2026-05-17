# 📚 Reading Tracker

**A Google Sheets + Apps Script tool that gives your child AI-powered reading feedback every night — automatically.**

Parents fill in a Settings tab once. Students log their reading daily. Claude evaluates every summary at a scheduled time and emails the whole family. No coding required after setup.

Works for any student, **grades K–12**, with rubrics that adapt automatically.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DAILY FLOW                                  │
│                                                                     │
│  Student reads          Student fills in         Trigger fires      │
│  a chapter     ──────▶  📖 Daily Log    ──────▶  at EVAL HOUR      │
│                          (summary col)                              │
│                                                        │            │
│                                                        ▼            │
│                                              Claude API called      │
│                                              (UrlFetchApp)          │
│                                                        │            │
│                                                        ▼            │
│  Family reads          📧 Email sent to   ◀──  Results written      │
│  evaluation   ◀──────  whole family            to sheet             │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                         NEXT MORNING                                │
│                                                                     │
│  If no entry        Trigger fires at       📧 Reminder email        │
│  was logged  ──────▶ ALERT HOUR      ──────▶ sent to family        │
└─────────────────────────────────────────────────────────────────────┘
```

### Sheet Tabs

| Tab | Color | Purpose |
|-----|-------|---------|
| ⚙️ Settings | Gray | Family config — names, emails, grade, schedule |
| 📖 Daily Log | Green | Student logs date, book, chapter, pages, summary |
| 📅 Reading Plan | Orange | Book-level goals and progress tracking |
| 📚 Book List | Purple | Grade-appropriate books with status dropdowns |
| 🎯 Claude Evaluations | Red | Full history of AI evaluations and student answers |

---

## Prerequisites

| What you need | Where to get it |
|---------------|-----------------|
| Google account | Already have one |
| Anthropic API key | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key |

> **API cost:** Each evaluation calls `claude-opus-4-7`. One evaluation ≈ $0.01–$0.03 depending on summary length. A full month of daily reading ≈ $0.30–$0.90.

---

## One-Time Setup (5–10 minutes)

### Step 1 — Create a Google Sheet

1. Go to [sheets.new](https://sheets.new) to create a blank spreadsheet
2. Name it something like **"[Child's Name] Reading Tracker 2025"**

```
┌─────────────────────────────────────────────┐
│  📄 [Child's Name] Reading Tracker 2025     │
│                                             │
│  Sheet1                              +      │
└─────────────────────────────────────────────┘
```

---

### Step 2 — Paste the Script

1. In your spreadsheet, click **Extensions → Apps Script**

```
┌─────────────────────────────────────┐
│  Extensions  ▾                      │
│  ─────────────────────────────────  │
│  Add-ons                      ▶     │
│  Apps Script          ← click this  │
│  Macros                       ▶     │
└─────────────────────────────────────┘
```

2. You'll see a code editor with a default empty function. **Select all and delete it.**

3. Open `tracker.js` from this repo, **copy the entire file**, and paste it into the editor.

4. Click the **Save** button (💾) or press `Ctrl+S` / `Cmd+S`.

```
┌──────────────────────────────────────────────┐
│  Apps Script  │  tracker.js                  │
│               │                              │
│  Files        │  // ===== READING TRACKER    │
│  ▸ tracker.js │  //   Google Apps Script     │
│               │  // ...                      │
│               │  [  Save  ]                  │
└──────────────────────────────────────────────┘
```

---

### Step 3 — Run the Setup Wizard

1. **Close the Apps Script tab** and return to your Google Sheet
2. **Refresh the page** — a new menu appears: **📚 Reading Tracker**
3. Click **📚 Reading Tracker → 🚀 Run Setup Wizard (first time)**

```
┌─────────────────────────────────────────────────────┐
│  📚 Reading Tracker  ▾                              │
│  ──────────────────────────────────────────────     │
│  🚀 Run Setup Wizard (first time)    ← click this   │
│  ▶️  Evaluate Now (manual run)                      │
│  ──────────────────────────────────────────────     │
│  🔄 Update Headers Only (safe — keeps data)         │
│  🛠️  Fix Corrupted Cells in Evaluations Tab         │
│  ──────────────────────────────────────────────     │
│  ⚙️  Rebuild All Sheet Tabs (clears data)           │
│  🔗 Share with Family                               │
│  ⏰ Reinstall Daily Triggers                        │
│  ──────────────────────────────────────────────     │
│  🔔 Test: Send Missing Entry Email                  │
└─────────────────────────────────────────────────────┘
```

> **Permissions prompt:** Apps Script will ask you to authorize the script.
> Click **Review permissions → Advanced → Go to [project name] (unsafe) → Allow**.
> This is normal for any Apps Script — the script only accesses your own sheet and Gmail.

---

### Step 4 — Fill In the ⚙️ Settings Tab

The wizard creates the Settings tab and pauses here. **Switch to the ⚙️ Settings tab** and fill in Column B:

```
┌──────────────────────┬────────────────────────────────────┐
│ SETTING              │ YOUR VALUE                         │
├──────────────────────┼────────────────────────────────────┤
│ STUDENT NAME         │ Tejas                              │
│ GRADE                │ 6                                  │
│ READING DAYS         │ Mon,Tue,Wed,Thu,Fri,Sat            │
│ ALERT HOUR (AM)      │ 7      ← 7 AM reminder email      │
│ EVAL HOUR (PM)       │ 20     ← 8 PM Claude evaluation   │
│ PARENT 1 NAME        │ Vamshi (Dad)                       │
│ PARENT 1 EMAIL       │ dad@example.com                    │
│ PARENT 2 NAME        │ Srilatha (Mom)   (optional)        │
│ PARENT 2 EMAIL       │ mom@example.com  (optional)        │
│ SIBLING NAME         │ Shreyas (Brother) (optional)       │
│ SIBLING EMAIL        │ sibling@example.com (optional)     │
│ STUDENT EMAIL        │ student@example.com                │
└──────────────────────┴────────────────────────────────────┘
```

> **READING DAYS:** Use 3-letter codes separated by commas. No spaces around commas.
> Reminder emails are skipped on days not listed.

When all rows are filled, **click OK** in the wizard dialog to continue.

---

### Step 5 — Enter Your Anthropic API Key

A secure dialog appears:

```
┌─────────────────────────────────────────────────┐
│  🔐 Step 2 of 4: Anthropic API Key              │
│                                                 │
│  Enter your Anthropic API key                   │
│  (starts with sk-ant-...)                       │
│                                                 │
│  This is stored securely in Script Properties   │
│  — it will NEVER appear in the sheet.           │
│                                                 │
│  [________________________]                     │
│                                                 │
│               [ Cancel ]  [ OK ]               │
└─────────────────────────────────────────────────┘
```

Paste your key (from [console.anthropic.com](https://console.anthropic.com) → API Keys) and click **OK**.

> The key is stored in Google's `PropertiesService` — encrypted, per-script, never visible in the spreadsheet.

---

### Step 6 — Wizard Finishes

The wizard will:
- Build all five sheet tabs automatically
- Install the **7 AM reminder trigger** and **8 PM evaluation trigger**
- Share the spreadsheet with everyone in your family emails list

You'll see a confirmation:

```
┌────────────────────────────────────────────────────────┐
│  ✅ Step 4 of 4: Setup Complete!                       │
│                                                        │
│  Reading Tracker is ready for Tejas (Grade 6)!         │
│                                                        │
│  Two triggers installed:                               │
│    ⏰ 7:00 — Daily reminder if no entry logged         │
│    🤖 20:00 — Claude evaluates today's summary         │
│                                                        │
│  (Triggers fire within ±15 min of the scheduled hour)  │
│                                                        │
│                              [ OK ]                    │
└────────────────────────────────────────────────────────┘
```

**Setup is complete.** Share the spreadsheet URL with your student.

---

## Day-to-Day Usage

### The Student (after reading each day)

Open the **📖 Daily Log** tab and fill in one row:

```
┌────────────┬──────────┬───────────┬───────┬───────┬───────────────────────────────┐
│ Date       │ Book     │ Chapter   │ Start │  End  │ Summary by [Student]          │
│            │ Title    │ / Section │ Page  │ Page  │                               │
├────────────┼──────────┼───────────┼───────┼───────┼───────────────────────────────┤
│ 2026-05-17 │ Hatchet  │ Chapter 3 │  28   │  41   │ Brian found the hatchet in   │
│            │          │           │       │       │ the tail section of the       │
│            │          │           │       │       │ plane. He used it to escape   │
│            │          │           │       │       │ the sinking plane...          │
└────────────┴──────────┴───────────┴───────┴───────┴───────────────────────────────┘
```

> - **Date:** Pick from calendar or type in YYYY-MM-DD format
> - **Book Title:** Select from the dropdown (populated from the grade-appropriate book list)
> - **Summary:** Write 3–5 sentences summarizing what happened. The more specific, the better the feedback.
> - **Pages Read** (col F) fills in automatically

The other columns (Claude Evaluation, Questions, Status) fill in automatically that evening.

---

### The Evaluation Email (arrives ~8 PM)

After the trigger fires, the whole family receives an email like this:

```
┌──────────────────────────────────────────────────────────┐
│  📚 Reading Evaluation                                   │
│  Hatchet · Chapter 3 · 2026-05-17                       │
├──────────────────────────────────────────────────────────┤
│  Overall Evaluation                                      │
│  Tejas shows good understanding of the key event but    │
│  could add more about Brian's emotional state...         │
│                                                          │
│  ┌──────────────────────────────┐                        │
│  │  Score: 7/10                 │                        │
│  └──────────────────────────────┘                        │
│                                                          │
│  📌 Missing Evidence & Key Points                        │
│  • No mention of Brian's fear as the plane went down     │
│  • Did not explain why the hatchet was significant       │
│                                                          │
│  🔧 Steps to Improve                                     │
│  • Include at least one character emotion with evidence  │
│  • Explain why an object or event matters to the story   │
│                                                          │
│  ❓ Questions for Tejas                                  │
│  1. What specific feeling did Brian describe...          │
│  2. Why does the author spend so much time...            │
│  3. How might the hatchet become important later...      │
│                                                          │
│          [ Open Reading Tracker → ]                      │
└──────────────────────────────────────────────────────────┘
```

---

### Answering the Questions (Student)

Open the **🎯 Claude Evaluations** tab. Find today's row. Type answers in the last column:

```
┌──────────┬──────────┬──────────┬───────────────────────────────┬──────────────────────┐
│ Date     │ Book     │ Chapter  │ Questions Asked               │ [Student]'s Answers  │
├──────────┼──────────┼──────────┼───────────────────────────────┼──────────────────────┤
│ 05-17    │ Hatchet  │ Ch. 3    │ 1. What feeling did Brian...  │ Brian felt terrified │
│          │          │          │ 2. Why does the author...     │ because the plane... │
│          │          │          │ 3. How might the hatchet...   │                      │
└──────────┴──────────┴──────────┴───────────────────────────────┴──────────────────────┘
```

---

### What Parents See in the Sheet

The Daily Log updates automatically each evening:

```
Status column:
  ⏳ In Progress  — student has logged but evaluation hasn't run yet
  ✅ Done         — Claude has evaluated (row turns green)
  ❌ Missed       — no entry logged that day (row turns red)
```

---

## Menu Reference

| Menu Item | What It Does |
|-----------|-------------|
| 🚀 Run Setup Wizard | First-time guided setup — run once |
| ▶️ Evaluate Now | Manually trigger evaluation right now (useful for testing) |
| 🔄 Update Headers Only | Refresh column headers/formatting without touching data |
| 🛠️ Fix Corrupted Cells | Clears any `[Ljava.lang.Object;@...` garbage from old bugs |
| ⚙️ Rebuild All Sheet Tabs | Nuclear option — clears and recreates all tabs |
| 🔗 Share with Family | Re-shares the sheet with all family emails in settings |
| ⏰ Reinstall Daily Triggers | Use this if emails stopped firing |
| 🔔 Test: Send Missing Entry Email | Sends a test reminder to verify email is working |

---

## Settings Reference

All settings live in Column B of the **⚙️ Settings** tab. Only Column B is editable.

| Row | Setting | Format | Example |
|-----|---------|--------|---------|
| 1 | STUDENT NAME | Any text | `Tejas` |
| 2 | GRADE | Integer 1–12 | `6` |
| 3 | READING DAYS | Comma-separated day codes | `Mon,Tue,Wed,Thu,Fri,Sat` |
| 4 | ALERT HOUR (AM) | 0–23 | `7` |
| 5 | EVAL HOUR (PM) | 0–23 | `20` |
| 6 | PARENT 1 NAME | Any text | `Vamshi (Dad)` |
| 7 | PARENT 1 EMAIL | Email address | `dad@gmail.com` |
| 8 | PARENT 2 NAME | Any text (optional) | `Srilatha (Mom)` |
| 9 | PARENT 2 EMAIL | Email address (optional) | `mom@gmail.com` |
| 10 | SIBLING NAME | Any text (optional) | `Shreyas (Brother)` |
| 11 | SIBLING EMAIL | Email address (optional) | `sibling@gmail.com` |
| 12 | STUDENT EMAIL | Email address | `student@gmail.com` |

> **After changing any setting:** Triggers re-read settings on every fire — most changes take effect automatically. If you change ALERT HOUR or EVAL HOUR, run **⏰ Reinstall Daily Triggers** from the menu.

---

## Grade Rubrics at a Glance

Claude automatically applies an age-appropriate rubric based on the GRADE setting:

| Grade Band | Rubric Focus |
|------------|-------------|
| K–2 | Character, main event, setting, one text detail |
| 3–4 | Problem/solution, setting detail, sequence, one evidence point |
| 5–6 | Key events, textual evidence, clarity, turning points |
| 7–8 | Character motivation, theme, literary devices, cited evidence |
| 9–10 | Thesis-based analysis, multiple evidence, author's craft |
| 11–12 | Sophisticated analysis, rhetorical analysis, academic conventions |

---

## Troubleshooting

<details>
<summary><strong>📧 Emails aren't arriving</strong></summary>

1. Check your Spam folder first.
2. Open the Apps Script editor (Extensions → Apps Script → Executions tab). Look for errors in the most recent `evaluatePendingEntries` or `checkDailyEntry` run.
3. Run **▶️ Evaluate Now** from the menu and watch for any error dialogs.
4. Run **⏰ Reinstall Daily Triggers** — triggers occasionally need to be recreated.
5. Verify the family emails in the ⚙️ Settings tab are correct.

</details>

<details>
<summary><strong>🔑 API key error / evaluations not running</strong></summary>

The most common cause is the key expiring or being revoked.

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys.
2. Create a new key.
3. Open the Apps Script editor → Run `storeApiKey` (or re-run the Setup Wizard).

To update the key without re-running the full wizard:
1. Extensions → Apps Script
2. Add this one-time function, run it, then delete it:

```javascript
function storeApiKey() {
  PropertiesService.getScriptProperties()
    .setProperty("ANTHROPIC_API_KEY", "sk-ant-YOUR-NEW-KEY-HERE");
}
```

</details>

<details>
<summary><strong>🔴 Corrupted cells in Evaluations tab</strong></summary>

If you see `[Ljava.lang.Object;@abc123...` in any cell:

1. Click **📚 Reading Tracker → 🛠️ Fix Corrupted Cells in Evaluations Tab**
2. Then click **▶️ Evaluate Now** to re-evaluate the cleared rows.

</details>

<details>
<summary><strong>⏰ Triggers are off by 15–30 minutes</strong></summary>

This is normal. Google Apps Script time triggers are approximate (±15 min).
If you set EVAL HOUR to `20` (8 PM), the evaluation may fire anywhere from 7:45 PM to 8:15 PM. This is documented behavior — not a bug.

</details>

<details>
<summary><strong>📋 I need to change the student's grade</strong></summary>

1. Update GRADE in the ⚙️ Settings tab.
2. Run **⚙️ Rebuild All Sheet Tabs** to repopulate the book list with grade-appropriate titles.

> ⚠️ Rebuilding clears all sheet data. Back up or export the 📖 Daily Log first if you want to keep history.

</details>

<details>
<summary><strong>👨‍👩‍👧 Adding or removing a family member</strong></summary>

1. Update the relevant name/email rows in ⚙️ Settings.
2. Click **🔗 Share with Family** to grant access to the new member.
3. Evaluation and reminder emails will include the updated list immediately (triggers re-read settings on every fire).

</details>

---

## How the Anthropic API Key Is Stored

The key is stored using `PropertiesService.getScriptProperties()` — Google's built-in secure key-value store for Apps Script. It is:

- Bound to this specific Apps Script project only
- Never written to any cell, tab, or log
- Not visible to anyone viewing the spreadsheet
- Accessible only by the script running as you (the owner)

If you share the spreadsheet with someone, they cannot read the key. If you make a copy of the spreadsheet, the key does **not** copy over — the new copy's owner would need to run the Setup Wizard again.

---

## License

MIT — use freely, adapt for your family, share with other parents.
