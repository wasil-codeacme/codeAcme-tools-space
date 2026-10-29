# Our secrets vault vs Bitwarden (and 1Password)

_Research note for CodeAcme LLC (about 5–10 people). Written 2026-10-29. All prices are "as of 2026-10-29" and **must be re-checked on the vendor page before buying**._

## The question

CodeAcme Tools already stores client account passwords and secure notes, encrypted in Postgres. The owner wants to know:

1. Is that safe enough for our own passwords?
2. Can we send a client a one-time link, like Bitwarden Send?
3. Should we buy Bitwarden (or another manager), with "CodeAcme internal" kept apart from each client?

## 1. Is our current approach safe?

**What we have.** `src/lib/secret-cipher.ts` uses AES-256-GCM with a random 12-byte IV for each value and one key from the `SECRETS_ENCRYPTION_KEY` environment variable. Ciphertexts carry a `v1` version prefix. Ciphertext stays in the repository layer. Plaintext is only returned by the audited `revealSecret` action. Access is set per tool (View or Edit) and per client.

**What it protects against.**

- **A leaked database dump or backup.** Without the key, the stored values are useless. GCM is authenticated, so a tampered value fails to decrypt instead of returning wrong data.
- **Casual exposure.** List screens only show `hasSecret`. Every reveal or copy writes an audit row.

**What it does not protect against.**

- **Someone who gets into the server or the environment.** One key decrypts everything. Anyone who can read the Vercel env vars, or run code in the app, can read every secret. OWASP says to keep keys away from the data and to avoid env vars, which "can be accidentally exposed" ([OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)).
- **It is not zero-knowledge.** The server sees plaintext on every reveal. In Bitwarden and 1Password, data is encrypted and decrypted on the user's device, so the vendor cannot read it ([Bitwarden security white paper](https://bitwarden.com/help/bitwarden-security-white-paper/), [1Password item-sharing security](https://support.1password.com/share-items-security/)).
- **No per-user keys.** Access rules are only code checks. A bug in the policy layer exposes everything.
- **Insiders.** A member with View access can reveal and copy every secret in their scope. The audit log only shows it afterwards.
- **No MFA on app sign-in today.** A stolen password gets a member everything they can see.
- **Swapped values.** Ciphertexts are not bound to their record (no GCM "additional data"). Someone who can write to the database could move a value into a row they are allowed to reveal.

**Verdict.** This is reasonable protection against a database or backup leak. It is **not** equal to a real password manager, mainly because of the single server-side key. It is fine for low- and medium-sensitivity items. It is not where we should keep our most important credentials: domain registrar, cloud root accounts, client production admin.

**Hardening steps, cheapest first.**

1. **MFA for everyone, required for admins.** Use TOTP or passkeys.
2. **Rate-limit reveals and alert on spikes.** We already have a `RateLimiter` port (Upstash in production) for login. Reuse it, for example 20 reveals per user per hour, and email an admin when the limit is hit.
3. **Short reveal windows.** Hide the value again after about 30 seconds, and clear the clipboard where the browser allows it.
4. **Least privilege.** Give most members View on only their own clients. Review Edit grants every quarter.
5. **Review the audit log.** Look at it monthly, and add an export.
6. **Bind ciphertext to its row.** Pass the record id as GCM additional data (`cipher.setAAD`).
7. **Key rotation.** Add `v2` beside `v1`, re-encrypt in a background job, and keep the old key until backups age out. OWASP recommends rotating after compromise or at the end of the key's lifetime, and keeping retired keys for old backups ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html#key-lifetimes-and-rotation)).
8. **Envelope encryption with AWS KMS.** Encrypt each secret with its own data key, and wrap that data key with a KMS key that never leaves AWS's FIPS 140-3 hardware ([AWS KMS envelope encryption](https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html#enveloping)). Vercel functions can call AWS through OIDC federation without long-lived AWS keys ([Vercel OIDC → AWS](https://vercel.com/docs/oidc/aws)). Cost is about $1 per key per month plus $0.03 per 10,000 requests, and the first 20,000 requests each month are free ([AWS KMS pricing](https://aws.amazon.com/kms/pricing/)). Every decrypt also shows up in CloudTrail. _Note:_ Vercel KMS is currently a **signing-only** service (JWTs and messages), not an encryption key store, so it does not fit this need ([Vercel KMS](https://vercel.com/docs/kms)).
9. **Encrypted backups.** Turn on provider encryption for database backups, and keep the key out of every backup.

