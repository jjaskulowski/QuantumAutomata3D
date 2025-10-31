"use client";

import { useState } from "react";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AutomatonControls } from "@/components/automaton-controls";
import { QuantumAutomatonView } from "@/components/quantum-automaton-view";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // 1-100 scale
  const [transparency, setTransparency] = useState(30); // 0-100 scale
  const [resetToken, setResetToken] = useState(0);

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
            resetToken={resetToken}
          />
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
