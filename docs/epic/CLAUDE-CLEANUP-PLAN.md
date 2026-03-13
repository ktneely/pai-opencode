# Claude→OpenCode — Vollständiger Bereinigungsplan

> **Status:** READY TO EXECUTE
> **Erstellt:** 2026-03-13
> **Zweck:** Detaillierter Plan für die semantische Claude→OpenCode Bereinigung,
> integriert in die 11+1 Pull Requests des v3.0 Completion Plans.

---

## Kritische Erkenntnis: Die größten Baustellen sind NICHT in den 11 PRs

Die 11 PRs (PR-01 bis PR-11) decken den **Diff zwischen main und dev** ab — also Dateien die auf dev existieren aber auf main fehlen oder anders sind.

**ABER:** Die schwersten Claude-Referenz-Dateien sind **bereits identisch auf main UND dev**. Sie wurden über PRs #62-65 nach main gebracht und seitdem nicht mehr geändert. Das heißt:

| Datei | Claude-Treffer | In welchem PR? |
|-------|---------------|----------------|
| `.opencode/PAI/THEHOOKSYSTEM.md` | **48** | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/TOOLS.md` | **25** | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/MEMORYSYSTEM.md` | **20** | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/SKILLSYSTEM.md` | **17** | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/ACTIONS.md` | 7 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/README.md` | ~5 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Algorithm/v3.7.0.md` | ~5 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/PRDFORMAT.md` | ~5 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/CLI.md` | ~5 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Tools/BuildCLAUDE.ts` | ganzes File | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Tools/algorithm.ts` | ~8 | ✅ PR-02 (MODIFY) |
| `.opencode/PAI/Tools/SecretScan.ts` | ~3 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Tools/GetTranscript.ts` | ~3 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Tools/LoadSkillConfig.ts` | ~3 | ❌ KEINER — identisch main=dev |
| `.opencode/PAI/Tools/IntegrityMaintenance.ts` | ~3 | ✅ PR-02 (MODIFY) |
| `.opencode/PAI/Tools/ActivityParser.ts` | ~2 | ❌ KEINER — identisch main=dev |
| `.opencode/plugins/lib/identity.ts` | ~1 | ❌ KEINER — identisch main=dev |
| `.opencode/skills/Agents/Tools/LoadAgentContext.ts` | 1 (`claudeHome`) | ❌ KEINER — identisch main=dev |

**→ Lösung: PR-12 für semantische Bereinigung aller Dateien die bereits auf main sind.**

---

## Die 8 Kategorien (vollständige Analyse)

### Kategorie 1: `~/.claude/` Pfade → `~/.opencode/` (MECHANISCH)

**Typ:** Pfad-Referenz auf nicht-existierendes Verzeichnis
**Aktion:** `sed -i '' 's|~/\.claude/|~/.opencode/|g'`
**Schwierigkeit:** ⚡ Trivial — rein mechanisch
**Geschätzte Dateien:** ~30

**Wo im PR-Plan:**
- PR-02: `algorithm.ts`, `IntegrityMaintenance.ts` (als Teil des MODIFY)
- PR-12 (NEU): Alle identischen Dateien auf main (THEHOOKSYSTEM.md, MEMORYSYSTEM.md, TOOLS.md, SKILLSYSTEM.md, SecretScan.ts, GetTranscript.ts, LoadSkillConfig.ts, ActivityParser.ts, identity.ts, etc.)

**Ausnahmen (NICHT ersetzen):**
- `PAI-TO-OPENCODE-MAPPING.md` — erklärt den Unterschied
- `MIGRATION.md` — Migrationsanleitung
- `UPSTREAM-SYNC-PROCESS.md` — Upstream-Referenz
- `pai-to-opencode-converter.ts` — Konvertierungstool
- `skill-migrate.ts`, `MigrationValidator.ts`, `migration-manifest.ts` — Migration-Tools

---

### Kategorie 2: `CLAUDE.md` Dateireferenzen → `AGENTS.md` (MECHANISCH)

