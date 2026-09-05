import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CheckIn, Mood } from "../types/checkIn";

/**
 * Saves one check-in under users/{userId}/checkIns. Returns false (and
 * logs) on missing config or a write failure — caller decides how to react
 * (the mood still updates the buddy locally either way).
 */
export async function saveCheckIn(
  userId: string,
  mood: Mood,
  note: string,
): Promise<boolean> {
  if (!db) {
    console.warn("[saveCheckIn] Firestore not configured — skipping save");
    return false;
  }

  try {
    await addDoc(collection(db, "users", userId, "checkIns"), {
      mood,
      note,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("[saveCheckIn] failed to save check-in:", err);
    return false;
  }
}

/**
 * Fetches this user's check-ins from the last `days` days, newest first.
 * Returns an empty array on missing config or a read failure — the Weekly
 * Recap still works with just current tasks in that case.
 */
export async function getRecentCheckIns(
  userId: string,
  days: number,
): Promise<CheckIn[]> {
  if (!db) return [];

  try {
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    );
    const checkInsQuery = query(
      collection(db, "users", userId, "checkIns"),
      where("createdAt", ">=", cutoff),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(checkInsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        mood: data.mood as Mood,
        note: (data.note as string) ?? "",
        createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[getRecentCheckIns] failed to fetch check-ins:", err);
    return [];
  }
}
