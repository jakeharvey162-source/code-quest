import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, Square } from "lucide-react";
import { speakText, commandFor, voiceError, voiceCommands } from "../lib/voice";
import type { Settings } from "../lib/progress";
import { supabase } from "../lib/supabase";
import { tutorVoices } from "../lib/voice-catalog.mjs";
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}
export function VoiceControls({
  settings,
  text,
  onNavigate,
  language = "en-ZA",
}: {
  settings: Settings;
  text: string;
  onNavigate?: (page: string) => void;
  language?: string;
}) {
  const commands = voiceCommands[settings.language] || voiceCommands["en-ZA"];
  const examples = `${commands.learn} · ${commands.designer} · ${commands.settings} · ${commands.stop}`;
  const [status, setStatus] = useState(""),
    [listening, setListening] = useState(false);
  const recognition = useRef<any>(null);
  const audio = useRef<HTMLAudioElement | null>(null),
    request = useRef<AbortController | null>(null),
    audioUrl = useRef("");
  function stopCloud() {
    request.current?.abort();
    request.current = null;
    audio.current?.pause();
    audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = "";
  }
  async function read() {
    stopCloud();
    window.speechSynthesis?.cancel();
    if (settings.voiceProvider !== "elevenlabs") {
      speakText(text, settings.voice, settings.rate, setStatus, language);
      return;
    }
    if (!tutorVoices[language as keyof typeof tutorVoices]?.voiceId) {
      setStatus(
        "No verified ElevenLabs voice is configured for this language. Choose Device voices in Settings.",
      );
      return;
    }
    if (!supabase) {
      setStatus(
        "Cloud voices are not configured on this deployment. Choose Device voices in Settings; no account is needed for device reading.",
      );
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    try {
      setStatus("Preparing ElevenLabs read-aloud…");
      const session = (await supabase.auth.getSession()).data.session;
      if (controller.signal.aborted) return;
      if (!session)
        throw new Error(
          "Sign in to use cloud voices, or choose Device voices in Settings.",
        );
      const result = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: text.slice(0, 800), language }),
        signal: controller.signal,
      });
      if (!result.ok) {
        const error = await result.json().catch(() => ({}));
        throw new Error(
          error.error ||
            "Cloud voice is unavailable. Choose Device voices in Settings.",
        );
      }
      if (!result.headers.get("content-type")?.startsWith("audio/"))
        throw new Error(
          "Cloud voice is not configured on this deployment. Choose Device voices in Settings.",
        );
      const blob = await result.blob();
      if (controller.signal.aborted) return;
      audioUrl.current = URL.createObjectURL(blob);
      const player = new Audio(audioUrl.current);
      audio.current = player;
      player.playbackRate = settings.rate;
      player.onended = () => {
        if (audio.current !== player) return;
        stopCloud();
        setStatus("Finished reading.");
      };
      player.onerror = () => {
        if (audio.current !== player) return;
        stopCloud();
        setStatus("Audio could not play. Try a device voice.");
      };
      await player.play();
      if (!controller.signal.aborted)
        setStatus(
          text.length > 800
            ? "Speaking the first 800 characters. Cloud reading is capped to protect the free allowance."
            : "Speaking…",
        );
    } catch (error) {
      if (!controller.signal.aborted) {
        stopCloud();
        setStatus(
          error instanceof Error
            ? error.message
            : "Cloud voice could not play.",
        );
      }
    }
  }
  useEffect(
    () => () => {
      recognition.current?.abort();
      stopCloud();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );
  function listen() {
    stopCloud();
    const browser = window as any;
    const Recognition =
      browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus(
        "Voice commands are unavailable in this browser. Use the navigation buttons.",
      );
      return;
    }
    if (!settings.voiceInput) {
      setStatus(
        "Enable voice commands in Settings first. Your browser may send microphone audio to its recognition service.",
      );
      return;
    }
    if (listening) {
      recognition.current?.abort();
      return;
    }
    const r = new Recognition();
    recognition.current = r;
    r.lang = settings.language || "en-ZA";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => {
      setListening(true);
      setStatus(`Listening. Commands: ${examples}`);
    };
    r.onend = () => setListening(false);
    r.onerror = (e: any) => {
      setStatus(voiceError(e.error));
      setListening(false);
    };
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      const command = commandFor(transcript);
      if (command === "stop") {
        stopCloud();
        window.speechSynthesis?.cancel();
        setStatus("Reading stopped.");
      } else if (command) {
        onNavigate?.(command);
        setStatus(`Heard: ${transcript}`);
      } else setStatus(`Heard “${transcript}”. Commands: ${examples}.`);
    };
    try {
      r.start();
    } catch {
      setStatus("Voice input is already active or could not start. Try again.");
    }
  }
  return (
    <div className="voice-controls">
      <div className="button-row">
        <button onClick={read}>
          <Volume2 size={16} /> Read aloud
        </button>
        <button
          onClick={() => {
            window.speechSynthesis?.cancel();
            stopCloud();
            recognition.current?.abort();
            setListening(false);
            setStatus("Voice stopped.");
          }}
          aria-label="Stop voice"
        >
          <Square size={14} />
        </button>
        {onNavigate && (
          <button aria-pressed={listening} onClick={listen}>
            <Mic size={16} />
            {listening ? "Stop listening" : "Voice command"}
          </button>
        )}
      </div>
      {onNavigate && settings.voiceInput && (
        <span className="muted voice-help">Commands: {examples}</span>
      )}
      <span role="status" className="muted voice-status">
        {status}
      </span>
      {settings.voiceProvider === "elevenlabs" && (
        <a
          className="muted"
          href="https://elevenlabs.io"
          target="_blank"
          rel="noreferrer"
        >
          Voice service: elevenlabs.io
        </a>
      )}
    </div>
  );
}
