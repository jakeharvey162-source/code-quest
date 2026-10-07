export function readText(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeText(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
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
