# Node Description Batch 19 of 19

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "users_page_presidentuserspage": "PresidentUsersPage()" | kind=code-symbol | source=src/app/dashboard/president/users/page.tsx:L9 | neighbors=[page.tsx]
- "verify_route_get": "GET()" | kind=code-symbol | source=src/app/auth/v1/verify/route.ts:L3 | neighbors=[route.ts]
- "wallet_loading_walletloading": "WalletLoading()" | kind=code-symbol | source=src/app/dashboard/wallet/loading.tsx:L3 | neighbors=[loading.tsx]
- "wallet_page_walletpage": "WalletPage()" | kind=code-symbol | source=src/app/dashboard/wallet/page.tsx:L11 | neighbors=[page.tsx]
- "logocolor_png": "YDC Colored Logo" | kind=entity | source=public/logocolor.png
- "public_icon_png": "YDC Portal Logo Icon" | kind=entity | source=public/icon.png
- "public_icontransparent_png": "YDC Transparent Logo" | kind=entity | source=public/icontransparent.png
- "readme_md": "README.md" | kind=entity | source=README.md

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-018.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
