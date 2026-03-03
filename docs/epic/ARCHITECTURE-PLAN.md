# PAI-OpenCode v3.0 Re-Architecture Plan

> Complete architectural alignment with PAI v4.0.3 — hierarchical skill structure, Algorithm v3.7.0, and modern installer

**Branch:** `v3.0-rearchitecture`  
**Target:** Merge to `dev` → then `main` for v3.0.0 release  
**Effort Estimate:** 40+ hours (distributed across 8 work packages)

---

## 🎯 Goal

Transform PAI-OpenCode from flat skill structure to PAI v4.0.3's hierarchical architecture while:
1. Preserving OpenCode-specific adaptations (plugins, dual-config, `.opencode/`)
2. Upgrading Algorithm v1.8.0 → v3.7.0
3. Maintaining all 39 existing skills (plus community additions)
4. Creating migration path for existing users

---

## 📊 Current State vs Target State

| Aspect | Current (v2.x) | Target (v3.0) |
|--------|---------------|---------------|
| **Skills Structure** | Flat: `.opencode/skills/{Name}/` | Hierarchical: `.opencode/skills/{Category}/{Name}/` |
| **Algorithm Version** | v1.8.0 (Built: 19 Feb 2026) | v3.7.0 |
| **PAI Location** | `.opencode/skills/PAI/SKILL.md` (1443 lines) | `.opencode/PAI/` directory with modular files |
| **Skill Count** | 39 flat skills | 11 categories, 40+ skills |
| **Installer** | Manual/Wizard script | Full PAI-Install with GUI |
| **Categories** | None | Agents, ContentAnalysis, Investigation, Media, Research, Scraping, Security, Telos, Thinking, USMetrics, Utilities |

---

## 🗂️ New Directory Structure

