"use client";

import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import "tippy.js/dist/tippy.css";
import ButtonContoler from "./button";
import { useSpeechSynthesis } from "react-speech-kit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CodeEditor() {
  const [language, setLanguage] = useState("javascript");
  const [inputText, setInputText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(0); // Typing Speed Control
  const [instantPrint, setInstantPrint] = useState(false);
  const [isStopRecording, setIsStopRecording] = useState(false);
  const { cancel } = useSpeechSynthesis();
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // NEW: Play Button State
  const mainTextRef = useRef<HTMLDivElement>(null);
  const parnetDIvRef = useRef<HTMLDivElement>(null);
  const lastSpokenIndex = useRef(0); // Track where speech last stopped
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [isSpeak, setIsSpeak] = useState(false);
  const removeEmojis = (text: string): string => {
    return text.replace(
      /([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
      ""
    );
  };

  useEffect(() => {
    if (synth) {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]); // Set default voice
      }
    }
  }, [synth]);

  useEffect(() => {
    if (!isPlaying) {
      cancel(); // Stop speech when new text is entered

      return;
    } // Only start printing when Play is clicked

    if (instantPrint) {
      // If Instant Print is enabled, show full text instantly
      setDisplayText(inputText);
      setTypingIndex(inputText.length);

      // speakText(inputText); // Speak full text instantly
      return;
    }

    if (typingIndex < inputText.length) {
      const timeout = setTimeout(() => {
        // const nextChar = inputText[typingIndex];
        setDisplayText((prev) => prev + inputText[typingIndex]);
        setTypingIndex((prev) => prev + 1);
        // speakText(nextChar); // Speak character by character
        scrollToBottom();
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else {
      setIsStopRecording(true);
    }
  }, [typingIndex, inputText, typingSpeed, instantPrint, isPlaying]);

  // Auto-scroll Fix
  useEffect(() => {
    if (mainTextRef.current) {
      requestAnimationFrame(() => {
        mainTextRef.current.scrollTop = mainTextRef?.current?.scrollHeight;
      });
    }
  }, [displayText]);

  useEffect(() => {
    if (displayText.length > lastSpokenIndex.current) {
      const newText = displayText.slice(lastSpokenIndex.current);
      if (newText.endsWith("\n")) {
        const cleanedText = removeEmojis(newText.trim()); // Remove emojis
        if (isSpeak) speakText(cleanedText);
        lastSpokenIndex.current = displayText.length;
      }
    }
  }, [displayText, isSpeak]);

  const speakText = (text: string) => {
    if (synth && text.trim()) {
      const utterance = new SpeechSynthesisUtterance(removeEmojis(text));
      // utterance.rate = 1.8; // 🔥 Faster speech without unnatural gaps
      // utterance.pitch = 1.2; // 🚀 Slightly higher pitch for clarity
      if (selectedVoice) utterance.voice = selectedVoice;
      synth.speak(utterance);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setDisplayText("");
    setTypingIndex(0);
    setIsPlaying(false); // Reset Play state when input changes
    cancel(); // Stop speech when new text is entered
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth", // Smooth scrolling effect
      });
    });
  };

  const preprocessText = (text: string) => {
    return text
      .replace(/\|\<#\|(.*?)\|\#\>\|/gs, "```javascript\n$1\n```")
      .replace(/\|\<@\|(.*?)\|\@>\|/gs, "```typescript\n$1\n```"); // Default to JavaScript
  };

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4"
      id="parnetDiv"
      ref={parnetDIvRef}
    >
      <textarea
        className="w-full max-w-7xl p-3 mb-4 border border-gray-700 rounded-lg bg-[#1e1e1e] text-white"
        placeholder="Paste your text here..."
        value={inputText}
        onChange={handleTextChange}
      />

      <select
        className="mb-4 p-2 border border-gray-700 bg-[#1e1e1e] text-white rounded-lg"
        onChange={(e) => {
          const voice = voices.find((v) => v.name === e.target.value);
          setSelectedVoice(voice || null);
        }}
      >
        {voices.map((voice, index) => (
          <option key={index} value={voice.name}>
            {voice.name}
          </option>
        ))}
      </select>

      <div className="w-full max-w-7xl border border-gray-700 rounded-lg overflow-hidden">
        <ButtonContoler
          language={language}
          setLanguage={setLanguage}
          isPlaying={isPlaying}
          mainTextRef={mainTextRef}
          setIsPlaying={setIsPlaying}
          setInstantPrint={setInstantPrint}
          instantPrint={instantPrint}
          typingSpeed={typingSpeed}
          setTypingSpeed={setTypingSpeed}
          isStopRecording={isStopRecording}
          setIsSpeak={setIsSpeak}
          isSpeak={isSpeak}
        />

        <div className="p-4" ref={mainTextRef}>
          <div
            className="bg-[#2d2d2d] rounded-lg shadow-lg relative p-4 text-white font-mono overflow-auto"
            style={{ borderRadius: "0.3em 0.3em 0 0 !important" }}
          >
            <div className="absolute top-3 left-3 bottom-3 flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
          </div>
          {/* {renderContent(displayText)} */}

          <div className="bg-[#282a36] rounded-lg" id="SyntaxHighlighter">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p({ node, inline, className, children, ...props }) {
                  // Avoid wrapping <pre> inside <p>

                  if (children?.length === 1 && children[0]?.type === "pre") {
                    return children;
                  }
                  return (
                    <SyntaxHighlighter
                      style={dracula}
                      language={language}
                      className="bg-gray-700 text-sm p-5 m-2 rounded-lg"
                    >
                      {children}
                    </SyntaxHighlighter>
                  );
                },
                code({ node, inline, className, children, ...props }) {
                  const match = /language-javascript/.exec(className || "");
                  const matchInline = /language-typescript/.exec(
                    className || ""
                  );

                  if (!inline && match) {
                    return (
                      <SyntaxHighlighter
                        style={dracula}
                        language={language}
                        className="innerSyntaxHighlighter bg-[#2d2d2d] text-sm p-1  rounded-lg"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  } else if (!inline && matchInline) {
                    return (
                      <code
                        className="code-font text-pink-400 font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  } else {
                    return (
                      <SyntaxHighlighter
                        style={dracula}
                        language={language}
                        className="bg-gray-700 text-sm p-5 m-2 rounded-lg"
                      >
                        {children}
                      </SyntaxHighlighter>
                    );
                  }
                },
              }}
            >
              {preprocessText(displayText)}
            </ReactMarkdown>
          </div>
          {/* <SyntaxHighlighter
            language={"python"}
            style={dracula}
            className="bg-[#2d2d2d] text-sm p-5 m-2 rounded-lg"
            id="SyntaxHighlighter"
          >
          {displayText}
          </SyntaxHighlighter> */}
        </div>
      </div>
    </div>
  );
}
