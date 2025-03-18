"use client";
import React from "react";
import CodeEditor from "./components/CodeEditor";
import "./globals.css";

export default function Home() {
  return (
    <main className="items-center justify-center bg-gray-100" id="topparnetDiv">
      <CodeEditor  />
    </main>
  );
}