```
.opencode/
├── PAI/                              # ← NEW: Core PAI system (not a skill!)
│   ├── Algorithm/
│   │   ├── LATEST                    # Symlink to v3.7.0.md
│   │   └── v3.7.0.md                 # Algorithm v3.7.0
│   ├── ACTIONS.md
│   ├── AISTEERINGRULES.md
│   ├── CLI.md
│   ├── CLIFIRSTARCHITECTURE.md
│   ├── CONTEXT_ROUTING.md
│   ├── DOCUMENTATIONINDEX.md
│   ├── FLOWS.md
│   ├── MEMORYSYSTEM.md
│   ├── PAISYSTEMARCHITECTURE.md
│   ├── PAISYSTEMARCHITECTURE.md
│   ├── PAIAGENTSYSTEM.md
│   ├── PIPELINES.md
│   ├── PRDFORMAT.md
│   ├── SKILL.md                      # Core SKILL.md (much smaller)
│   ├── SKILLSYSTEM.md
│   ├── SYSTEM_USER_EXTENDABILITY.md
│   ├── THEDELEGATIONSYSTEM.md
│   ├── THEFABRICSYSTEM.md
│   ├── THEHOOKSYSTEM.md
│   ├── THENOTIFICATIONSYSTEM.md
│   ├── TOOLS.md
│   ├── Tools/                        # PAI core tools
│   │   ├── ActivityParser.ts
│   │   ├── AlgorithmPhaseReport.ts
│   │   ├── Banner.ts
│   │   ├── ExtractTranscript.ts
│   │   ├── FailureCapture.ts
│   │   ├── FeatureRegistry.ts
│   │   ├── GetCounts.ts
│   │   ├── IntegrityMaintenance.ts
│   │   ├── LearningPatternSynthesis.ts
│   │   ├── LoadSkillConfig.ts
│   │   ├── PipelineMonitor.ts
│   │   ├── RebuildPAI.ts
│   │   ├── SecretScan.ts
│   │   ├── SessionHarvester.ts
│   │   ├── algorithm.ts
│   │   └── pai.ts
│   └── USER/                         # User customization templates
│       ├── ACTIONS/
│       ├── BUSINESS/
│       ├── FLOWS/
│       ├── PIPELINES/
│       ├── PROJECTS/
│       ├── README.md
│       ├── SKILLCUSTOMIZATIONS/
│       ├── STATUSLINE/
│       ├── TELOS/
│       ├── TERMINAL/
│       ├── WORK/
│       └── Workflows/
│
├── PAI-Install/                      # ← NEW: Full installer (from v4.0.3)
│   ├── README.md
│   ├── install.sh
│   ├── cli/
│   ├── electron/
│   ├── engine/
│   ├── web/
│   └── public/
│
├── skills/                           # ← REORGANIZED: Hierarchical structure
│   ├── Agents/                       # NEW CATEGORY
│   │   ├── AgentPersonalities.md
│   │   ├── AgentProfileSystem.md
│   │   ├── ArchitectContext.md
│   │   ├── ArtistContext.md
│   │   ├── ClaudeResearcherContext.md
│   │   ├── CodexResearcherContext.md
│   │   ├── Data/
│   │   ├── DesignerContext.md
│   │   ├── EngineerContext.md
│   │   ├── GeminiResearcherContext.md
│   │   ├── GrokResearcherContext.md
│   │   ├── PentesterContext.md       # NEW from Recon
│   │   ├── PerplexityResearcherContext.md
│   │   ├── QATesterContext.md
│   │   ├── SKILL.md
│   │   ├── Templates/
│   │   └── Tools/
│   │
│   ├── ContentAnalysis/              # NEW CATEGORY
│   │   ├── ExtractWisdom/
│   │   └── SKILL.md
│   │
│   ├── Investigation/                # NEW CATEGORY
│   │   ├── OSINT/
│   │   ├── PrivateInvestigator/
│   │   └── SKILL.md
│   │
│   ├── Media/                        # NEW CATEGORY
│   │   ├── Art/                      # Moved from root
│   │   ├── Remotion/                 # Moved from root
│   │   └── SKILL.md
│   │
│   ├── Research/                     # EXISTING (relocated)
│   │   ├── MigrationNotes.md
│   │   ├── QuickReference.md
│   │   ├── SKILL.md
│   │   ├── Templates/
│   │   ├── UrlVerificationProtocol.md
│   │   └── Workflows/
│   │
│   ├── Scraping/                     # NEW CATEGORY
│   │   ├── Apify/                    # NEW from v4.0.3
│   │   ├── BrightData/               # Moved from root
│   │   └── SKILL.md
│   │
│   ├── Security/                     # NEW CATEGORY
│   │   ├── AnnualReports/            # Moved from root
│   │   ├── PromptInjection/
│   │   ├── Recon/                    # NEW from v4.0.3
│   │   ├── SECUpdates/               # Moved from root
│   │   ├── WebAssessment/            # Moved from root
│   │   └── SKILL.md
│   │
│   ├── Telos/                        # EXISTING (relocated)
│   │   ├── DashboardTemplate/
│   │   ├── ReportTemplate/
│   │   ├── SKILL.md
│   │   ├── Tools/
│   │   └── Workflows/
│   │
│   ├── Thinking/                     # NEW CATEGORY
│   │   ├── BeCreative/               # Moved from root
│   │   ├── Council/                  # Moved from root
│   │   ├── FirstPrinciples/        # Moved from root
│   │   ├── IterativeDepth/           # Moved from root
│   │   ├── RedTeam/                  # Moved from root
│   │   ├── Science/                  # Moved from root
│   │   ├── SKILL.md
│   │   └── WorldThreatModelHarness/  # Moved from root
│   │
│   ├── USMetrics/                    # NEW CATEGORY (from v4.0.3)
│   │   ├── SKILL.md
│   │   ├── Tools/
│   │   └── Workflows/
│   │
│   └── Utilities/                    # NEW CATEGORY
│       ├── Aphorisms/                # Moved from root
│       ├── AudioEditor/              # NEW from v4.0.3
│       ├── Browser/                  # Moved from root
│       ├── Cloudflare/               # Moved from root
│       ├── CreateCLI/                # Moved from root
│       ├── CreateSkill/              # Moved from root
│       ├── Delegation/
│       ├── Documents/                # Consolidates Docx, Pdf, Pptx, Xlsx
│       ├── Evals/                    # Moved from root
│       ├── Fabric/                   # Moved from root
│       ├── PAIUpgrade/               # Moved from root
│       ├── Parser/                   # Moved from root
│       ├── Prompting/                # Moved from root
│       └── SKILL.md
│
├── VoiceServer/                      # EXISTING (relocated from skills/)
│   ├── install.sh
│   ├── menubar/
│   ├── pronunciations.json
│   ├── restart.sh
│   ├── server.ts
│   ├── start.sh
│   ├── status.sh
│   ├── stop.sh
│   ├── uninstall.sh
│   └── voices.json
│
├── plugins/                          # EXISTING (unchanged)
│   ├── pai-unified.ts
│   └── handlers/
│
├── agents/                           # EXISTING (may need updates)
│   ├── Architect.md
│   ├── Artist.md
│   ├── BrowserAgent.md
│   ├── Engineer.md
│   └── ...
│
└── (rest of existing structure)
```

---

## 📋 Work Packages (8 Phases)