**Typ:** Referenz auf nicht-existierende Datei
**Aktion:** `sed -i '' 's|CLAUDE\.md|AGENTS.md|g'`
**Schwierigkeit:** ⚡ Trivial — rein mechanisch
**Geschätzte Dateien:** ~15

**Wo im PR-Plan:**
- PR-02: `algorithm.ts` (als Teil des MODIFY)
- PR-12 (NEU): README.md (PAI), PRDFORMAT.md, Algorithm/v3.7.0.md, BuildCLAUDE.ts (siehe Kat. 5)

**Ausnahmen:** Migration-Docs (wie Kat. 1)

---

### Kategorie 3: `claude -p` CLI-Calls → OpenCode Task-Tool (SEMI-MECHANISCH)

**Typ:** CLI-Aufrufe die in OpenCode nicht existieren
**Aktion:** Manuell pro Stelle — durch Task-Tool-Referenz oder Kommentar ersetzen
**Schwierigkeit:** ⚠️ Mittel — erfordert Verständnis des Kontexts
**Geschätzte Dateien:** 5

**Betroffene Dateien und Lösung:**

| Datei | Kontext | Lösung |
|-------|---------|--------|
| `.opencode/PAI/Tools/algorithm.ts` | `Bun.spawn(["claude", "-p", ...])` — spawnt Subagent | → `// OpenCode: Use Task tool for subagent spawning` + Code-Kommentar. Funktional: Task-Tool-Aufruf stattdessen. |
| `.opencode/PAI/Tools/algorithm.ts` | `claude session` Referenzen (×3) | → Entfernen oder durch OpenCode-Session-API ersetzen |
| `.opencode/PAI/CLI.md` | Dokumentiert `claude -p` als Invokation | → Umschreiben auf OpenCode Task-Tool Pattern |
| `.opencode/PAI/SKILL.md` | Beispiel mit `claude -p` | → Umschreiben auf Task-Tool Beispiel |
| `.opencode/PAI/Algorithm/v3.7.0.md` | `claude -p` in Loop-Mode-Beschreibung | → Umschreiben: "Use opencode CLI or Task tool" |

**Wo im PR-Plan:**
- PR-02: `algorithm.ts` (als Teil des MODIFY — ist bereits in der Dateiliste)
- PR-12 (NEU): CLI.md, SKILL.md, Algorithm/v3.7.0.md

---

### Kategorie 4: "Claude Code" als Plattformname → "OpenCode" (SEMANTISCH)

**Typ:** Dokumentation die Claude Code Konzepte beschreibt die in OpenCode nicht existieren oder anders heißen
**Aktion:** Semantisches Umschreiben — NICHT einfach suchen/ersetzen
**Schwierigkeit:** 🔴 HOCH — erfordert Verständnis der OpenCode-Architektur
**Geschätzte Dateien:** ~40 (davon ~6 mit schwerem Rewrite-Bedarf)

**Die 6 schweren Fälle (alle in PR-12):**

#### 4a. THEHOOKSYSTEM.md (48 Treffer — SCHWERSTER FALL)

**Problem:** Beschreibt komplett das Claude Code Hook-System:
- Claude Code `hooks` in `settings.json` (event → command mapping)
- Hooks wie `PreToolUse`, `PostToolUse`, `Notification`
- Shell-basierte Hook-Ausführung

**OpenCode-Realität:** OpenCode hat ein Plugin-System (`pai-unified.ts`), kein Hook-System.
- Events: `session.created`, `session.compacted`, `tool.execute.before`, `tool.execute.after`, `message.received`
- Handler in `plugins/handlers/*.ts`
- Event-Bus statt Shell-Hooks

**Lösung:** Dieses Dokument muss **komplett umgeschrieben** werden:
- Neue Struktur: "Das OpenCode Plugin-System"
- Alle Hook-Referenzen → Plugin-Event-Referenzen
- Alle `settings.json hooks` → `pai-unified.ts` Event-Bus
- Claude Code `PreToolUse/PostToolUse` → OpenCode `tool.execute.before/after`
- ⏱️ **Geschätzter Aufwand: 2-3 Stunden** (umfangreiches Dokument, viele Querverweise)

