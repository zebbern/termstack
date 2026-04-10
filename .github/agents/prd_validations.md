# PRD Validation Rules

This document defines the mandatory and recommended fields/sections for every PRD processed by the `prd_analyst` agent. Use this as a checklist to flag missing or underspecified requirements.

---

## Mandatory Sections

Every PRD **must** contain all of the following sections. If any are missing or severely underdeveloped (empty, single sentence, or vague placeholders), flag them in the Audit Report.

### Section 1: PRD Header

- [ ] **Project Name** – Must be non-empty and descriptive
- [ ] **Date / Owner / Version / Status** – Date must be present; Owner email/handle required; Version format (e.g., v1.0, v2.1-beta); Status (draft, in-review, approved, archived)
- [ ] **One-Liner Summary** – A single sentence that distills the feature's purpose

### Section 2: Business & Context

- [ ] **2.1 Business Objective** – At least one clear business goal (e.g., "Reduce churn by 15%", "Enable x12 payment flows")
- [ ] **2.2 Target Users** – At least one primary user segment (e.g., "Merchants", "End-users", "Admins") with brief description
- [ ] **2.3 Key Metrics / Success Criteria** – At least one measurable success metric (e.g., "Adoption rate ≥ 40%", "Support tickets ↓ 20%")

### Section 3: User Flows (Functional Requirements)

- [ ] **3.1 Primary Flows** – At least one complete user journey (minimum 3–5 steps per flow)
- [ ] **3.2 Error Flows** – At least one error/failure scenario (e.g., "Network timeout", "Invalid input", "Permission denied")

### Section 4: Technical Requirements

- [ ] **4.1 Analytics Events** – At least one analytics event or tracking point (e.g., "track_feature_view", "track_transaction_completed")

### Section 5: Platform-Specific Details

- [ ] **5.1 Platform Coverage Matrix** – Must specify which of {Android, iOS, Desktop} are in scope; for out-of-scope platforms, document why
- [ ] **5.2 OS-Specific Constraints** – At least a note about min OS versions or device constraints (if applicable)

### Section 6: Constraints & Assumptions

- [ ] **6.1 Technical Constraints** – At least one (e.g., network latency, storage limits, API rate limits)
- [ ] **6.2 Business Constraints** – At least one (e.g., timeline, regulatory, stakeholder)
- [ ] **6.3 Assumptions** – At least two (e.g., assumptions about user behavior, data availability, system state)

---

## Recommended Sections

Not mandatory, but strongly recommended for completeness:

- **Non-Functional Requirements** (NFRs): Performance targets, accessibility, security, data retention
- **API Contracts**: Endpoint definitions, request/response schemas (can be inline or linked to OpenAPI spec)
- **Design Artifacts**: Links to Figma, wireframes, or mockups
- **Content / Localization**: Strings, translations, regional considerations
- **Risk & Mitigation**: Known unknowns, release risks, rollback criteria
- **Dependencies**: External services, internal modules, third-party integrations

---

## Gap Detection Rules

When comparing a provided PRD against this file, flag the following as **gaps**:

- [P0-MUST] **Missing section headings** — If a section is entirely absent.
- [P0-MUST] **Empty or placeholder content** — E.g., "TBD", "TK", single sentences for complex sections.
- [P1-SHOULD] **Lack of specificity** — E.g., "improve user experience" without metrics.
- [P0-MUST] **Incomplete user flows** — Fewer than 3 documented steps, no happy/sad path distinction.
- [P0-MUST] **No platform specification** — PRD does not clarify Android/iOS/Desktop scope.
- [P1-SHOULD] **Ambiguous success criteria** — Metrics without measurable targets (e.g., "increase engagement" vs. "increase DAU by 10%").
- [P0-MUST] **Missing error handling** — No documented error flows or failure modes.
- [P1-SHOULD] **No analytics plan** — Feature ships with zero tracking.
- [P0-MUST] **Contradictions** — E.g., flow states feature as mandatory on iOS but 5.1 says iOS is out-of-scope.

---

## Audit Report Template

When gaps are found, the agent should produce an audit report in this format:

```
## Audit Report: <PRD Title>

### Missing Sections
- Section X.Y – <reason why gap is critical>

### Underspecified Content
- Section A.B – <description of what is vague or incomplete>

### Contradictions
- (if any) – <details>

### Recommendations
- (optional) Clarifications or open questions for the PRD author

### Overall Assessment
- ✅ Ready for planning (all mandatory fields complete, no critical gaps)
- ⚠️  Ready with caveats (minor gaps; team can proceed with defined assumptions)
- ❌ Not ready (critical gaps; must be resolved before planning)
```
