import { ref, set, get, update, remove, onDisconnect } from "firebase/database";
import { doc, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { realtimeDb, firestoreDb } from "./firebase";
import type { DeviceSession, Student } from "../types/quiz";

const DEVICE_ID_KEY = "fsudmc_client_device_id";

/**
 * 1. Get or generate a persistent unique device ID for this client browser/device
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server_device_instance";
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate UUIDv4 or fallback random ID
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      deviceId = `dev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    } else {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * 2. Friendly Device Name detector (e.g. "Chrome on Windows", "Safari on iPhone")
 */
export function detectDeviceName(): string {
  if (typeof window === "undefined" || !navigator) return "Unknown Device";
  const ua = navigator.userAgent;

  let browser = "Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Device";
  if (ua.includes("Windows NT 10.0") || ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
}

/**
 * 3. Registers or updates an active session for the student on this device.
 * Syncs to both Realtime Database (for instant presence/state) and Firestore (persistent document).
 */
function sanitizePathKey(val: string): string {
  return String(val || "").replace(/[.#$\[\]/]/g, "_");
}

export async function registerDeviceSession(
  studentId: string
): Promise<DeviceSession> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = detectDeviceName();
  const nowMs = Date.now();
  const nowIso = new Date().toISOString();

  const safeStudentKey = sanitizePathKey(studentId);
  const safeDeviceKey = sanitizePathKey(deviceId);

  const sessionData: DeviceSession = {
    deviceId,
    deviceName,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 150) : "",
    lastActive: nowMs,
    loginAt: nowIso,
    status: "active",
    isCurrent: true,
  };

  try {
    // A. Sync to Realtime Database with automatic disconnection cleanup
    const rtdbSessionRef = ref(realtimeDb, `students/${safeStudentKey}/activeSessions/${safeDeviceKey}`);
    await set(rtdbSessionRef, {
      ...sessionData,
      lastActive: nowMs,
    });
    // Set up auto-status update on disconnect
    onDisconnect(rtdbSessionRef).update({
      lastActive: nowMs,
      status: "expired",
    }).catch(() => {});

    // B. Sync to Firestore students document under activeSessions map
    const studentDocRef = doc(firestoreDb, "students", studentId);
    await setDoc(
      studentDocRef,
      {
        activeSessions: {
          [deviceId]: sessionData,
        },
        updatedAt: nowIso,
      },
      { merge: true }
    );
  } catch (err) {
    console.debug("Notice: Device session sync offline fallback:", err);
  }

  return sessionData;
}

/**
 * 4. Logs out this specific device without affecting other concurrent devices.
 */
export async function logoutDeviceSession(studentId: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const safeStudentKey = sanitizePathKey(studentId);
  const safeDeviceKey = sanitizePathKey(deviceId);

  try {
    // A. Remove device session from Realtime Database
    const rtdbSessionRef = ref(realtimeDb, `students/${safeStudentKey}/activeSessions/${safeDeviceKey}`);
    await remove(rtdbSessionRef);

    // B. Remove device session from Firestore activeSessions map
    const studentDocRef = doc(firestoreDb, "students", studentId);
    await updateDoc(studentDocRef, {
      [`activeSessions.${deviceId}`]: deleteField(),
    });
  } catch (err) {
    console.debug("Notice: Logout device session offline fallback:", err);
  }
}

/**
 * 5. Fetch all active devices currently logged in for this student
 */
export async function fetchActiveSessions(
  studentId: string
): Promise<DeviceSession[]> {
  const currentDeviceId = getOrCreateDeviceId();
  const safeStudentKey = sanitizePathKey(studentId);
  try {
    // Try Realtime Database first for instant state
    const rtdbRef = ref(realtimeDb, `students/${safeStudentKey}/activeSessions`);
    const snap = await get(rtdbRef);
    if (snap.exists()) {
      const data = snap.val() as Record<string, DeviceSession>;
      return Object.entries(data).map(([devId, s]) => ({
        ...s,
        deviceId: devId,
        isCurrent: devId === currentDeviceId,
      }));
    }

    // Fallback to Firestore
    const studentDocRef = doc(firestoreDb, "students", studentId);
    const fsSnap = await getDoc(studentDocRef);
    if (fsSnap.exists()) {
      const studentData = fsSnap.data() as Student;
      if (studentData.activeSessions) {
        return Object.entries(studentData.activeSessions).map(([devId, s]) => ({
          ...s,
          deviceId: devId,
          isCurrent: devId === currentDeviceId,
        }));
      }
    }
  } catch (err) {
    console.debug("Notice: Fetch active sessions offline fallback:", err);
  }

  return [];
}