### **Phase 1: Foundation & Algorithm v3.7.0** (WP1)
**Owner:** Architect Agent  
**Duration:** 6-8 hours  
**Branch:** `v3.0-rearchitecture/wp1-algorithm`

**Tasks:**
1. Create `.opencode/PAI/` directory structure
2. Port Algorithm v3.7.0 from PAI v4.0.3
3. Adapt all path references (`.claude/` → `.opencode/`)
4. Add OpenCode-specific notes to Algorithm docs
5. Create modular SKILL.md (extract from monolithic v1.8.0)

**Deliverables:**
- `.opencode/PAI/Algorithm/v3.7.0.md`
- `.opencode/PAI/SKILL.md` (core, ~200 lines)
- `.opencode/PAI/*.md` system files

**Verification:**
- Algorithm version string shows v3.7.0
- All internal links work
- OpenCode adaptations documented

---

### **Phase 2: Core PAI Tools & Infrastructure** (WP2)
**Owner:** Engineer Agent  
**Duration:** 5-7 hours  
**Branch:** `v3.0-rearchitecture/wp2-tools`

**Tasks:**
1. Port PAI core tools from v4.0.3
2. Adapt tool paths and imports
3. Update `RebuildPAI.ts` for new structure
4. Port `IntegrityMaintenance.ts`
5. Port `SecretScan.ts` with OpenCode patterns

**Deliverables:**
- `.opencode/PAI/Tools/*.ts`
- Updated build scripts

**Verification:**
- `bun PAI/Tools/RebuildPAI.ts` works
- All tools compile with Biome

---

### **Phase 3: Category Structure - Part A** (WP3)
**Owner:** Engineer Agent  
**Duration:** 6-8 hours  
**Branch:** `v3.0-rearchitecture/wp3-categories-a`

