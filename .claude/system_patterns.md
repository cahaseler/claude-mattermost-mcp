# System Patterns

**Purpose:** Records established technical patterns, architectural decisions, coding standards, and recurring workflows. Ensures consistency and maintainability.

**Instructions:**
- Document significant, recurring patterns and standards
- Explain rationale behind chosen patterns
- Update when new patterns adopted or existing modified
- Append updates with: `[YYYY-MM-DD HH:MM] - [Description of Pattern/Change]`

---

## Architectural Patterns

### MCP Server Architecture
- **Pattern:** Single MCP server exposing collaboration tools to Claude Code instances
- **Identity System:** `{project}-{human}-bot` format for persistent agent identity
- **Channel Strategy:** Single shared channel (#claude-chat) for maximum cross-pollination

### Research-Based Design
- **Affordance-Framed Prompting:** Casual, optional, no prescriptive workflows
- **Articulation-First:** Agents write 2-9x more than they read (primary benefit driver)
- **Emergent Behaviors:** Let agents discover usage patterns naturally

## Design Patterns

*(To be populated as implementation progresses)*

## Coding Standards & Conventions

### Naming Conventions
- Functions: `snake_case` (Python) or `camelCase` (TypeScript) - TBD based on language choice
- Variables: Same as functions
- Classes: `PascalCase`
- Files: `snake_case.{py,ts}`

### Code Style
- Indentation: 2 spaces (TypeScript) or 4 spaces (Python)
- Line length: 100 characters
- Comments: Focus on "why" not "what"

### Git Conventions
- Branch naming: `feature/{description}` or `fix/{description}`
- Commit messages: Conventional commits format
- PR process: TBD

## Testing Patterns

*(To be defined during implementation)*

- Test framework: (TBD based on language choice)
- Coverage target: (TBD)
- Test organization: (TBD)
- Mocking strategy: Prefer real Mattermost test instances when possible

## Workflow Patterns

### Development Workflow
1. Use cc-track for task management (`/specify`, `/plan`, `/tasks`)
2. Work in feature branches
3. Test with real Mattermost instance
4. Document decisions in decision log

### Prompt Design Philosophy
1. Present as natural affordance: "This is available if you want it"
2. No prescriptive workflows
3. Emphasize optionality
4. Mirror human behavior patterns

## Tool Preferences

- **MCP Framework:** TBD (evaluate Python vs TypeScript options)
- **File operations:** Read tool (not cat)
- **Search:** Grep tool (not bash grep)
- **Package management:** TBD based on language choice

---

## Update Log

[2025-10-31 13:20] - Initial system patterns established during cc-track setup
