---
title: PAI-OpenCode v3.0 - Korrigierter PR-Plan
description: Tatsächlicher Stand nach WP1-WP4 Audit - Tatsächlich 4 PRs bis v3.0 (A, B, C, D)
version: "3.0-corrected"
status: active
authors: [Jeremy]
date: 2026-03-06
tags: [architecture, migration, v3.0, PR-strategy, corrected]
---

# PAI-OpenCode v3.0 - Korrigierter PR-Plan

**Basierend auf:** Tatsächlicher Repository-Stand nach WP1-WP4 Completion  
**Ziel:** Korrekte Darstellung der verbleibenden Arbeit (tatsächlich 4 PRs bis v3.0)

---

## Tatsächlicher Stand (Nach vollständigem Audit 2026-03-06)

| WP | Name | PRs | Status | Inhalt |
|----|------|-----|--------|--------|
| **WP1** | Algorithm v3.7.0 + Workdir Docs | #35, #36 | ✅ **Komplett** | Algorithm v3.7.0, OpenCode workdir parameter |
| **WP2** | Context Modernization | #34 | ✅ **Komplett** | Lazy Loading, Hybrid Algorithm loading |
| **WP3** | Category Structure Part A | #37 | ⚠️ **~40% komplett** | Category Structure ja — Hooks/Plugin-Konsolidierung FEHLT |
| **WP4** | Integration & Validation | #38, #39, #40 | ⚠️ **~70% komplett** | Funktional, aber auf unvollständigem WP3 aufgebaut |

