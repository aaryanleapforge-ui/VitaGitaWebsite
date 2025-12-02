/**
 * Videos Page
 * 
 * Manage video links
 */

import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import './Videos.css';
import { getDocs, collection } from 'firebase/firestore';
import { uploadVideoFile, createVideoDoc } from '../firebase/helpers';
import { db } from '../firebase';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ key: '', url: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'videos'));
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Failed to fetch videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      let url = formData.url;
      if (file) {
        const storagePath = `videos/${formData.key || Date.now()}_${file.name}`;
        url = await uploadVideoFile(file, storagePath);
      }
      await createVideoDoc(formData.key || String(Date.now()), { key: formData.key, url });
      setIsAdding(false);
      setFormData({ key: '', url: '' });
      setFile(null);
      fetchVideos();
    } catch (err) {
      alert('Failed to add video');
      console.error(err);
    }
  };

  return (
    <div className="videos-page">
      <div className="page-header">
        <h1 className="page-title">Video Links Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAdding(true)}
        >
          <FiPlus /> Add Video Link
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Video Key</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td>{video.key || video.id}</td>
                  <td className="url-cell">{video.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Video Link / Upload</h2>
              <button
                className="modal-close"
                onClick={() => setIsAdding(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Video Key</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="optional key"
                />
              </div>

              <div className="form-group">
                <label className="form-label">File Upload (optional)</label>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              </div>

              <div className="form-group">
                <label className="form-label">Or External URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Videos;
