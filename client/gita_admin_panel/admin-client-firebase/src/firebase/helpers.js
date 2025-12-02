import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const fetchCollection = async (collectionName) => {
  const ref = collection(db, collectionName);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
