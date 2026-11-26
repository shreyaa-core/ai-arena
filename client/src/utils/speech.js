/**
 * Browser Speech Synthesis narration & optional microphone recording helpers.
 * Always optional with full text alternatives.
 */

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakText(text, lang = "en-US") {
  if (!isSpeechSynthesisSupported() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "bn" ? "bn-BD" : lang === "hi" ? "hi-IN" : "en-US";
    utter.rate = 1.02;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore errors.
  }
}
