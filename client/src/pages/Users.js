import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../firebase/helpers';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAllUsers();
        if (active) setUsers(data || []);
      } catch (err) {
        if (active) setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  if (loading) return <div>Loading users…</div>;
  if (error) return <div>Error loading users: {error}</div>;

  return (
    <div className="users-page">
      <h2>Users</h2>
      {users.length === 0 ? (
        <div>No users found.</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
