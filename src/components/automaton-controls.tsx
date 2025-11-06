"use client";

import { Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InitPattern } from "@/app/page";

type AutomatonControlsProps = {
  isRunning: boolean;
  onToggleRunning: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  transparency: number;
  onTransparencyChange: (value: number) => void;
  gridSize: number;
  onGridSizeChange: (value: number) => void;
  initPattern: InitPattern;
  onInitPatternChange: (value: InitPattern) => void;
  onReset: () => void;
};

export function AutomatonControls({
  isRunning,
  onToggleRunning,
  speed,
  onSpeedChange,
  transparency,
  onTransparencyChange,
  gridSize,
  onGridSizeChange,
  initPattern,
  onInitPatternChange,
  onReset,
}: AutomatonControlsProps) {
  return (
    <>
      <SidebarHeader className="gap-3 pb-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="space-y-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.3em] text-sidebar-foreground/60">Control Hub</p>
            <h1 className="font-headline text-2xl font-semibold leading-tight">Quantum Automata</h1>
          </div>
          <SidebarTrigger className="md:hidden" />
        </div>
        <p className="text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Fine-tune the simulation parameters and reset experiments effortlessly.
        </p>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="flex-1 overflow-hidden pb-0">
        <ScrollArea className="h-full px-2">
          <div className="space-y-6 pb-6">
            <SidebarGroup className="rounded-2xl bg-sidebar-accent/40 p-3">
              <SidebarGroupLabel className="px-1 text-xs uppercase tracking-wide text-sidebar-foreground/60">
                Simulation
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-6 pt-1 group-data-[collapsible=icon]:hidden">
                <div className="space-y-3">
                  <Label htmlFor="speed">Simulation Speed</Label>
                  <Slider
                    id="speed"
                    value={[speed]}
                    onValueChange={(v) => onSpeedChange(v[0])}
                    max={100}
                    min={1}
                    step={1}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="transparency">Cell Opacity</Label>
                  <Slider
                    id="transparency"
                    value={[transparency]}
                    onValueChange={(v) => onTransparencyChange(v[0])}
                    max={100}
                    step={1}
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="rounded-2xl bg-sidebar-accent/40 p-3">
              <SidebarGroupLabel className="px-1 text-xs uppercase tracking-wide text-sidebar-foreground/60">
                Setup
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-6 pt-1 group-data-[collapsible=icon]:hidden">
                <div className="space-y-3">
                  <Label htmlFor="grid-size">Grid Size</Label>
                  <Slider
                    id="grid-size"
                    value={[gridSize]}
                    onValueChange={(v) => onGridSizeChange(v[0])}
                    max={20}
                    min={5}
                    step={1}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="init-pattern">Initial State</Label>
                  <Select value={initPattern} onValueChange={onInitPatternChange}>
                    <SelectTrigger id="init-pattern">
                      <SelectValue placeholder="Select initial state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="dots">Grid of Dots</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="gap-3 pb-4 group-data-[collapsible=icon]:hidden">
        <Button
          className="w-full justify-center gap-2 rounded-xl py-5 text-base font-medium"
          variant="secondary"
          size="lg"
          onClick={onToggleRunning}
          aria-label={isRunning ? "Pause" : "Play"}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "Pause simulation" : "Start simulation"}
        </Button>
        <Button
          className="w-full justify-center gap-2 rounded-xl py-5 text-base font-medium"
          variant="ghost"
          size="lg"
          onClick={onReset}
          aria-label="Reset"
        >
          <RefreshCw className="h-5 w-5" />
          Reset lattice
        </Button>
      </SidebarFooter>
    </>
  );
}