> [!warning]
> ⚠️ **AUDIT-BEFUND 2026-03-06:** WP3 war NICHT vollständig! WP-A (PR #42) schließt die Lücke. Vollständige Analyse: `docs/epic/GAP-ANALYSIS-v3.0.md`

**Ergebnis:** WP1 + WP2 vollständig. WP3 + WP4 haben signifikante Lücken.

---

## Verbleibende Arbeit: Tatsächlich 4 PRs (nach Audit)

> [!note]
> **Aktualisiert nach vollständigem Gap-Analyse-Audit** — Details in `docs/epic/GAP-ANALYSIS-v3.0.md`

### 📋 PR #A: WP3-Completion — Plugin-System & Hooks (KRITISCH)
**Branch:** `feature/wp3-completion-plugin-hooks` (NEU)  
**Schätzung:** ~10 Files, ~800 Zeilen  

**Problem:** WP3 hat nur die Category-Struktur geliefert. Das Plugin-System und die Hooks aus PAI v4.0.3 fehlen komplett.

**Inhalt:**
```text
NEUE HOOK-HANDLER (fehlende aus v4.0.3 portieren):
├── plugins/handlers/prdsync.ts             # PRD-Frontmatter → work.json Sync
├── plugins/handlers/session-cleanup.ts     # Session-Ende Cleanup
├── plugins/handlers/session-autoname.ts    # Automatische Session-Benennung
├── plugins/handlers/last-response-cache.ts # Response-Caching
├── plugins/handlers/relationship-memory.ts # User-Relationship-Tracking
└── plugins/handlers/question-answered.ts   # Q&A-Tracking

UNGENUTZTE BUS-EVENTS (direkt im event-Handler von pai-unified.ts):
├── session.compacted   → Learnings VOR Kontextverlust retten (KRITISCH)
├── session.error       → Error-Tracking für Debugging
├── permission.asked    → Vollständiges Permission-Audit-Log
├── command.executed    → /command Usage-Tracking
├── installation.update.available → Native OpenCode Update-Notification
├── session.updated     → Session-Titel-Tracking für Work-Log
└── session.created     → info-Objekt (id, title, directory) für präzises Logging

ARCHITEKTUR (pragmatisch — Option B):
├── pai-unified.ts   # Neue Handler einbinden + Bus-Events ergänzen
└── (Handler-Module bleiben, keine Umstrukturierung)

MITTEL-PRIORITÄT (wenn Zeit):
├── plugins/handlers/doc-integrity.ts
├── plugins/handlers/response-tab-reset.ts
└── plugins/handlers/set-question-tab.ts
```

**Abhängigkeiten:** WP1, WP2 (bereits erledigt)

---

### 📋 PR #B: WP3.5 — Security Hardening / Prompt Injection (HOCH)

**Branch:** `feature/wp3-5-security-hardening` (NEU)  
**Schätzung:** ~5 Files, ~400 Zeilen  

**Inhalt:**
```text
├── plugins/handlers/prompt-injection-guard.ts
├── plugins/lib/injection-patterns.ts
├── plugins/lib/sanitizer.ts
└── Dokumentation: security-audit.md
```

**Abhängigkeiten:** PR #A (Plugin-System vollständig)

---

### 📋 PR #C: WP5 — Core PAI System Completion (KRITISCH)

**Branch:** `feature/wp5-core-pai-system` (NEU)  
**Schätzung:** ~25 Files, ~2500 Zeilen  

**Inhalt:**
```text
FEHLENDE PAI-Docs portieren:
├── .opencode/PAI/PAIAGENTSYSTEM.md
├── .opencode/PAI/CLIFIRSTARCHITECTURE.md
├── .opencode/PAI/FLOWS.md + FLOWS/
├── .opencode/PAI/PIPELINES.md + PIPELINES/
├── .opencode/PAI/THEFABRICSYSTEM.md
├── .opencode/PAI/THENOTIFICATIONSYSTEM.md
└── .opencode/PAI/DOCUMENTATIONINDEX.md

FEHLENDE PAI Tools portieren:
├── .opencode/skills/PAI/Tools/algorithm.ts      # CLI für Algorithm
├── .opencode/skills/PAI/Tools/RebuildPAI.ts
├── .opencode/skills/PAI/Tools/IntegrityMaintenance.ts
├── .opencode/skills/PAI/Tools/AlgorithmPhaseReport.ts
└── .opencode/skills/PAI/Tools/FailureCapture.ts

SKILL-STRUKTUR KORREKTUREN:
├── skills/Telos/: DashboardTemplate/, ReportTemplate/, Tools/, Workflows/ hinzufügen
├── skills/USMetrics/: Struktur korrigieren (nested→flach)
├── skills/Utilities/: AudioEditor/, Delegation/ hinzufügen
└── skills/Research/: MigrationNotes.md, Templates/ hinzufügen
```

**Abhängigkeiten:** PR #A (Plugin-System vollständig)

---

### 📋 PR #D: WP6 — Installer & Migration + DB Health (KRITISCH)

**Branch:** `feature/wp6-installer-migration` (NEU)  
**Schätzung:** ~18 Files, ~1300 Zeilen  

**Inhalt:**
```text
Final Delivery:
├── PAI-Install/ (portiert aus v4.0.3)
│   ├── install.sh
│   ├── cli/
│   ├── electron/          ← DB Health Tab hier integriert
│   ├── engine/
│   └── web/
├── Tools/migration-v2-to-v3.ts (neu)
├── Tools/db-archive.ts (neu)      ← Standalone DB Archivierungs-Tool
├── UPGRADE.md (neu)
├── RELEASE-v3.0.0.md (neu)
└── README.md (updated)
```

**DB Health Erweiterung:** Siehe WP-F (DB Health & Archivierung) — vollständig integriert in PR #D.

**Wichtig:** Dieser PR muss auf PR #C warten!

---

### 📋 PR #D Erweiterung: WP-F — DB Health & Session Archivierung (WICHTIG)

> [!note]
> **Neu hinzugefügt 2026-03-06** — Erkenntnisse aus OpenCode DB-Analyse:  
> `opencode.db` wird 2.4 GB+ groß ohne Cleanup. Keine Auto-Retention in OpenCode.  
> Lösung muss OpenCode-native, benutzerfreundlich und in v3.0 integriert sein.

**Drei Ebenen der Lösung:**

```text
EBENE 1 — Plugin Event (automatisch, WP-A Erweiterung):
└── plugins/handlers/session-cleanup.ts
    └── Erweitern: Auto-Archiv-Check nach Session-Ende
        ├── Prüfen: Ist DB > 500 MB? Gibt es Sessions > 90 Tage?
        ├── Wenn ja: Benutzer benachrichtigen ("DB wächst, Archiv empfohlen")
        └── Optional: Silent Auto-Archiv nach konfigurierbarem Schwellenwert

EBENE 2 — Custom Command (manuell, OpenCode-native):
└── /db-archive  OpenCode Custom Command
    ├── Zeigt: DB-Größe, Session-Anzahl, älteste Sessions
    ├── Schlägt vor: Archivierung aller Sessions älter als N Tage
    ├── Führt aus: Export → Löschen → VACUUM
    └── Bestätigt: "X Sessions archiviert, Y MB freigegeben"

EBENE 3 — Electron GUI (visuell, WP-D Electron-Installer):
└── PAI-Install Electron App: "DB Health" Tab
    ├── Dashboard: DB-Größe, Session-Count, Growth-Trend
    ├── Archiv-Button: "Archiviere Sessions älter als [90] Tage"
    ├── VACUUM-Button: "Datenbank defragmentieren"
    └── Archiv-Browser: Alte Sessions wiederherstellen
```

**Technische Architektur:**

```typescript
// Tools/db-archive.ts — OpenCode-native Tool
// Aufrufbar: bun db-archive.ts [days] [--dry-run] [--vacuum]

interface ArchiveConfig {
  daysToKeep: number;     // Default: 90
  archiveDir: string;     // Default: ~/.opencode/archives/
  autoVacuum: boolean;    // Default: true
  dryRun: boolean;        // Default: false
}

interface ArchiveResult {
  sessionsArchived: number;
  messagesArchived: number;
  partsArchived: number;
  spaceSaved: string;     // "1.2 GB"
  archivePath: string;
  vacuumRan: boolean;
}

// Restore einzelner Session aus Archiv
bun db-archive.ts --restore archive-2025-Q4.db --session ses_xxx
```

**Plugin Integration (session-cleanup.ts Erweiterung):**

```typescript
// Automatische Warnung bei DB-Wachstum
async function checkDbHealth(dbPath: string): Promise<void> {
  const sizeMB = getDbSizeMB(dbPath);
  const oldSessionCount = getOldSessionCount(dbPath, 90);

  if (sizeMB > 500 || oldSessionCount > 100) {
    // OpenCode notification (nicht blockierend)
    await notify(`⚠️ DB-Warnung: ${sizeMB}MB — ${oldSessionCount} Sessions > 90 Tage.\n` +
                 `Archivierung empfohlen: /db-archive`);
  }
}
```

**OpenCode Custom Command (`/db-archive`):**

```typescript
// .opencode/commands/db-archive.ts
// Aufrufbar direkt in OpenCode TUI: /db-archive
export default async function dbArchiveCommand(args: string[]) {
  const days = parseInt(args[0]) || 90;
  
  // 1. Status anzeigen
  const stats = await getDbStats();
  console.log(`DB: ${stats.sizeMB}MB | Sessions: ${stats.total} | Archivierbar: ${stats.archivable}`);
  
  // 2. Bestätigung
  const confirmed = await confirm(`Archiviere ${stats.archivable} Sessions (> ${days} Tage)?`);
  if (!confirmed) return;
  
  // 3. Archivieren
  const result = await archiveSessions(days);
  
  // 4. Ergebnis
  console.log(`✅ ${result.sessionsArchived} Sessions archiviert → ${result.archivePath}`);
  console.log(`💾 Freigegeben: ${result.spaceSaved}`);
}
```

**WICHTIG — VACUUM Requirement:**
```
VACUUM braucht EXKLUSIVEN DB Zugriff:
→ db-archive.ts muss aufgerufen werden OHNE laufendes OpenCode
→ Electron GUI: Zeigt "OpenCode muss beendet sein" Hinweis
→ Custom Command /db-archive: Läuft im OpenCode-Prozess, nutzt
   SQLite WAL Checkpoint statt Full VACUUM (sicherer bei laufender Session)
```

**Archiv-Format:**
```
~/.opencode/archives/
├── archive-2025-Q4.db          ← SQLite (wiederherstellbar)
├── archive-2026-Q1.db
└── archive-index.json          ← { date, sessionCount, sizeBytes, dbPath }
```

---

## ⚙️ Architektur-Entscheidung: Plugin-Konsolidierung

> [!tip]
> **Entschieden 2026-03-06 — Option B: Pragmatisch**

**Option A (Epic-Ziel):** Alle 19 Handler auflösen, native OpenCode Events, ~300 Zeilen  
**Option B (Gewählt):** Handler-Module bleiben als "internal modules", nur fehlende Hooks hinzufügen

**Begründung für Option B:**
- Geringeres Risiko (keine komplette Umstrukturierung)
- Funktionalität bleibt garantiert erhalten
- Weniger Aufwand (~1 Tag statt ~2 Tage)
- Echte Konsolidierung auf **v3.1** verschoben

**Konsequenz:** `pai-unified.ts` bleibt Coordinator über Handler-Module. Neue Hooks werden als neue Handler-Dateien hinzugefügt und in `pai-unified.ts` eingebunden.

---

## Warum 4 PRs und nicht 2?

### Vorheriger (falscher) Plan (Korrektur 1, 2026-03-06 früh):
- WP1-WP4 als "vollständig" markiert
- Nur noch 2 PRs bis v3.0 behauptet
- **FEHLER:** WP3 war nie vollständig!

### Aktuell korrigierter Plan (Audit 2026-03-06):
- ✅ WP1: Algorithm v3.7.0 (vollständig)
- ✅ WP2: Context Modernization (vollständig)
- ⚠️ WP3: ~40% — Category Structure ja, Hooks/Plugin-System NEIN
- ⚠️ WP4: ~70% — Funktional, aber auf unvollständigem WP3
- 🔄 **PR #A**: WP3-Completion (Plugin-System + 6 Hooks)
- 🔄 **PR #B**: WP3.5 Security Hardening
- 🔄 **PR #C**: WP5 Core PAI System + Skill-Fixes
- 🔄 **PR #D**: WP6 Installer & Migration

**Details:** Vollständige Gap-Analyse in `docs/epic/GAP-ANALYSIS-v3.0.md`

---

## Detaillierte Übersicht: Was fehlt wirklich?

### Bereits erledigt (WP1-WP4):
- ✅ Algorithm v3.7.0 ist portiert (in `.opencode/skills/PAI/SKILL.md`)
- ✅ Category Structure existiert (10 Kategorien, 40+ skills)
- ✅ Validation Tools existieren (GenerateSkillIndex, ValidateSkillStructure)
- ✅ Plugin Handler unterstützen hierarchische Skills

### Was fehlt (WP5-WP6):

| Komponente | Status | Details |
|------------|--------|---------|
| `.opencode/PAI/` Verzeichnis | ❌ Fehlt komplett | Core PAI außerhalb skills/ |
| Modularer Algorithm | ❌ Fehlt | 81KB monolithisch → ~200 Zeilen + Components |
| RebuildPAI.ts | ❌ Fehlt | Tool zum Neuaufbau der PAI-Struktur |
| IntegrityMaintenance.ts | ❌ Fehlt | Health Checks |
| SessionDocumenter.ts | ❌ Fehlt | Automatische Session-Doku |
| SystemAudit.ts | ❌ Fehlt | System-Integritätsprüfung |
| PAI-Install/ | ❌ Fehlt | GUI Installer aus v4.0.3 |
| Migration Script | ❌ Fehlt | v2→v3 Automatisierung |

---

## Empfohlene Reihenfolge (nach Audit)

```text
Aktueller Stand (dev branch):
├── WP1 ✅ Algorithm v3.7.0
├── WP2 ✅ Context Modernization  
├── WP3 ⚠️ Category Structure (hooks fehlen)
└── WP4 ⚠️ Integration (70% fertig)

Nächste Schritte:
    │
    ▼
┌─────────────────────────────────────┐
│  PR #A: WP3-Completion              │
│  - 6 kritische Hooks portieren      │
│  - Plugin-Architektur verbessern    │
│  - ~10 Files, ~800 Zeilen           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PR #B: WP3.5 Security              │
│  - Prompt Injection Guard           │
│  - ~5 Files, ~400 Zeilen            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PR #C: WP5 Core PAI System         │
│  - Fehlende PAI-Docs portieren      │
│  - Fehlende PAI Tools portieren     │
│  - Skill-Struktur-Fixes             │
│  - ~25 Files, ~2500 Zeilen          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PR #D: WP6 Installer & Migration   │
│  - PAI-Install/ portieren           │
│  - Migration-Script v2→v3           │
│  - Release-Dokumentation            │
│  - ~15 Files, ~1000 Zeilen          │
└─────────────────────────────────────┘
    │
    ▼
🎉 v3.0.0 RELEASE
```

---

## Zusammenfassung (nach vollständigem Audit)

| Metrik | Falscher Plan | Audit-korrigierter Plan |
|--------|-----------|------------------|
| Gesamt-PRs | 6 PRs (4 ✅, 2 offen) | 10 PRs total (4 ✅ teilweise, 4 🔄 offen) |
| Noch offen | 2 PRs | **4 PRs (A, B, C, D)** |
| Verbleibende Arbeit | Nur WP5-WP6 | WP3-Completion + WP3.5 + WP5 + WP6 |
| ETA | ~1-2 Wochen | **5-8 Tage realistisch** |

**Fazit:** WP1 und WP2 sind solide. WP3 hat kritische Lücken (Hooks, Plugin-Architektur). WP4 funktioniert, baut aber auf unvollständigem WP3. Es braucht 4 weitere PRs für eine vollständige v3.0.

**Vollständige Gap-Analyse:** `docs/epic/GAP-ANALYSIS-v3.0.md`

---

*Korrigiert am: 2026-03-06*  
*Ursprünglicher Plan war irreführend durch durchnummerierte PRs statt tatsächlicher WP-Zuordnung*