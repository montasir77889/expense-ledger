import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportModal({ onClose, onImport, members, monthKey }) {
  const [mode, setMode] = useState('file');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function parseSheetData(workbook) {
    const sheetNames = workbook.SheetNames;
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

    const result = {
      members,
      meals,
      bazar: {},
      bills: { houseRent: {}, serviceCharge: 0, utilities: [] },
      cookingDuty: {},
      watering: {},
      activityLog: [],
      checkin: {}
    };

    // Try to read meta from additional sheets
    if (sheetNames.length > 1) {
      const metaSheet = workbook.Sheets[sheetNames[1]];
      const metaData = XLSX.utils.sheet_to_json(metaSheet, { header: 1 });
      let currentKey = '';
      metaData.forEach(row => {
        if (row[0] && String(row[0]).startsWith('month-meta:')) {
          try {
            const parsed = JSON.parse(row[1]);
            if (parsed.bazar) result.bazar = parsed.bazar;
            if (parsed.bills) result.bills = parsed.bills;
            if (parsed.cookingDuty) result.cookingDuty = parsed.cookingDuty;
            if (parsed.watering) result.watering = parsed.watering;
            if (parsed.activityLog) result.activityLog = parsed.activityLog;
          } catch {}
        }
      });
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