#### 4b. MEMORYSYSTEM.md (20 Treffer)

**Problem:** Referenziert Claude Code `projects/{uuid}.jsonl` Transcript-Speicher und `~/.claude/` Pfade.

**OpenCode-Realität:** OpenCode speichert Sessions in SQLite (`~/.opencode/projects/`), nicht in JSONL.
- Session Registry Plugin statt Claude Code Transcripts
- `session_registry` Custom Tool statt JSONL-Dateien

**Lösung:** Abschnitte über Transcript-Speicher umschreiben:
- `projects/{uuid}.jsonl` → OpenCode Session-DB-Referenz
- Alle `~/.claude/` Pfade → `~/.opencode/`
- "Claude Code sessions" → "OpenCode sessions"
- ⏱️ **Geschätzter Aufwand: 1-2 Stunden**

#### 4c. TOOLS.md (25 Treffer)

**Problem:** Listet Tools die in Claude Code existieren aber in OpenCode anders heißen oder fehlen.

**Lösung:** Tool-Referenzen aktualisieren:
- Claude Code Built-in Tools → OpenCode Tool-Äquivalente
- `claude -p` Aufrufe → Task-Tool Referenzen
- ⏱️ **Geschätzter Aufwand: 1-2 Stunden**

#### 4d. SKILLSYSTEM.md (17 Treffer)

**Problem:** Beschreibt Skill-Loading im Kontext von Claude Code (CLAUDE.md bootstrapping, `~/.claude/skills/`).

**OpenCode-Realität:** Skills werden über `AGENTS.md` und `skill-index.json` geladen.
- `~/.claude/skills/` → `~/.opencode/skills/`
- `CLAUDE.md` → `AGENTS.md`
- Skill-Trigger-System ist gleich, aber der Bootstrap-Mechanismus ist anders

**Lösung:** Bootstrap-Referenzen umschreiben:
- ⏱️ **Geschätzter Aufwand: 1 Stunde**

#### 4e. ACTIONS.md (7 Treffer)

**Problem:** Referenziert `~/.claude/` Pfade und Claude Code Action-Konzepte.

**Lösung:** Pfade ersetzen + Action-Beschreibungen aktualisieren:
- ⏱️ **Geschätzter Aufwand: 30 Minuten**

#### 4f. README.md (.opencode/PAI/) (~5 Treffer)

**Problem:** `CLAUDE.md` Referenzen, `~/.claude/` Pfade.

**Lösung:** Mechanisch + ein paar Sätze umschreiben:
- ⏱️ **Geschätzter Aufwand: 15 Minuten**

---

### Kategorie 5: `BuildCLAUDE.ts` — Ganzes File obsolet (ENTSCHEIDUNG NÖTIG)

**Typ:** TypeScript-Tool das `CLAUDE.md` generiert — der Zweck existiert nicht mehr
**Datei:** `.opencode/PAI/Tools/BuildCLAUDE.ts`
**Schwierigkeit:** 🔴 ENTSCHEIDUNG

**Optionen:**

| Option | Beschreibung | Pro | Contra |
|--------|-------------|-----|--------|
| **A: Rename → BuildAGENTS.ts** | Umbenennen + alle internen Referenzen anpassen (CLAUDE.md→AGENTS.md, `~/.claude/`→`~/.opencode/`) | Funktionalität bleibt erhalten, AGENTS.md kann automatisch generiert werden | Aufwand ~1 Stunde, muss testen ob Output korrekt |
| **B: Löschen** | File komplett entfernen, AGENTS.md wird manuell gepflegt | Einfach, keine Wartung | Verliert Automatisierung |
| **C: Löschen + Deprecated-Note** | Löschen, aber in TOOLS.md notieren dass es BuildCLAUDE.ts gab | Sauber dokumentiert | Minimal mehr Aufwand als B |

