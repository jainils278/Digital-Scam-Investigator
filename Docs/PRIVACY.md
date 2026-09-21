# Privacy Policy & Data Architecture

**Digital Scam Investigator** is designed from the ground up as an **Evidence-First, Privacy-Preserving Defensive Cybersecurity Platform**.

---

## 1. Core Privacy Guarantees

1. **Zero Permanent Server Retention**:
   - The backend server operates strictly ephemerally in memory.
   - User submitted text, email content, and SMS messages are **never written to a database, file system, or disk cache** on the server.
   - Once an investigation completes and the JSON response is returned, the submitted text is discarded by the garbage collector.

2. **Zero Raw-Text Logging**:
   - Structured server logs record operational metadata only (`timestamp`, `reqId`, `endpoint`, `durationMs`, `httpStatus`, `aiProviderMode`).
   - Log sanitizers unconditionally redact and strip raw messages, evidence quotes, OTPs, PINs, passwords, and tokens before logging.
   - Client IP addresses are hashed using SHA-256 for abuse mitigation without recording traceable user identities.

3. **Client-Side History Ownership**:
   - Investigation history is stored exclusively in the user's browser `localStorage` on their local machine.
   - The user has full, immediate control to delete local history at any time using the **Clear Local History** button in the history drawer.
   - Users on shared or public workstations are advised to clear history upon completing their session.

4. **Third-Party AI Integration**:
   - When configured with `OPENAI_API_KEY`, contextual inferences are analyzed via OpenAI API endpoints.
   - Sensitive PII (card numbers, phone numbers, personal emails) can be redacted in the workstation terminal prior to scanning using the built-in **Redact PII Preview** feature.
   - When no external AI key is configured, the system defaults automatically to the completely offline, local deterministic `Defensive Heuristic Engine`.

5. **Defensive Boundary**:
   - The system is purely diagnostic and defensive. It does not perform active probing, credential harvesting, or offensive surveillance.
