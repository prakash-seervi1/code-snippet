import { useState, useEffect, useRef } from "react";
import { Video, Camera, Zap, Play, Pause, Mic, MicOff } from "lucide-react"; // Added Sliders for Speed Control
import html2canvas from "html2canvas";
import Tippy from "@tippyjs/react";
import { borderTopLeftRadius } from "html2canvas/dist/types/css/property-descriptors/border-radius";

export default function ButtonContoler({
  language,
  setLanguage,
  isPlaying,
  mainTextRef,
  setIsPlaying,
  setInstantPrint,
  instantPrint,
  typingSpeed,
  setTypingSpeed,
  isStopRecording,
  setIsSpeak,
  isSpeak,
}) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const captureScreenshot = async () => {
    if (mainTextRef.current) {
      const canvas = await html2canvas(mainTextRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "screenshot.png";
      link.click();
    }
  };

  useEffect(() => {
    if (isStopRecording) {
      stopRecording();
    }
  }, [isStopRecording]);

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      videoStream?.getTracks().forEach((track) => track.stop());
      setMediaRecorder(null);
      setVideoStream(null);
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setVideoStream(stream);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recording.webm";
      link.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  };

  const startPrinting = () => {
    // setDisplayText(""); // Clear previous text
    // setTypingIndex(0);
    setIsPlaying(!isPlaying); // Start animation
  };

  const startSpeak = () => {
    // setDisplayText(""); // Clear previous text
    // setTypingIndex(0);
    setIsSpeak(!isSpeak); // Start animation
  };

  return (
    <div className="flex items-center gap-2 p-4">
      {/* Language Selection */}
      <select
        className="bg-[#1e1e1e] text-white p-2 px-4 rounded-md border border-gray-700 flex-1"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
        <option value="typescript">TypeScript</option>
        <option value="swift">Swift</option>
        <option value="kotlin">Kotlin</option>
      </select>

      <Tippy content="Toggle Typing Mode">
        <button
          onClick={() => startSpeak()}
          className="bg-[#1e1e1e] w-10 h-10 rounded-md border border-gray-700 flex items-center justify-center"
        >
          {!isSpeak ? (
            <Mic className="w-5 h-5 text-green-400" />
          ) : (
            <MicOff className="w-5 h-5 text-green-400" />
          )}
        </button>
      </Tippy>

      {/* Play Button */}
      <Tippy content="Start Printing">
        <button
          onClick={startPrinting}
          className="fixed bottom-20 right-8 bg-blue-500 text-green p-4 rounded-full shadow-lg hover:bg-blue-600 transition"
        >
          {!isPlaying ? (
            <Play className="w-5 h-5 text-green-400" />
          ) : (
            <Pause className="w-5 h-5 text-green-400" />
          )}
        </button>
      </Tippy>

      {/* Capture Screenshot */}
      <Tippy content="Capture Screenshot">
        <button
          onClick={captureScreenshot}
          className="bg-[#1e1e1e] w-10 h-10 rounded-md border border-gray-700 flex items-center justify-center"
        >
          <Camera className="w-5 h-5 text-gray-400" />
        </button>
      </Tippy>

      {/* Start/Stop Recording */}
      <Tippy content={isRecording ? "Stop Recording" : "Start Recording"}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="bg-[#1e1e1e] w-10 h-10 rounded-md border border-gray-700 flex items-center justify-center"
        >
          <Video
            className={`w-5 h-5 ${
              isRecording ? "text-red-400" : "text-gray-400"
            }`}
          />
        </button>
      </Tippy>

      {/* Toggle Typing Speed / Instant Print */}
      <Tippy content="Toggle Typing Mode">
        <button
          onClick={() => setInstantPrint(!instantPrint)}
          className="bg-[#1e1e1e] w-10 h-10 rounded-md border border-gray-700 flex items-center justify-center"
        >
          <Zap
            className={`w-5 h-5 ${
              instantPrint ? "text-green-400" : "text-gray-400"
            }`}
          />
        </button>
      </Tippy>

      {/* Typing Speed Control (Only when Instant Print is OFF) */}
      {!instantPrint && (
        <Tippy content="Adjust Typing Speed">
          <input
            type="range"
            min="10"
            max="200"
            value={typingSpeed}
            onChange={(e) => setTypingSpeed(Number(e.target.value))}
            className="cursor-pointer w-24 h-2 bg-gray-700 rounded-lg"
          />
        </Tippy>
      )}

      {recordedChunks.length > 0 && (
        <button
          onClick={downloadRecording}
          className="bg-green-500 text-white p-2 rounded-md"
        >
          Download Video
        </button>
      )}
    </div>
  );
}