**Empfehlung:** Option A — die Automatisierung von AGENTS.md-Generierung ist wertvoll.

**Wo im PR-Plan:** PR-12 (NEU)

---

### Kategorie 6: `claudeHome` Variable (TRIVIAL)

**Typ:** Variable in TypeScript benannt nach Claude, zeigt aber korrekt auf `.opencode/`
**Datei:** `.opencode/skills/Agents/Tools/LoadAgentContext.ts` Zeile 24
**Schwierigkeit:** ⚡ Trivial

**Lösung:**
```typescript
// Vorher:
const claudeHome = path.join(os.homedir(), ".opencode");
// Nachher:
const opencodeHome = path.join(os.homedir(), ".opencode");
```
+ alle Referenzen auf `claudeHome` im gleichen File → `opencodeHome`

**Wo im PR-Plan:** PR-12 (NEU) — Datei ist identisch main=dev

---

### Kategorie 7: "claude session" Referenzen (CODE)

**Typ:** Code-Referenzen auf `claude session` API die in OpenCode nicht existiert
**Dateien:** `algorithm.ts` (3 Stellen)
**Schwierigkeit:** ⚠️ Mittel

**Problem:** `algorithm.ts` nutzt `claude session` CLI-Kommandos für Session-Management.

**OpenCode-Realität:** OpenCode hat die Session Registry (Custom Tool via `session_registry`), aber keine `claude session` CLI.

**Lösung:** Die Stellen entweder:
- Durch OpenCode Session-API Äquivalent ersetzen (wenn es eines gibt)
- Auskommentieren mit `// OpenCode: session management via session_registry custom tool`
- Entfernen wenn der Code-Pfad nicht mehr erreichbar ist

**Wo im PR-Plan:** PR-02 (`algorithm.ts` ist in der MODIFY-Liste)

---

### Kategorie 8: `projects/{uuid}.jsonl` Transcript-Referenzen (DOKU)

**Typ:** Dokumentation referenziert Claude Code internen Transcript-Speicher
**Dateien:** MEMORYSYSTEM.md (~5 Stellen)
**Schwierigkeit:** ⚠️ Mittel — muss verstehen was stattdessen gilt

**Problem:** Beschreibt wie Claude Code Sessions als JSONL speichert unter `~/.claude/projects/{uuid}.jsonl`.

**OpenCode-Realität:** OpenCode speichert Sessions in SQLite:
- `~/.opencode/projects/{project-hash}/` (DB statt JSONL)
- Session Registry Plugin für Session-Tracking

**Lösung:** JSONL-Referenzen durch OpenCode-Session-Speicher-Beschreibung ersetzen.
- Betrifft MEMORYSYSTEM.md Abschnitte über RAW/ Event-Logging und Session-Persistence
- ⏱️ **Geschätzter Aufwand: 30 Minuten** (Teil der Kategorie 4b Arbeit)

**Wo im PR-Plan:** PR-12 (NEU) — zusammen mit MEMORYSYSTEM.md Rewrite

---

## PR-12: Semantische Claude→OpenCode Bereinigung (NEU)

### Warum ein eigener PR

Die 11 bestehenden PRs decken nur den Diff main↔dev ab. Die semantisch schwersten Claude-Dateien sind bereits identisch auf beiden Branches. Sie brauchen einen eigenen PR der **direkt auf main** arbeitet.

### Branch-Strategie

```bash
git checkout -b release/v3.0-pr12-claude-semantic-cleanup main
# Dateien direkt bearbeiten (nicht von dev kopieren — die sind ja identisch)
# Committen + PR erstellen
```

### PR-12 Dateiliste

