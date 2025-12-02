/**
 * Shloks Page
 * 
 * Manage shloks with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import './Shloks.css';
import { getAllShloks, createOrUpdateShlok, deleteShlok } from '../firebase/helpers';

function Shloks() {
  const [shloks, setShloks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedShlok, setSelectedShlok] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchShloks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShloks = async () => {
    try {
      setLoading(true);
      const data = await getAllShloks();
      setShloks(data || []);
    } catch (err) {
      setError('Failed to fetch shloks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shlok?')) return;
    try {
      await deleteShlok(id);
      fetchShloks();
    } catch (err) {
      alert('Failed to delete shlok');
      console.error(err);
    }
  };

  const handleEdit = (shlok) => {
    setSelectedShlok({ ...shlok });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { id, ...data } = selectedShlok;
      await createOrUpdateShlok(id, data);
      setIsEditing(false);
      setSelectedShlok(null);
      fetchShloks();
    } catch (err) {
      alert('Failed to update shlok');
      console.error(err);
    }
  };

  return (
    <div className="shloks-page">
      <div className="page-header">
        <h1 className="page-title">Shloks Management</h1>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search shloks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>Shlok #</th>
                  <th>Speaker</th>
                  <th>Theme</th>
                  <th>Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shloks
                  .filter(s => !search || JSON.stringify(s).toLowerCase().includes(search.toLowerCase()))
                  .map((shlok) => (
                    <tr key={shlok.id}>
                      <td>{shlok.chapterName}</td>
                      <td>{shlok.shlok}</td>
                      <td>{shlok.speaker}</td>
                      <td>{shlok.theme}</td>
                      <td className="summary-cell">{(shlok.summary || '').substring(0, 100)}...</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(shlok)}
                            title="Edit shlok"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(shlok.id)}
                            title="Delete shlok"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditing && selectedShlok && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Shlok</h2>
              <button
                className="modal-close"
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Chapter Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedShlok.chapterName || ''}
                  onChange={(e) => setSelectedShlok({ ...selectedShlok, chapterName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shlok Number</label>
                <input
                  type="number"
                  className="form-input"
                  value={selectedShlok.shlok || ''}
                  onChange={(e) => setSelectedShlok({ ...selectedShlok, shlok: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Speaker</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedShlok.speaker || ''}
                  onChange={(e) => setSelectedShlok({ ...selectedShlok, speaker: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Theme</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedShlok.theme || ''}
                  onChange={(e) => setSelectedShlok({ ...selectedShlok, theme: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Summary</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={selectedShlok.summary || ''}
                  onChange={(e) => setSelectedShlok({ ...selectedShlok, summary: e.target.value })}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shloks;
