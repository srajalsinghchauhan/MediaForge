# AI Usage

> Disclosure of AI-assisted development for the MediaForge take-home assignment.

## AI-assisted development disclosure

MediaForge is developed with assistance from AI coding tools. Humans remain responsible for architecture decisions, correctness, security review, and final submission quality.

This document will be updated as implementation proceeds. At the **specification stage**, AI assistance is used to draft architecture and skill documents from the assignment brief.

---

## Cursor usage

**Planned / in use**

- Cursor Agent for scaffolding documentation structure (`docs/*`, `skills/*`, `README.md`, `.gitignore`).
- Cursor for later implementation of packages and the web app according to these specs.
- Cursor skills in this repo (`skills/wiring-data`, `skills/using-components`) will guide correct consumption of `media-react` and `media-ui-react`.

**Expectations**

- AI-generated code is reviewed against package boundary rules.
- AI must not invent fake live URLs or claim unfinished work is shipped.
- Secrets (Pexels API keys) are never pasted into prompts or committed.

---

## ChatGPT / Claude usage

May be used for:

- Rubber-ducking API shape alternatives
- Reviewing prose clarity in docs
- Generating test case ideas

Not used as a substitute for:

- Running tests
- Verifying Pexels API behavior against official docs at implementation time
- Security sign-off

Any substantial external chat threads relevant to grading should be linked from the root README under **AI conversations** when available (currently `_TBD_`).

---

## How skills will be tested

The assignment requires two `SKILL.md` files. Graders or automated agents may:

1. Load `skills/wiring-data/SKILL.md` and ask an assistant to wire search + pagination + events using `media-react`.
2. Load `skills/using-components/SKILL.md` and ask an assistant to compose Grid / Lightbox / Reel Swiper with app-owned styles.

**Success criteria for skills**

- Respect package boundaries (no UI → core imports).
- Use provider + hooks correctly.
- Handle loading / error states.
- Use prop getters instead of fighting imposed styles.
- Show correct vs incorrect examples as documented.

Skills describe **planned** APIs consistent with [API_CONTRACTS.md](./API_CONTRACTS.md). Until packages exist, skills are implementation guides, not runtime-verified manuals.

---

## Human review expectations

Before submission of implementation milestones, a human should verify:

| Area | Review |
| --- | --- |
| Architecture | Dependency graph matches [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Security | No committed secrets; logging policy followed |
| Types | Public exports match contracts |
| UX demo | Search → Grid → Lightbox; videos → Reel |
| Tests | Critical unit + boundary tests pass |
| Docs | README links updated only with real URLs |
| AI output | No hallucinated endpoints or fake “done” claims |

---

## Integrity notes

- AI may accelerate boilerplate; design choices in [SCOPE_AND_DECISIONS.md](./SCOPE_AND_DECISIONS.md) are intentional product decisions.
- If AI suggests violating headless or boundary rules, those suggestions must be rejected.
- Prefer regenerating against these specs over ad-hoc incompatible APIs.

---

## Related documents

- [skills/wiring-data/SKILL.md](../skills/wiring-data/SKILL.md)
- [skills/using-components/SKILL.md](../skills/using-components/SKILL.md)
- [SCOPE_AND_DECISIONS.md](./SCOPE_AND_DECISIONS.md)
