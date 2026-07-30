import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportModal({ onClose, onImport, members, monthKey }) {
  const [mode, setMode] = useState('file');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function parseSheetData(workbook) {
    const sheetNames = workbook.SheetNames;
    const result = {
      members: [],
      meals: {},
      bazar: null,
      bills: null,
      cookingDuty: null,
      watering: null,
      activityLog: null,
      checkin: null
    };

    // Try Meta sheet first (from our export)
    if (sheetNames.includes('Meta')) {
      const metaSheet = workbook.Sheets['Meta'];
      const metaData = XLSX.utils.sheet_to_json(metaSheet, { header: 1 });
      for (const row of metaData) {
        if (row[0] && String(row[0]).startsWith('month-meta:')) {
          try {
            const parsed = JSON.parse(row[1]);
            result.members = parsed.members || [];
            result.meals = parsed.meals || {};
            result.bazar = parsed.bazar || null;
            result.bills = parsed.bills || null;
            result.cookingDuty = parsed.cookingDuty || null;
            result.watering = parsed.watering || null;
            result.activityLog = parsed.activityLog || null;
            result.checkin = parsed.checkin || null;
          } catch {}
          return result;
        }
      }
    }

    // Fallback: read Meal sheet (first sheet)
    const mainSheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });

    const headerRow = data.findIndex(r => String(r[0] || '').trim() === 'Name');
    if (headerRow === -1) throw new Error("Could not find 'Name' header row. Make sure cell A1 says 'Name'.");

    const members = [];
    const meals = {};
    const totalRow = data.findIndex(r => String(r[0] || '').trim() === 'Total Meal per day');
    const endRow = totalRow !== -1 ? totalRow : data.length;

    for (let i = headerRow + 1; i < endRow; i++) {
      const name = String(data[i][0] || '').trim();
      if (!name) continue;
      members.push(name);
      meals[name] = {};
      for (let d = 1; d <= 31; d++) {
        const val = data[i][d];
        if (val !== '' && val !== undefined && val !== null) {
          meals[name][d] = Number(val);
        }
      }
    }
    result.members = members;
    result.meals = meals;

    // Read Bazar sheet
    if (sheetNames.includes('Bazar')) {
      const bazarSheet = workbook.Sheets['Bazar'];
      const bazarData = XLSX.utils.sheet_to_json(bazarSheet, { header: 1 });
      const bazar = {};
      for (let i = 1; i < bazarData.length; i++) {
        const row = bazarData[i];
        if (!row || !row[0]) continue;
        const member = String(row[0]).trim();
        const entry = { date: row[1] || '', item: row[2] || 'Bazar', amount: Number(row[3] || 0) };
        if (!bazar[member]) bazar[member] = [];
        bazar[member].push(entry);
      }
      if (Object.keys(bazar).length) result.bazar = bazar;
    }

    // Read Activity sheet
    if (sheetNames.includes('Activity')) {
      const actSheet = workbook.Sheets['Activity'];
      const actData = XLSX.utils.sheet_to_json(actSheet, { header: 1 });
      const activityLog = [];
      for (let i = 1; i < actData.length; i++) {
        const row = actData[i];
        if (!row || !row[0]) continue;
        activityLog.push({ date: row[0], user: row[1] || row[2] || '', text: row[2] || '', amount: Number(row[3] || 0), email: row[4] || '' });
      }
      if (activityLog.length) result.activityLog = activityLog;
    }

    return result;
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const parsed = parseSheetData(wb);
      onImport(parsed);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleLinkImport() {
    setLoading(true);
    setError('');
    try {
      let url = link.trim();

      // Google Sheet sharing link → export URL
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        url = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download file. Make sure the link is public.');
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf);
      const parsed = parseSheetData(wb);
      onImport(parsed);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Import Data</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={'btn small' + (mode === 'file' ? '' : ' secondary')} onClick={() => setMode('file')}>Upload File</button>
          <button className={'btn small' + (mode === 'link' ? '' : ' secondary')} onClick={() => setMode('link')}>Sheet Link</button>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 10 }}>{error}</div>}

        {mode === 'file' ? (
          <div>
            <p style={{ fontSize: '.82rem', color: 'var(--text-soft)', marginBottom: 10 }}>
              Upload an .xlsx file exported from Google Sheets.
            </p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={loading} />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '.82rem', color: 'var(--text-soft)', marginBottom: 10 }}>
              Paste a Google Sheet link or direct .xlsx URL.
            </p>
            <input type="text" className="excel-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={link} onChange={e => setLink(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn small" onClick={handleLinkImport} disabled={loading || !link}>
              {loading ? 'Downloading...' : 'Import'}
            </button>
          </div>
        )}

        {loading && <div className="spinner" style={{ margin: '12px auto' }} />}
      </div>
    </div>
  );
}
