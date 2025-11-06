"use client";

import { useMemo, useState } from "react";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AutomatonControls } from "@/components/automaton-controls";
import { QuantumAutomatonView } from "@/components/quantum-automaton-view";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InitPattern = "random" | "dots";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // 1-100 scale
  const [transparency, setTransparency] = useState(30); // 0-100 scale
  const [gridSize, setGridSize] = useState(10); // 5-20 scale
  const [initPattern, setInitPattern] = useState<InitPattern>("random");
  const [resetToken, setResetToken] = useState(0);

  const totalCells = useMemo(() => gridSize ** 3, [gridSize]);
  const patternLabel = useMemo(
    () => (initPattern === "random" ? "Randomized Seeds" : "Structured Dots"),
    [initPattern]
  );
  const statusBadgeClass = isRunning
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
    : "border-amber-400/40 bg-amber-400/15 text-amber-200";

  const parameterHighlights = useMemo(
    () => [
      {
        label: "Simulation Speed",
        value: `${speed}%`,
        description: "Balances the tempo of evolving states.",
      },
      {
        label: "Cell Transparency",
        value: `${transparency}%`,
        description: "Control depth perception inside the grid.",
      },
      {
        label: "Grid Dimensions",
        value: `${gridSize} × ${gridSize} × ${gridSize}`,
        description: `${totalCells.toLocaleString()} active positions in play.`,
      },
      {
        label: "Initial Pattern",
        value: patternLabel,
        description: "Defines the narrative of the first generation.",
      },
    ],
    [gridSize, patternLabel, speed, totalCells, transparency]
  );

  return (
    <main className="relative flex min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-background/80 text-foreground">
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
                setResetToken((t) => t + 1);
              }
            }}
            initPattern={initPattern}
            onInitPatternChange={(pattern) => {
              setInitPattern(pattern);
              setResetToken((t) => t + 1);
            }}
            onReset={() => {
              setIsRunning(false);
              setResetToken((t) => t + 1);
            }}
          />
        </Sidebar>
        <SidebarInset className="bg-transparent">
          <div className="flex h-full flex-col">
            <header className="flex flex-col gap-6 border-b border-border/40 px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
              <div className="space-y-4">
                <Badge className="w-fit border-primary/40 bg-primary/15 text-primary">Immersive layout</Badge>
                <div className="space-y-3">
                  <h1 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">Sculpted Quantum Playground</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Engage with a refined workspace where controls, insights, and the spatial simulation co-exist without friction. Adjust parameters from the sidebar and watch the lattice respond instantly.
                  </p>
                </div>
              </div>
              <div className="grid w-full max-w-xs gap-3 rounded-3xl border border-border/60 bg-background/60 p-5 text-sm shadow-sm backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={cn("px-3", statusBadgeClass)}>
                    {isRunning ? "Running" : "Paused"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Grid size</span>
                  <span className="font-medium">{gridSize}³ cells</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-medium">{speed}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transparency</span>
                  <span className="font-medium">{transparency}%</span>
                </div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6 lg:p-10">
              <div className="grid flex-1 min-h-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
                <section className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-xl ring-1 ring-black/5 backdrop-blur-sm">
                  <div className="flex flex-col gap-2 border-b border-border/60 px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Simulation Space</h2>
                      <p className="text-sm text-muted-foreground">Navigate the evolving grid with fluid orbit controls and balanced breathing room.</p>
                    </div>
                    <Badge variant="secondary" className="w-fit bg-secondary/60 text-secondary-foreground">
                      {patternLabel}
                    </Badge>
                  </div>
                  <div className="relative flex min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
                    <QuantumAutomatonView
                      isRunning={isRunning}
                      speed={speed}
                      transparency={transparency}
                      gridSize={gridSize}
                      initPattern={initPattern}
                      resetToken={resetToken}
                      className="h-full w-full rounded-3xl border border-border/40 bg-background/40 shadow-inner"
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
                  </div>
                </section>
                <section className="flex min-h-0 flex-col gap-6">
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-6 shadow-sm backdrop-blur">
                    <h2 className="text-lg font-semibold">Experience Overview</h2>
                    <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
                      {parameterHighlights.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <dt className="text-xs uppercase tracking-widest text-muted-foreground/80">{item.label}</dt>
                          <dd className="text-base font-semibold text-foreground">{item.value}</dd>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background/70 to-accent/10 p-6 shadow-sm backdrop-blur">
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold">Design Principles</h2>
                      <p className="text-sm text-muted-foreground">
                        The workspace is composed to keep context and action within reach. Every panel holds its ground without intruding on the simulation canvas.
                      </p>
                    </div>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">Consistent rhythm</p>
                          <p>Measured spacing around controls and cards prevents visual drift.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">Dedicated control lane</p>
                          <p>The sidebar scrolls independently, keeping primary focus on the 3D viewport.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">Responsive hierarchy</p>
                          <p>Cards compress gracefully so information never overlaps or escapes the frame.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
