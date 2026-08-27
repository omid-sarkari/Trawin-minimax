# Branch: feature/behavior-intelligence-resume-system

## Overview
This branch implements the Behavior Intelligence engine and Resume system for Trawin.

## Features
- Behavior Intelligence with 4 detectors
- Resume system with user and company versions
- Next.js adapter for Supabase
- Type-safe implementation

## Structure
```
packages/behavior-intelligence/   # Core BI package
src/lib/behavior-intelligence-adapter/  # Next.js adapter
src/types/resume/                    # Resume types
src/services/resume/                 # Resume services
```

## Usage
```typescript
import { runBehaviorAnalysis } from 'behavior-intelligence';
import { NextjsBehaviorIntelligenceAdapter } from './lib/behavior-intelligence-adapter/nextjs.adapter';

const adapter = new NextjsBehaviorIntelligenceAdapter(supabaseClient);
await runBehaviorAnalysis(adapter, 'session-id');
```
