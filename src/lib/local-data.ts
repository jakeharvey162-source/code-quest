let owner = "";
export function setDataOwner(userId: string | null) {
  owner = userId || "";
}
export function dataKey(key: string) {
  return owner ? `${key}:${owner}` : key;
}
export function removeText(key: string) {
  try {
    localStorage.removeItem(dataKey(key));
    return true;
  } catch {
    return false;
  }
}
export function readText(key: string, fallback = "") {
  try {
    return localStorage.getItem(dataKey(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeText(key: string, value: string) {
  try {
    localStorage.setItem(dataKey(key), value);
    return true;
  } catch {
    return false;
  }
}
export const registrationBrief = {
  id: "student-registration",
  title: "Student Registration Form",
  controls: ["TextBox", "Button"],
  requirements: [
    "Meaningful names",
    "Exactly 8 digits",
    "Click event",
    "MessageBox feedback",
  ],
};
export function readBrief() {
  try {
    const value = JSON.parse(readText("cq-practical-brief", "null"));
    return value?.id === registrationBrief.id ? registrationBrief : null;
  } catch {
    return null;
  }
}