| Datei | Kategorie(n) | Aufwand | Typ |
|-------|-------------|---------|-----|
| `.opencode/PAI/THEHOOKSYSTEM.md` | 4a, 1, 2 | 🔴 2-3h | REWRITE |
| `.opencode/PAI/MEMORYSYSTEM.md` | 4b, 1, 8 | 🔴 1-2h | REWRITE |
| `.opencode/PAI/TOOLS.md` | 4c, 1, 3 | ⚠️ 1-2h | REWRITE |
| `.opencode/PAI/SKILLSYSTEM.md` | 4d, 1, 2 | ⚠️ 1h | PARTIAL REWRITE |
| `.opencode/PAI/ACTIONS.md` | 4e, 1 | ⚡ 30min | EDIT |
| `.opencode/PAI/README.md` | 4f, 1, 2 | ⚡ 15min | EDIT |
| `.opencode/PAI/CLI.md` | 3, 1 | ⚠️ 30min | EDIT |
| `.opencode/PAI/PRDFORMAT.md` | 1, 2 | ⚡ 15min | EDIT |
| `.opencode/PAI/Algorithm/v3.7.0.md` | 1, 2, 3 | ⚠️ 30min | EDIT |
| `.opencode/PAI/Tools/BuildCLAUDE.ts` | 5 | ⚠️ 1h | RENAME+EDIT (→ BuildAGENTS.ts) |
| `.opencode/PAI/Tools/SecretScan.ts` | 1 | ⚡ 5min | MECHANICAL |
| `.opencode/PAI/Tools/GetTranscript.ts` | 1 | ⚡ 5min | MECHANICAL |
| `.opencode/PAI/Tools/LoadSkillConfig.ts` | 1 | ⚡ 5min | MECHANICAL |
| `.opencode/PAI/Tools/ActivityParser.ts` | 1 | ⚡ 5min | MECHANICAL |
| `.opencode/plugins/lib/identity.ts` | 1 | ⚡ 5min | MECHANICAL |
| `.opencode/skills/Agents/Tools/LoadAgentContext.ts` | 6 | ⚡ 10min | RENAME VAR |

**Gesamt: 16 Dateien, geschätzt 8-12 Stunden Arbeit**
**Davon 3 schwere Rewrites (THEHOOKSYSTEM, MEMORYSYSTEM, TOOLS) = 4-7 Stunden**

### PR-12 Abhängigkeiten

PR-12 kann **jederzeit** erstellt werden — er hängt nicht von PR-01 bis PR-11 ab:
- Die Dateien sind bereits auf main
- PR-12 arbeitet direkt auf main
- Kann parallel zu den anderen PRs laufen

**Empfohlene Reihenfolge:** PR-12 zuerst oder parallel zu PR-01/PR-02.

### PR-12 Aufteilung (optional)

Wenn 16 Dateien + heavy Rewrites zu viel für einen CodeRabbit-Review sind:

| Sub-PR | Dateien | Fokus |
|--------|---------|-------|
| PR-12a | 8 mechanische .ts Dateien + LoadAgentContext.ts | Triviale Pfad-Fixes + Variable rename |
| PR-12b | THEHOOKSYSTEM.md + MEMORYSYSTEM.md + TOOLS.md | Die 3 schweren Rewrites |
| PR-12c | SKILLSYSTEM.md + ACTIONS.md + README.md + CLI.md + PRDFORMAT.md + Algorithm/v3.7.0.md + BuildCLAUDE.ts | Mittlere Edits + BuildCLAUDE Rename |

---

## Änderungen an bestehenden PRs

### PR-01 (PAI-Install) — Claude-Scan hinzufügen

PAI-Install Dateien die Claude-Referenzen haben können:

| Datei | Erwartete Referenzen | Aktion |
|-------|---------------------|--------|
| `PAI-Install/engine/actions.ts` | `.claude` Verzeichnisse, `@anthropic-ai/claude-code` | Prüfen: sind das korrekte Installer-Referenzen (erkennt Claude-Code-Installation) oder falsche Pfade? |
| `PAI-Install/engine/detect.ts` | `detectTool("claude", ...)` | BEIBEHALTEN — Installer muss Claude-Code-Installationen erkennen können |
| `PAI-Install/engine/types.ts` | `claude: { installed, version, path }` | BEIBEHALTEN — Interface für Detection |
| `PAI-Install/engine/provider-models.ts` | `claude-haiku`, `claude-sonnet` | BEIBEHALTEN — Modellnamen |