**Create Categories:**
1. **Agents/** (NEW) - Port from scratch
2. **ContentAnalysis/** (NEW) - Move ExtractWisdom
3. **Investigation/** (NEW) - Move OSINT, PrivateInvestigator
4. **Media/** - Move Art, Remotion

**Tasks per category:**
1. Create directory structure
2. Move existing skills
3. Create `SKILL.md` for category
4. Update all internal paths
5. Validate with Biome

**Deliverables:**
- 4 complete category directories
- Category-level SKILL.md files

---

### **Phase 4: Category Structure - Part B** (WP4)
**Owner:** Engineer Agent  
**Duration:** 6-8 hours  
**Branch:** `v3.0-rearchitecture/wp4-categories-b`

**Create Categories:**
1. **Scraping/** (NEW) - Move BrightData, add Apify from v4.0.3
2. **Security/** (NEW) - Reorganize AnnualReports, PromptInjection, SECUpdates, WebAssessment, add Recon from v4.0.3
3. **Telos/** - Move existing Telos
4. **USMetrics/** (NEW) - Port from v4.0.3

**Special:** Security needs consolidation of existing scattered security skills

**Deliverables:**
- 4 complete category directories
- Reorganized Security structure

---

### **Phase 5: Category Structure - Part C** (WP5)
**Owner:** Engineer Agent  
**Duration:** 6-8 hours  
**Branch:** `v3.0-rearchitecture/wp5-categories-c`

**Create Categories:**
1. **Thinking/** - Move BeCreative, Council, FirstPrinciples, IterativeDepth, RedTeam, Science, WorldThreatModelHarness
2. **Utilities/** - Move Aphorisms, Browser, Cloudflare, CreateCLI, CreateSkill, Evals, Fabric, PAIUpgrade, Parser, Prompting, add AudioEditor from v4.0.3

**Tasks:**
1. Create Documents/ sub-category (consolidate Docx, Pdf, Pptx, Xlsx)
2. Move all remaining skills
3. Create comprehensive Utilities SKILL.md

**Deliverables:**
- Complete skill hierarchy
- Consolidated Documents sub-category

---

### **Phase 6: Installer & Migration** (WP6)
**Owner:** Engineer Agent + QA  
**Duration:** 5-7 hours  
**Branch:** `v3.0-rearchitecture/wp6-installer`

**Tasks:**
1. Port PAI-Install from v4.0.3
2. Adapt installer for OpenCode paths
3. Create migration script from v2.x → v3.0
4. Update Wizard to handle restructure
5. Create upgrade documentation

**Migration Script Requirements:**
- Backup existing `.opencode/`
- Move skills to new locations
- Update path references
- Preserve user customizations

**Deliverables:**
- `.opencode/PAI-Install/` directory
- `migration-v2-to-v3.ts` script
- UPGRADE.md guide

---

### **Phase 7: Plugins & Integration** (WP7)
**Owner:** Engineer Agent  
**Duration:** 4-6 hours  
**Branch:** `v3.0-rearchitecture/wp7-plugins`

**Tasks:**
1. Update plugins for new skill paths
2. Adapt LoadContext for hierarchical structure
3. Update SecurityValidator patterns
4. Ensure PRDSync works with new structure
5. Test all hook handlers

**Critical:** Plugins must handle both old and new structure during migration

**Deliverables:**
- Updated `.opencode/plugins/`
- Backwards compatibility layer

---

### **Phase 8: Testing & Validation** (WP8)
**Owner:** QA Agent + All  
**Duration:** 6-8 hours  
**Branch:** `v3.0-rearchitecture` (integration)

**Tasks:**
1. Merge all work packages
2. Run full test suite
3. Validate with Biome (zero errors)
4. Test installer on clean macOS
5. Test migration from v2.x
6. Create test report
7. Write release notes

**Deliverables:**
- All checks passing
- RELEASE-v3.0.0.md
- Test report

---

## 🔀 Merge Strategy

```
main (v2.x stable)
  │
  ├── dev (v3.0 development baseline)
  │     │
  │     ├── v3.0-rearchitecture/wp1-algorithm
  │     ├── v3.0-rearchitecture/wp2-tools
  │     ├── v3.0-rearchitecture/wp3-categories-a
  │     ├── v3.0-rearchitecture/wp4-categories-b
  │     ├── v3.0-rearchitecture/wp5-categories-c
  │     ├── v3.0-rearchitecture/wp6-installer
  │     ├── v3.0-rearchitecture/wp7-plugins
  │     └── v3.0-rearchitecture/wp8-testing (integration)
  │           │
  │           ▼
  │     v3.0-rearchitecture (feature branch)
  │           │
  │           ▼ (after all WPs merged)
  │     dev ────────────────────────────► v3.0.0-beta
  │           │
  │           ▼ (after testing)
  │     main ─────────────────────────────► v3.0.0 release
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] All TypeScript files pass Biome check
- [ ] All imports resolve correctly
- [ ] No hardcoded `.claude/` paths remain
- [ ] All skill SKILL.md files load

### Integration Tests
- [ ] Context injection works
- [ ] Security validation works
- [ ] Work tracking works
- [ ] Rating capture works
- [ ] Agent output capture works
- [ ] PRD sync works

### Migration Tests
- [ ] v2.x → v3.0 migration script works
- [ ] User data preserved
- [ ] Custom skills moved correctly
- [ ] No data loss

### Installer Tests
- [ ] Clean install on macOS works
- [ ] Wizard completes successfully
- [ ] Voice server installs
- [ ] All hooks fire correctly

---

## 📝 Documentation Tasks

- [ ] Update README.md for v3.0
- [ ] Create UPGRADE.md migration guide
- [ ] Update architecture/ADR-002 (directory structure)
- [ ] Update MIGRATION.md
- [ ] Create CHANGELOG-v3.0.0.md
- [ ] Update ROADMAP.md

---

## 🚀 Release Plan

| Milestone | Date | Deliverable |
|-------------|------|-------------|
| WP1-3 Complete | +1 week | Algorithm + Core categories |
| WP4-6 Complete | +2 weeks | All categories + Installer |
| WP7-8 Complete | +3 weeks | Plugins + Testing |
| v3.0.0-beta | +3.5 weeks | Pre-release for testing |
| v3.0.0 release | +4 weeks | Official release |

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking user installations | Comprehensive migration script + backup |
| Lost user customizations | Preserve USER/ directory, custom agents |
| CI/CD failures | Update all workflows for new paths |
| Skill regressions | Extensive testing per category |
| Path reference errors | Automated path validation tool |

---

## 🎯 Success Criteria

1. ✅ All 39 existing skills available in new structure
2. ✅ Algorithm v3.7.0 fully functional
3. ✅ Zero Biome errors/warnings
4. ✅ Migration script tested on 3+ environments
5. ✅ Installer works on clean macOS
6. ✅ All CI/CD workflows pass
7. ✅ Documentation complete
8. ✅ Release notes published

---

## 📚 References

- **Upstream:** `/Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/Releases/v4.0.3/`
- **Current:** `/Users/steffen/workspace/github.com/Steffen025/pai-opencode/`
- **ADR-002:** `docs/architecture/adr/ADR-002-directory-structure-claude-to-opencode.md`
- **Migration Tool:** `Tools/pai-to-opencode-converter.ts`

---

*Plan created: 2026-03-03*  
*Target Release: PAI-OpenCode v3.0.0*  
*Branch: v3.0-rearchitecture*
