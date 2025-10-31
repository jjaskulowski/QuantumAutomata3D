"use client";

import { Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarTrigger } from "@/components/ui/sidebar";

type AutomatonControlsProps = {
  isRunning: boolean;
  onToggleRunning: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  transparency: number;
  onTransparencyChange: (value: number) => void;
  onReset: () => void;
};

export function AutomatonControls({
  isRunning,
  onToggleRunning,
  speed,
  onSpeedChange,
  transparency,
  onTransparencyChange,
  onReset,
}: AutomatonControlsProps) {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <h1 className="font-headline text-2xl font-semibold group-data-[collapsible=icon]:hidden">Quantum Automata</h1>
            <SidebarTrigger className="md:hidden"/>
        </div>
        <p className="text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">3D Cellular Automaton Simulation</p>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Controls</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-6 p-2 group-data-[collapsible=icon]:hidden">
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="flex justify-around">
          <Button variant="ghost" size="lg" onClick={onToggleRunning} aria-label={isRunning ? "Pause" : "Play"}>
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            <span className="ml-2">{isRunning ? "Pause" : "Play"}</span>
          </Button>
          <Button variant="ghost" size="lg" onClick={onReset} aria-label="Reset">
            <RefreshCw className="h-6 w-6" />
            <span className="ml-2">Reset</span>
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