**Fazit PR-01:** Meiste Claude-Referenzen im Installer sind KORREKT (er muss Claude Code erkennen können). Nur `~/.claude/` Pfade die auf PAI-OpenCode Installationsziel zeigen → `~/.opencode/`.

### PR-02 (Core + Plugins) — Claude-Scan ERWEITERT

PR-02 enthält bereits die wichtigsten Code-Dateien. Semantische Arbeit in PR-02:

| Datei | Kategorie | Aktion |
|-------|-----------|--------|
| `algorithm.ts` | 1, 2, 3, 7 | `~/.claude/`→`~/.opencode/`, `CLAUDE.md`→`AGENTS.md`, `claude -p`→Task-Tool, `claude session`→Session Registry |
| `IntegrityMaintenance.ts` | 1 | `~/.claude/`→`~/.opencode/` |
| `pai.ts` | 1 | `~/.claude/`→`~/.opencode/` (falls vorhanden) |
| `session-registry.ts` | — | Prüfen ob OpenCode-konform |
| Alle anderen .ts | 1 | `~/.claude/` Pfade scannen und fixen |

### PR-03 bis PR-08 (Skill Reorgs) — Minimaler Claude-Scan

Die Skill-Reorg PRs enthalten hauptsächlich RENAMEs (gleicher Inhalt, neuer Pfad). Claude-Referenzen in Skill SKILL.md Dateien:
- Prüfen ob `~/.claude/skills/` Pfade vorhanden → `~/.opencode/skills/`
- Prüfen ob `CLAUDE.md` referenziert wird → `AGENTS.md`
- Meist keine Treffer erwartet (Skills referenzieren selten den System-Pfad)

### PR-09 (Neue Skills + Migration) — Kein Cleanup nötig

- `OpenCodeSystem/SKILL.md` — bereits OpenCode-nativ geschrieben
- `migration-v2-to-v3.ts` — Migration-Tool, Claude-Referenzen sind dort KORREKT (erklären den alten Pfad)

### PR-10 (Deletions) — Kein Cleanup nötig

Gelöschte Dateien brauchen keine Claude-Bereinigung.

### PR-11 (Root + Docs) — Claude-Scan hinzufügen

| Datei | Erwartete Referenzen | Aktion |
|-------|---------------------|--------|
| `README.md` (Root) | Mögliche `~/.claude/` Quick-Start-Pfade | → `~/.opencode/` |
| `INSTALL.md` | Mögliche Claude-Code-Referenzen | → OpenCode |
| `AGENTS.md` | Claude Code Referenzen in der Beschreibung | → OpenCode wo es um die Platform geht |
| `CONTRIBUTING.md` | `~/.claude/skills/` Pfad-Beispiele | → `~/.opencode/skills/` |
| `CHANGELOG.md` | Historische Referenzen | BEIBEHALTEN — das ist Historie |
| Neue ADRs | Bereits OpenCode-nativ | Kein Cleanup nötig |
| `docs/MIGRATION.md` | Claude-Referenzen | BEIBEHALTEN — erklärt Migration |

---

## Zusammenfassung: Claude-Cleanup pro PR

| PR | Mechanisch (Kat 1+2) | Semi-Mechanisch (Kat 3) | Semantisch (Kat 4-8) | Aufwand |
|----|----------------------|------------------------|----------------------|---------|
| PR-01 | ~2 Dateien | — | — | ⚡ 10min |
| PR-02 | ~5 Dateien | 1 Datei (algorithm.ts) | 1 Datei (algorithm.ts: session refs) | ⚠️ 1h |
| PR-03 | Scan ~141 Dateien | — | — | ⚡ 15min |
| PR-04 | Scan ~130 Dateien | — | — | ⚡ 10min |
| PR-05 | Scan ~130 Dateien | — | — | ⚡ 10min |
| PR-06 | Scan ~58 Dateien | — | — | ⚡ 5min |
| PR-07 | Scan ~130 Dateien | — | — | ⚡ 10min |
| PR-08 | Scan ~84 Dateien | — | — | ⚡ 10min |
| PR-09 | — | — | — | — |
| PR-10 | — | — | — | — |
| PR-11 | ~3 Dateien | — | 1 Datei (AGENTS.md) | ⚡ 20min |
| **PR-12** | **6 Dateien** | **2 Dateien** | **8 Dateien (3 HEAVY)** | **🔴 8-12h** |
| **GESAMT** | ~30 Dateien | 3 Dateien | 10 Dateien | **~10-14h** |

