import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Mood } from "../types/checkIn";

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
