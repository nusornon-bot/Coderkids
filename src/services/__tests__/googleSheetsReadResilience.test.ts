import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readProfilesFromGoogleSheet,
  readLogsFromGoogleSheet,
  resetSheetReadCooldown,
  STUDENTS_SHEET_TITLE,
  LOGS_SHEET_TITLE,
  TARGET_SPREADSHEET_ID,
} from '../googleSheetsService.ts';

describe('Google Sheets resilient reading', () => {
  const originalFetch = globalThis.fetch;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetSheetReadCooldown();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it('does not throw or log console.error when network fetch fails with TypeError: Failed to fetch', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;

    const [studentsRes, logsRes] = await Promise.all([
      readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE),
      readLogsFromGoogleSheet(TARGET_SPREADSHEET_ID),
    ]);

    expect(studentsRes).toEqual({ rows: [], sheetTitle: STUDENTS_SHEET_TITLE });
    expect(logsRes).toEqual({ rows: [], sheetTitle: LOGS_SHEET_TITLE });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('reads CSV rows via same-origin /api/sheets/read proxy without calling docs.google.com directly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          source: 'public_gviz',
          rows: [],
          csvText: '"เลขประจำตัว","ชื่อ-นามสกุล"\n"10001","ด.ช. กิตติ"\n',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchMock as any;

    const res = await readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('/api/sheets/read?');
    expect(calledUrl).not.toContain('docs.google.com');
    expect(res.rows).toEqual([
      ['เลขประจำตัว', 'ชื่อ-นามสกุล'],
      ['10001', 'ด.ช. กิตติ'],
    ]);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('applies cooldown after auth_required response and bypasses cooldown when forceRefresh is true', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: false, reason: 'auth_required', rows: [], csvText: '' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchMock as any;

    await readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE);
    await readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await readProfilesFromGoogleSheet(TARGET_SPREADSHEET_ID, STUDENTS_SHEET_TITLE, {
      forceRefresh: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
