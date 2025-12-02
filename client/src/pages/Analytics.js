/**
 * Analytics Page
 * 
 * Detailed analytics with charts
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Analytics.css';
import { getAllShloks, getAllUsers } from '../firebase/helpers';

function Analytics() {
  const [popularShloks, setPopularShloks] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [bookmarksByTheme, setBookmarksByTheme] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [shloks, users] = await Promise.all([getAllShloks(), getAllUsers()]);

      // Simple user growth: group by createdAt date (day)
      const growthMap = {};
      users.forEach(u => {
        const d = u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : 'unknown';
        growthMap[d] = growthMap[d] || { date: d, totalUsers: 0, newUsers: 0 };
        growthMap[d].newUsers += 1;
      });
      const sortedGrowth = Object.values(growthMap).slice(0, 30);
      setUserGrowth(sortedGrowth);

      // Bookmarks by theme / popular shloks: use bookmarks field if present
      const themes = {};
      const ranked = shloks.map(s => ({
        id: s.id,
        chapterName: s.chapterName,
        shlokNum: s.shlok,
        theme: s.theme,
        summary: s.summary,
        bookmarkCount: s.bookmarkCount || 0,
      }));

      ranked.sort((a, b) => (b.bookmarkCount || 0) - (a.bookmarkCount || 0));
      setPopularShloks(ranked.slice(0, 20));

      ranked.forEach(r => {
        if (!r.theme) return;
        themes[r.theme] = (themes[r.theme] || 0) + (r.bookmarkCount || 0);
      });

      setBookmarksByTheme(Object.entries(themes).map(([theme, count]) => ({ theme, count })));
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <h1 className="page-title">Analytics & Insights</h1>

      {/* User Growth Chart */}
      {userGrowth.length > 0 && (
        <div className="card chart-card mb-20">
          <h3 className="chart-title">User Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalUsers" stroke="#0D1B3E" name="Total Users" />
              <Line type="monotone" dataKey="newUsers" stroke="#D4AF37" name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bookmarks by Theme */}
      {bookmarksByTheme.length > 0 && (
        <div className="card chart-card mb-20">
          <h3 className="chart-title">Bookmarks by Theme</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookmarksByTheme}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="theme" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#D4AF37" name="Bookmarks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Popular Shloks Table */}
      <div className="card">
        <h3 className="card-title">Most Bookmarked Shloks</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Chapter</th>
                <th>Shlok #</th>
                <th>Theme</th>
                <th>Summary</th>
                <th>Bookmarks</th>
              </tr>
            </thead>
            <tbody>
              {popularShloks.map((shlok, index) => (
                <tr key={shlok.id}>
                  <td>{index + 1}</td>
                  <td>{shlok.chapterName}</td>
                  <td>{shlok.shlokNum}</td>
                  <td>{shlok.theme}</td>
                  <td className="summary-cell">{(shlok.summary || '').substring(0, 80)}...</td>
                  <td>
                    <span className="badge badge-success">
                      {shlok.bookmarkCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
