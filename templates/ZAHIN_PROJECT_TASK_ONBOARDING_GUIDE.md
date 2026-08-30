# 📋 PurpleOS — September 1 Project & Task Pre-Population Guide
### Reference & Data Format for Zahin & Operations Team

---

## 🎯 Executive Goal

On **September 1st**, when all 33 team members log into **PurpleOS**, enter their PIN, and link their Telegram bot:
- ✅ Their personal Kanban boards and task lists are **already pre-populated** with their September deliverables.
- ✅ Morning briefings on Telegram automatically display their daily tasks and priorities.
- ✅ EOD submission forms automatically load their assigned tasks for 1-tap progress logging.
- ✅ Management has immediate real-time oversight of agency capacity and project timelines.

---

## 📑 The Master Task & Project Excel / CSV Format

Provide this structure to Zahin when sitting with department leads. Each row represents **one concrete deliverable/task** under a project.

### 📊 Column Definitions

| # | Column Header | Required? | Example Value | Description & PurpleOS System Effect |
|---|---|---|---|---|
| 1 | **`Task Title`** | **YES** | `Hero Commercial 60s Edit` | The name of the deliverable. Appears on Kanban cards, Telegram notifications, and EOD logs. |
| 2 | **`Client Name`** | **YES** | `Apex Footwear` | The client/brand. If internal agency work, use `Internal Agency` or `GRO10X`. |
| 3 | **`Project Name`** | Recommended | `Apex Autumn 2026 Campaign` | Groups multiple tasks together under a single campaign/retainer. |
| 4 | **`Assignee`** | **YES** | `Md. Zahin Khandaker` or `PBD-002` | Name or Employee ID of the specialist responsible. Triggers their dashboard & bot alerts. |
| 5 | **`Department`** | Recommended | `Post Production` | Department filter (`Creative & Content`, `Production`, `Post Production`, `Influencer Marketing`, `Development & Tech`, `Client Relations`, `Finance`). |
| 6 | **`Workflow Type`** | Optional | `video` | Selects stage pipeline: `video`, `social`, `branding`, `dev` (default: `video`). |
| 7 | **`Stage`** | Optional | `Editing` | Kanban column where card starts: `Briefing`, `Scripting`, `Shooting`, `Editing`, `Internal QC`, `Client Review`, `Approved`, `Published` (default: `Briefing`). |
| 8 | **`Priority`** | Optional | `High` | `Urgent`, `High`, `Medium`, `Low` (default: `Medium`). Adds color badges & priority escalation. |
| 9 | **`Due Date`** | Recommended | `2026-09-15` | Deadline in `YYYY-MM-DD` format. Powers calendar views and deadline reminders. |
| 10 | **`Estimated Hours`**| Optional | `12` | Hours estimated to finish. Feeds capacity tracking & workload balancing. |
| 11 | **`Description`** | Optional | `4K cut with color grading and sound mix` | Creative notes, Google Drive raw footage links, aspect ratios, or deliverable specs. |

---

## 🚫 What Data to Avoid (Keep It Clean & Simple)

1. **Avoid Date Ambiguity**: Always use standard `YYYY-MM-DD` format (e.g. `2026-09-15`). Avoid text dates like *"mid-September"* or ambiguous slashes like `09/05/2026`.
2. **Avoid Merged Cells**: In Excel/Google Sheets, keep every row as a standalone record without merging cells across rows or columns.
3. **Avoid Hardcoded Formulas**: Save or export the final sheet as standard text / CSV values rather than complex cross-sheet Excel formulas.
4. **Assignee Name Accuracy**: Use the staff member's real name as listed in the PurpleOS team directory (our smart identity engine will automatically handle prefixes like `Md.`, `Mohammad`, `Dr.`, or short names).

---

## 💡 Ready-to-Use Files in Codebase

We have pre-created downloadable template files in the repository:
- 📄 **`templates/purpleos_projects_tasks_template.csv`** (Pre-filled sample rows ready to open in Excel / Google Sheets)
- 📄 **`templates/purpleos_projects_template.csv`** (Project-level campaign summary format)

---

## 🚀 How the Upload / Import Works in PurpleOS

We have activated the **Bulk Import Engine** in the Admin API:
- **API Endpoints Ready**:
  - `POST /api/admin/import/tasks` — Bulk parses tasks and auto-links assignees, projects, and clients.
  - `POST /api/admin/import/projects` — Bulk registers upcoming campaigns and budgets.
- **Workflow on September 1st**:
  1. Zahin completes the Excel sheet with department leads.
  2. The sheet is saved as CSV.
  3. Uploaded via the Admin OS in 1 tap.
  4. Instant live synchronization to all team member profiles across Web & Telegram!
