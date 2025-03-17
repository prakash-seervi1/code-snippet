"use client";
import React, { useState } from "react";
import CodeEditor from "./components/CodeEditor";
import "./globals.css";

export default function Home() {
  const [code, setCode] = useState("// Type your code here...");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  return (
    <main className="items-center justify-center bg-gray-100" id="topparnetDiv">
      <CodeEditor code={code} setCode={setCode} theme={theme} />
    </main>
  );
}