---

## Beibehalten-Liste (NICHT ändern)

| Typ | Dateien | Grund |
|-----|---------|-------|
| **Modellnamen** | `claude-opus`, `claude-sonnet`, `claude-haiku` in ~40 Dateien | Korrekte AI-Modell-Identifiers |
| **ClaudeResearcher** | Agent-Name in ~10 Dateien | Absichtlicher Agent-Name |
| **Migration-Docs** | `PAI-TO-OPENCODE-MAPPING.md`, `MIGRATION.md`, `UPSTREAM-SYNC-PROCESS.md` | Erklären den Unterschied — das ist deren Job |
| **pai-to-opencode-converter.ts** | Konvertierungs-Tool | Muss alte Pfade kennen |
| **skill-migrate.ts** + Manifest | Migration-Tools | Müssen alte Pfade kennen |
| **opencode.json** | Nur Modellnamen | Korrekt |
| **settings.json** | Nur Modellnamen + DA-Identity | Korrekt |
| **CHANGELOG.md** | Historische Einträge | Historische Korrektheit |
| **PAI-Install/engine/detect.ts** | `detectTool("claude", ...)` | Installer muss Claude Code erkennen |
| **PAI-Install/engine/types.ts** | `claude: { installed, ... }` | Interface für Detection |

---

## Aktualisierte Definition of Done (v3.0 + Cleanup)

Die bestehende DoD aus V3.0-COMPLETION-PLAN.md wird erweitert:

```markdown
### Claude→OpenCode Bereinigung vollständig:
- [ ] Kein `~/.claude/` Pfad in .ts/.md Dateien (außer Migration-Docs + PAI-Install Detection)
- [ ] Kein `CLAUDE.md` als Datei-Referenz (außer Migration-Docs)
- [ ] Kein `claude -p` in ausführbarem Code
- [ ] THEHOOKSYSTEM.md beschreibt OpenCode Plugin-System (nicht Claude Code Hooks)
- [ ] MEMORYSYSTEM.md referenziert OpenCode Session-DB (nicht projects/{uuid}.jsonl)
- [ ] TOOLS.md listet OpenCode-native Tools
- [ ] SKILLSYSTEM.md referenziert AGENTS.md (nicht CLAUDE.md)
- [ ] BuildCLAUDE.ts umbenannt zu BuildAGENTS.ts (oder gelöscht)
- [ ] claudeHome Variable umbenannt zu opencodeHome
- [ ] Kein "Claude Code" als Plattformname in Docs (außer historische Vergleiche)
```

---

## Zeitplan-Empfehlung

```
Woche 1: PR-01 + PR-02 + PR-12a (mechanische .ts Fixes)
          PR-03 + PR-04 + PR-05 (parallel — Skill Reorgs sind reine Renames)

Woche 2: PR-06 + PR-07 + PR-08
          PR-12b (THEHOOKSYSTEM + MEMORYSYSTEM + TOOLS Rewrites)
          PR-09

Woche 3: PR-10 (ERST nach PR-03 bis PR-08 gemerged)
          PR-12c (verbleibende Edits + BuildCLAUDE Rename)
          PR-11 (Root + Docs als Abschluss)

Woche 4: Verifikation, v3.0.0 Tag
```

---

*Plan erstellt: 2026-03-13*
*Repository: Steffen025/pai-opencode*
*Basis: Vollständiger Claude-Referenz-Scan auf dev-Branch (170+ Dateien, 8 Kategorien)*
