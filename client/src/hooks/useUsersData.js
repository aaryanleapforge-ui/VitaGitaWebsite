import { useEffect, useState } from 'react';
import { getAllUsers } from '../firebase/helpers';

export default function useUsersData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const u = await getAllUsers();
      if (!mounted) return;
      setUsers(u);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { users, loading };
}
