import { useEffect, useState } from 'react';
import { getUserById, getUserBookmarks, getBookmarkCountForUser } from '../firebase/helpers';

export default function useUserDetails(uid) {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      const [u, b, bc] = await Promise.all([
        getUserById(uid),
        getUserBookmarks(uid),
        getBookmarkCountForUser(uid),
      ]);
      if (!mounted) return;
      setUser(u);
      setBookmarks(b);
      setBookmarkCount(bc);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [uid]);

  return { user, bookmarks, bookmarkCount, loading };
}
