# Quantum Automata 3D

This is a Next.js application that simulates a 3D cellular automaton where each cell's state is a superposition of True (T) and False (F).

## Features

- **3D Cellular Automaton**: A 10x10x10 grid of cells evolves based on the states of their neighbors.
- **Interactive Controls**: A sidebar provides controls to start/pause the simulation, adjust its speed, change the overall opacity, and reset the state.
- **3D Navigation**: The view can be rotated, panned, and zoomed using the mouse.
- **State Visualization**:
    - Cells with a higher "True" component are whiter and more opaque.
    - Cells with a higher "False" component are more transparent.
- **Themed UI**: A modern, dark-themed interface built with shadcn/ui and Tailwind CSS.

## Getting Started

To run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The main simulation logic is located in `src/components/quantum-automaton-view.tsx`.
