import { useEffect, useState } from 'react';
import { getCounts, getAllUsers } from '../firebase/helpers';

export default function useDashboardData() {
  const [stats, setStats] = useState({ users: 0, shloks: 0, bookmarks: 0, themes: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const counts = await getCounts();
      const users = await getAllUsers();
      const recent = users.slice(0, 6);
      if (!mounted) return;
      setStats({ users: counts.totalUsers, shloks: counts.totalShloks, bookmarks: counts.totalVideos || 0, themes: 0, recent });
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { stats, loading };
}
