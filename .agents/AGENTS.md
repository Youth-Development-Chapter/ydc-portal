# YDC Portal Workspace Rules

## Graphify Integration
This codebase has a pre-computed knowledge graph configured in `.graphify/`.
Whenever you start a task in this workspace:
1. Run `graphify check-update .` to check if the local graph is in sync with the file system.
2. If code changes have been made, run `graphify update` to sync the graph (this is code-only, fast, and token-free).
3. If new documents or images are added, run the semantic extraction pipeline as defined in the `graphify-windows` skill to update the graph.
4. Before exploring the codebase, you can run `graphify query "<your-question>"` or `graphify summary` to quickly orient yourself without wasting context window tokens.
