"use client";

import { useState } from "react";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AutomatonControls } from "@/components/automaton-controls";
import { QuantumAutomatonView } from "@/components/quantum-automaton-view";

export type InitPattern = "random" | "dots";
export type FrameDisplayMode = "all" | "even" | "odd";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // 1-100 scale
  const [transparency, setTransparency] = useState(30); // 0-100 scale
  const [gridSize, setGridSize] = useState(10); // 5-60 scale
  const [initPattern, setInitPattern] = useState<InitPattern>("random");
  const [resetToken, setResetToken] = useState(0);
  const [frameDisplayMode, setFrameDisplayMode] = useState<FrameDisplayMode>("all");

  return (
    <main className="h-screen w-screen">
      <SidebarProvider>
        <Sidebar className="flex flex-col" variant="sidebar" collapsible="icon">
          <AutomatonControls
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning(!isRunning)}
            speed={speed}
            onSpeedChange={setSpeed}
            transparency={transparency}
            onTransparencyChange={setTransparency}
            gridSize={gridSize}
            onGridSizeChange={(newSize) => {
              if (newSize !== gridSize) {
                setGridSize(newSize);
                setResetToken(t => t + 1);
              }
            }}
            frameDisplayMode={frameDisplayMode}
            onFrameDisplayModeChange={setFrameDisplayMode}
            initPattern={initPattern}
            onInitPatternChange={(pattern) => {
              setInitPattern(pattern);
              setResetToken(t => t + 1);
            }}
            onReset={() => {
              setIsRunning(false);
              setResetToken(t => t + 1);
            }}
          />
        </Sidebar>
        <SidebarInset>
          <QuantumAutomatonView
            isRunning={isRunning}
            speed={speed}
            transparency={transparency}
            gridSize={gridSize}
            initPattern={initPattern}
            resetToken={resetToken}
            frameDisplayMode={frameDisplayMode}
          />
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
