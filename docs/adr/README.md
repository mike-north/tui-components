# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for TUI Components.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences. Each ADR describes:

- The context and problem statement
- The decision made
- Alternatives considered
- Consequences (positive and negative)
- Implementation notes

ADRs help maintain institutional knowledge about why certain design decisions were made, especially as the project evolves and team members change.

## ADR Format

Each ADR follows this structure:

1. **Status**: Proposed, Accepted, Deprecated, or Superseded
2. **Context**: What is the issue we're facing?
3. **Decision**: What are we doing about it?
4. **Alternatives Considered**: What other options did we evaluate?
5. **Consequences**: What are the impacts (positive and negative)?
6. **Implementation Notes**: Technical details for implementers

## ADRs

| Number                         | Title                           | Status   |
| ------------------------------ | ------------------------------- | -------- |
| [001](001-gradient-support.md) | Gradient Support for Bar Charts | Proposed |

## ADR Status Definitions

- **Proposed**: Under discussion, not yet accepted. Implementation should wait for acceptance.
- **Accepted**: Decision has been made and approved. Implementation can proceed.
- **Deprecated**: No longer relevant but kept for historical context.
- **Superseded**: Replaced by a newer ADR (includes reference to the superseding ADR).

## Creating New ADRs

When creating a new ADR:

1. Use the next available number (e.g., `002-title.md`)
2. Use kebab-case for the filename
3. Start with status "Proposed"
4. Add an entry to the table above
5. Follow the format of existing ADRs
