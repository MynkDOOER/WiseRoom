Phase 1 — 
Core Single-User RAG (get this fully working before anything else)
Auth + rooms + PDF upload → chunk → embed → store → @askAI answers with citations, for one user, one file type. No real-time, no multi-format yet. This proves the fundamental pipeline works end-to-end.


1) Integrate Clerk → get userId on every request (via their middleware in Express)
2) Room creation: rooms table with id, name, createdBy (userId), inviteToken
3) Room join: resolve invite link → add (roomId, userId) to a room_members table
4) PDF upload: single endpoint, store file, create files row with status pending
5) Chunk + embed: extract text from PDF, split into chunks, generate embeddings, store in a chunks table with pgvector column
6) @askAI: embed the question → vector search scoped to roomId → build prompt with top chunks → call Gemini → return answer with citations

[]








Phase 2 — Multi-Format Ingestion
Extend the same pipeline to handle PPTX, DOCX, and images (OCR), each with proper chunking. Add the job queue (BullMQ + Redis) so uploads don't block the app. Still single-user at this point — you're only widening what the pipeline can ingest.

Phase 3 — Real-Time Multi-User Layer
This is where it becomes "Huddle" instead of "ChatPDF clone." Socket.io rooms, shared live thread, presence indicators, attribution (who uploaded/asked what) surfaced in the UI. This is your actual differentiator — don't compress this phase to save time elsewhere.

Phase 4 — Incremental Re-Indexing + Polish
New files uploading mid-session without breaking active conversations, live indexing-status UI, citation chips, knowledge-map/whatever frontend polish you want. This is the phase to cut short first if you're running out of time — it's the least essential to the core demo.