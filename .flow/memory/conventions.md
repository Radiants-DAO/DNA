# Conventions

Project patterns discovered during work. Not in CLAUDE.md but important.

<!-- Entries added manually via `flowctl memory add` -->

## 2026-01-16 manual [convention]
Extract design tokens from store (tokens.public) instead of hardcoding - enables runtime theme switching

## 2026-01-16 manual [convention]
RadOS interactive elements require lift/press pattern: shadow-btn, hover:-translate-y-0.5 hover:shadow-btn-hover, active:translate-y-0.5 active:shadow-none

## 2026-01-16 manual [convention]
RadOS uses hard pixel shadows (shadow-card, shadow-card-lg) not blurred Tailwind defaults (shadow-md, shadow-xl)