Even with all of this, the server can still decrypt. That is the gap a real password manager closes.

## 2. One-time share links

### How Bitwarden Send works

- The client generates a **128-bit random secret**. It derives an AES-256 key from it with HKDF-SHA256 and encrypts the content on the device ([Send encryption](https://bitwarden.com/help/send-encryption/)).
- The link looks like `https://vault.bitwarden.com/#/send_id/encryption_key`. The part after `#` (the fragment) "is not sent to the server", so the server only stores ciphertext and an ID ([Send encryption](https://bitwarden.com/help/send-encryption/)).
- **Options:** a maximum access count, an expiry date, and a deletion date of at most 31 days (after which "the Send and its contents will be completely purged"). You can also add an optional password, hide your email, or limit access to verified email addresses. Text Sends hold up to 1,000 characters, and file Sends up to 500 MB ([About Send](https://bitwarden.com/help/about-send/)).
- The password is **only an access check**, not part of the encryption ([Send encryption](https://bitwarden.com/help/send-encryption/)).

1Password Business can also share an item through a link to people without 1Password. The link has an expiry and can be limited to verified emails or a whole domain. The share secret is generated on the device and never sent to the server ([Share items](https://support.1password.com/share-items/), [sharing security](https://support.1password.com/share-items-security/)). Its docs do not mention a view-once option.

### If we build our own

**Design.**

1. Generate a random 256-bit key **in the sender's browser** (Web Crypto) and encrypt there with AES-GCM. The server never sees plaintext.
2. Store `{ id, ciphertext, iv, expiresAt, maxViews: 1, viewCount, createdBy, clientId }`. Each new share is written to the audit table.
3. The link is `https://tools.codeacme.com/s/<id>#<key>`. The fragment never reaches the server, the logs or Vercel analytics.
4. The recipient's page **does nothing until they click "Reveal"**. The click calls a Server Action that **atomically** returns the ciphertext and deletes the row (or marks it used), in one transaction. The browser then decrypts with the key from the fragment and offers **Copy** and **Download .txt**.
5. Optional passphrase. Use it as a second key mixed in with PBKDF2 or Argon2, not only a server check, and send it over a different channel such as a phone call or SMS.
6. Rate-limit the reveal endpoint by IP. Keep expiry short (default 24 hours, at most 7 days). A cron job deletes expired rows.
7. Never log full URLs. Set `Referrer-Policy: no-referrer` and `Cache-Control: no-store`, and put `noindex` on the page.

**Pitfalls.**

- **Link previews use up the single view.** Slack, Teams and email scanners fetch links to build previews ([Slack link unfurling](https://docs.slack.dev/messaging/unfurling-links-in-messages)). The explicit **Reveal** click (a POST, never a GET) is the fix.
- **Browser history and forwarding.** The key sits in the URL, which can be saved in history or forwarded. Burn-after-read limits this. A passphrase sent separately closes it.
- **Copying out of chat.** Once revealed, the client can paste it anywhere. Tell clients to store it in their own manager.

**Effort.** About **3–5 developer days**: schema and migration (0.5), browser crypto and the create dialog (1), the public reveal page and atomic burn (1), rate limit, audit, cleanup cron and headers (0.5–1), tests including Playwright (1–1.5).

## 3. Bitwarden for teams

**Plans.** Teams costs **$4 per user per month** and Enterprise **$6 per user per month**, both billed annually, as of 2026-10-29 ([Bitwarden business pricing](https://bitwarden.com/pricing/business/)). Monthly billing is possible but costs more. Re-check before buying.

| Feature                              | Teams | Enterprise |
| ------------------------------------ | ----- | ---------- |
| Collections, groups, event logs, API | Yes   | Yes        |
| Directory Connector                  | Yes   | Yes        |
| SSO login, enterprise policies       | No    | Yes        |
| Self-host option, account recovery   | No    | Yes        |

Source: [Password Manager plans](https://bitwarden.com/help/password-manager-plans/). The free organization (2 users, 2 collections) is too small for us.

**Modelling internal vs per client.** Use one **Organization** ("CodeAcme"). Put items in **Collections** such as `CodeAcme internal`, `Client – Acme`, `Client – Beta`, and so on. Each collection grants access to members or groups at five levels: _View items_, _View items, hidden passwords_, _Edit items_, _Edit items, hidden passwords_, and _Manage collection_ ([Collection permissions](https://bitwarden.com/help/collection-permissions/)). Nested collections only change how the list displays. They **do not inherit access**, so set each one explicitly ([About collections](https://bitwarden.com/help/about-collections/)). A "hide passwords" level lets a developer autofill without seeing the password.

**Sharing with clients.** Use **Send** for one-off handovers. For a long-running shared set, invite the client contact as an org member with access to only their collection. That uses a paid seat.

**Audit.** Teams includes event logs for viewed items, viewed passwords and copied passwords. You can view up to 367 days at a time, export to CSV, or read them through the API and SIEM integrations. Bitwarden notes that client-side events can be lost if a client is offline or modified ([Event logs](https://bitwarden.com/help/event-logs/)).

**Self-hosting.** The official self-hosted organization needs an **Enterprise** licence ([Self-host an organization](https://bitwarden.com/help/self-host-an-organization/)). **Vaultwarden** is an unofficial Rust server that works with the Bitwarden apps and supports organizations, collections, event logs and Send. It "is not associated with Bitwarden" ([Vaultwarden](https://github.com/dani-garcia/vaultwarden)). Self-hosting makes us responsible for uptime, backups and patching. For 8 people, the cloud is the safer choice.

**1Password Business.** It costs **$8.99 per user per month** billed annually. The Teams Starter Pack is **$24.95 per month for up to 10 members**, all as of 2026-10-29 ([1Password business pricing](https://1password.com/pricing/business)). Business gives one vault per client, guest accounts limited to a single vault, SSO, SIEM events, and share-by-link with expiry and email or domain limits. The apps are polished, but it costs about twice as much as Bitwarden Teams.

## 4. Comparison

|                          | Our vault (today)                                                   | Bitwarden Teams                                               | 1Password Business                                         |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Security model           | Server-side AES-256-GCM, one env key. **Not zero-knowledge**        | Encrypted on the device, **zero-knowledge**                   | Encrypted on the device, **zero-knowledge**                |
| Internal vs client split | Yes (grouping plus per-client policy)                               | Collections per client                                        | Vaults per client                                          |
| Client sharing           | None yet (one-time link = 3–5 days)                                 | Send (burn after N views, expiry, password), or a client seat | Share link (expiry, email or domain limit), guest accounts |
| Audit                    | Reveal and copy audit table                                         | Event logs (view, copy, edit), CSV, API, SIEM                 | Activity reports, SIEM streaming                           |
| SSO / MFA                | No MFA yet                                                          | MFA yes; SSO Enterprise only                                  | MFA and SSO                                                |
| Cost for ~8 users        | $0 (dev time; KMS about $1/month)                                   | about $32/month ($384/year)                                   | about $72/month (Business) or $24.95/month (Starter Pack)  |
| Effort                   | Hardening 3–6 days; one-time links 3–5 days                         | About 1 day to set up and import                              | About 1 day to set up and import                           |
| Main risk                | Server or env compromise exposes everything; we maintain the crypto | Vendor dependency; members must keep strong master passwords  | Vendor dependency; higher cost                             |

_Costs are as of 2026-10-29. Re-check them._

## 5. Recommendation

**Use both tools, each for what it does well.**

1. **Buy Bitwarden Teams** (about $384 a year for 8 users) for every real credential. Use one organization with a `CodeAcme internal` collection plus one collection per client. Default most members to the "hide passwords" levels. Require two-step login for all members.
2. **Keep CodeAcme Tools as the inventory**: what accounts exist, for which client, who owns them, 2FA status, and _where the credential lives_ (for example "Bitwarden › Client – Acme"). Only keep low-sensitivity secrets there.
3. **Share with clients using Bitwarden Send**: one access, 1–7 day expiry, password sent over a different channel. Build our own one-time link (3–5 days) only if we want it branded and inside the app.
4. **Harden the app anyway**, because it still holds some secrets: MFA, reveal rate limits and alerts, binding ciphertext to its row, and key versioning. Add KMS envelope encryption if it keeps anything sensitive.

**Migration steps.**

1. Start the Bitwarden Teams trial and create the org and collections. Make groups for "Admins" and "Developers".
2. Export from CodeAcme Tools to a temporary CSV on an admin machine and import it into Bitwarden by collection. Delete the CSV securely.
3. Rotate the most critical credentials during the move (anything that has been in chat or email).
4. In CodeAcme Tools, replace the stored secret with a "Stored in Bitwarden › <collection>" pointer and clear the ciphertext.
5. Review Bitwarden event logs and collection access every month.
6. Add a short ADR under `docs/adr/` recording this split.
