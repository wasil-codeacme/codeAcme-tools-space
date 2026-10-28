import { describe, expect, it } from 'vitest';
import { AccountAccessLevel } from '@/generated/prisma/enums';
import { parseAccountTable } from '@/lib/accounts/parse-account-table';

// Same shape as the Google Doc export of the 30k Club "Accounts and Secrets" sheet.
const SHEET = String.raw`# **Accounts and Secrets**

| Tool | What we use it for | Link | Login email | Access level |
| :---- | :---- | :---- | :---- | :---- |
| Circle | The community: spaces, courses | https\://example.circle.so/ | owner@example.com (Anna) | Master |
| Fathom | Records and transcribes calls |https\://fathom.video/teams/example.org |  |  |
| Google Workspace | The new email | https\://admin.google.com | [jo@example.com](mailto:jo@example.com) google login | Master with 2FA |
| GHL | Managing | https\://www\.gohighlevel.com/ | dev@example.com google sign in | Admin |
| SayWhat | Two accounts exist. Remove the duplicate. |  |  |  |
| Squarespace | Old website | https\://www\.squarespace.com | example.com | Master |
`;

describe('parseAccountTable', () => {
  const parsed = parseAccountTable(SHEET);

  it('reads every row of the Markdown table', () => {
    expect(parsed.rows.map((row) => row.name)).toEqual([
      'Circle',
      'Fathom',
      'Google Workspace',
      'GHL',
      'SayWhat',
      'Squarespace',
    ]);
    expect(parsed.skipped).toEqual([]);
  });

  it('unescapes Google Docs Markdown in links and emails', () => {
    expect(parsed.rows[0]).toMatchObject({
      purpose: 'The community: spaces, courses',
      url: 'https://example.circle.so/',
      username: 'owner@example.com (Anna)',
      accessLevel: AccountAccessLevel.MASTER,
    });
    expect(parsed.rows[2]?.username).toBe('jo@example.com google login');
    expect(parsed.rows[3]?.url).toBe('https://www.gohighlevel.com/');
  });

  it('turns "Master with 2FA" into an access level plus a 2FA note', () => {
    expect(parsed.rows[2]).toMatchObject({
      accessLevel: AccountAccessLevel.MASTER,
      twoFactor: 'Enabled',
    });
    expect(parsed.rows[3]).toMatchObject({
      accessLevel: AccountAccessLevel.ADMIN,
      twoFactor: null,
    });
  });

  it('keeps empty cells as null', () => {
    expect(parsed.rows[4]).toMatchObject({ url: null, username: null, accessLevel: null });
  });

  it('accepts tab-separated rows pasted from a spreadsheet', () => {
    const tsv = 'Tool\tLink\tLogin email\tAccess level\nTrello\ttrello.com\tdev@example.com\tAdmin';
    expect(parseAccountTable(tsv).rows).toEqual([
      {
        name: 'Trello',
        purpose: null,
        url: 'https://trello.com',
        username: 'dev@example.com',
        accessLevel: AccountAccessLevel.ADMIN,
        twoFactor: null,
      },
    ]);
  });
});
