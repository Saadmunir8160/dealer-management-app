// ─────────────────────────────────────────────────────────────────────────────
// src/types/index.ts
//
// WHY THIS FILE EXISTS:
//   Instead of importing from deep paths like:
//     import { User } from '../types/auth.types'
//   You import from the barrel:
//     import { User } from '@types'
//
//   This means if you ever move a type file, you only update this
//   one barrel export — not every file that imports it.
// ─────────────────────────────────────────────────────────────────────────────

export * from './auth.types';
export * from './dealer.types';
export * from './product.types';
export * from './order.types';
export * from './coverage.types';
export * from './report.types';
export * from './support.types';
export * from './api.types';
export * from './navigation.types';
export * from './common.types';
export * from './voice.types';
export * from './voiceOrder.types';
