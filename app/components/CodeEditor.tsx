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

  // const formatTextForLineBreaks = (text: string) => {
  //   return text.replace(/(.{60})/g, "$1\n"); // Insert newline after every 80 characters
  // };

  
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
      .replace(/\|\<@\|(.*?)\|\@>\|/gs, "```typescript\n$1\n```")
      .replace(/\|\<h1\|(.*?)\|\h1>\|/gs, "```h1\n$1\n```")
      .replace(/\|\<h2\|(.*?)\|\h2>\|/gs, "```h2\n$1\n```")
      .replace(/\|\<h3\|(.*?)\|\h3>\|/gs, "```h3\n$1\n```")
      .replace(/\|\<h4\|(.*?)\|\h4>\|/gs, "```h4\n$1\n```")
      .replace(/\|\<h5\|(.*?)\|\h5>\|/gs, "```h5\n$1\n```");  // Default to JavaScript
  };

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4"
      id="parnetDiv"
      ref={parnetDIvRef}
    >
      <textarea
        className="w-full max-w-7xl p-3 mb-4 border border-gray-700 rounded-lg bg-[#1e1e1e] text-white"
        style={{width: "700px","wordBreak": "break-word"}}
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

        <div className="p-4  w-[800px]  mx-auto  overflow-hidden break-words" ref={mainTextRef}>
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

          <div className="bg-[#282a36]  overflow-hidden break-words rounded-lg" id="SyntaxHighlighter">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p({ node, inline, className, children, ...props }) {
                  // Avoid wrapping <pre> inside <p>

                  if (children?.length === 1 && children[0]?.type === "pre") {
                    return children;
                  }
                  return (
                    <div className="break-words overflow-hidden whitespace-pre-wrap">
                    <SyntaxHighlighter
                      style={dracula}
                      language={language}
                      className="bg-gray-700 text-lg p-5 m-2 rounded-lg break-words overflow-hidden"
                    >
                      {children}
                    </SyntaxHighlighter></div>
                  );
                },
                code({ node, inline, className, children, ...props }) {
                  const match = /language-javascript/.exec(className || "");
                  const matchInline = /language-typescript/.exec(
                    className || ""
                  );
                  const matchH1 = /language-h1/.exec(
                    className || ""
                  );
                  const matchH2 = /language-h2/.exec(
                    className || ""
                  );
                  const matchH3 = /language-h3/.exec(
                    className || ""
                  );
                  const matchH4 = /language-h4/.exec(
                    className || ""
                  );
                  const matchH5 = /language-h5/.exec(
                    className || ""
                  );

                  if (!inline && match) {
                    return (
                    <div className="break-words overflow-hidden whitespace-pre-wrap">

                      <SyntaxHighlighter
                        style={dracula}
                        language={language}
                        className="innerSyntaxHighlighter bg-[#2d2d2d] text-base p-1  rounded-lg overflow-hidden break-words"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter></div>
                    );
                  } 
                  else if (!inline && matchH1) {
                    return (
                      <h1
                        className="code-font text-pink-400 font-mono overflow-hidden break-words"
                        style={{fontSize:"2em",fontWeight:"bold"}}
                        {...props}
                      >
                        {children}
                      </h1>
                    )
                  }
                  else if (!inline && matchH2) {
                    return (
                      <h2
                        className="code-font text-yellow-400 font-mono overflow-hidden break-words"
                        style={{fontSize:"1.5em",fontWeight:"bold"}}
                        {...props}
                      >
                        {children}
                      </h2>
                    )
                  }
                  else if (!inline && matchH3) {
                    return (
                      <h3
                        className="code-font text-pink-400 font-mono overflow-hidden break-words"
                        style={{fontSize:"1.3em"}}
                        {...props}
                      >
                        {children}
                      </h3>
                    )
                  }
                  else if (!inline && matchH4) {
                    return (
                      <h4
                        className="code-font text-red-400 font-mono overflow-hidden break-words"
                        style={{fontSize:"1.125em"}}
                        {...props}
                      >
                        {children}
                      </h4>
                    )
                  }
                  else if (!inline && matchH5) {
                    return (
                      <h5
                        className="code-font text-orange-400 font-mono overflow-hidden break-words"
                        style={{fontSize:"0.83em"}}
                        {...props}
                      >
                        {children}
                      </h5>
                    )
                  }
                  else if (!inline && matchInline) {
                    return (
                      <code
                        className="code-font text-pink-400 font-mono overflow-hidden break-words"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  } else {
                    return (
                      <div className="break-words overflow-hidden whitespace-pre-wrap">
                    <SyntaxHighlighter
                      style={dracula}
                      language={language}
                      className="bg-gray-700 text-base p-5 m-2 rounded-xl break-words overflow-hidden"
                    >
                      {children}
                    </SyntaxHighlighter></div>
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
