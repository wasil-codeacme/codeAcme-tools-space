# Glossary

| Term                           | Meaning                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Tool**                       | A self-contained feature on the platform dashboard (e.g. Time Tracking). Registered in `src/config/tools.ts`. |
| **Admin**                      | Can manage the team, clients, categories and reports, and sees all time entries.                              |
| **Member**                     | Logs time for the clients they are assigned to and sees only their own entries.                               |
| **Client**                     | A company CodeAcme works for (e.g. The 30k Club, AeneDental). Can be archived.                                |
| **Assignment**                 | A member being allowed to log time for a client (`ClientMember`).                                             |
| **Monthly limit**              | A client's retainer cap in hours. Drives the usage meter, "Limit reached" status and warnings.                |
| **Category**                   | Optional per-client label on an entry (e.g. "Calls and messages with Anna and Jo").                           |
| **Time entry / item**          | One line of work: date, exact duration in minutes, task, optional category, requested by, link.               |
| **Needs review**               | Flag for a time the author is unsure about (the "??" in the old notes).                                       |
| **Day heading**                | A notes line such as "time spent on 21st October" that sets the day for the lines below it when pasting.      |
| **Sheet week / week of month** | Monday–Sunday week cut at month boundaries, numbered 1–6 within a month ("Week 4 (Oct 19–25)").               |
| **Report period**              | `WEEK` (Mon–Sun), `TWO_WEEKS` (14 days from a Monday) or `MONTH` (calendar month).                            |
| **Branding**                   | `CodeAcme` (logo, company name, footer) or `Unbranded` (client name only) on reports.                         |
| **DateKey**                    | A calendar day as a `yyyy-MM-dd` string, used everywhere instead of `Date` for work dates.                    |
| **Account**                    | A login for a tool or service (Circle, Kajabi…) belonging to a client or to CodeAcme internal.                |
| **Access level**               | Master, Admin or User: how much control that login has in the tool.                                           |
| **Secret**                     | An account's password or API key, or its secure notes. Stored encrypted; revealing one is audited.            |
| **Work session**               | One start-to-stop run of the Work Timer, timed in the browser; pauses are not counted. Saved on Stop.         |
