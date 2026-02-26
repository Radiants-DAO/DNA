#!/usr/bin/env python3
"""
RDNA quality checks for design-system and Tailwind v4 guardrails.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class Finding:
    severity: str  # "error" | "warn"
    check_id: str
    message: str
    lines: list[str]


def run_rg(
    root: Path,
    patterns: list[str],
    paths: Iterable[Path],
    *,
    pcre2: bool = False,
    globs: list[str] | None = None,
) -> list[str]:
    cmd = ["rg", "-n", "--no-heading", "--color", "never"]
    if pcre2:
        cmd.append("-P")
    for pat in patterns:
        cmd.extend(["-e", pat])
    if globs:
        for glob in globs:
            cmd.extend(["--glob", glob])
    cmd.extend(str(p) for p in paths if p.exists())
    if len(cmd) <= 6:
        return []
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    if proc.returncode not in (0, 1):
        raise RuntimeError(f"rg failed: {' '.join(cmd)}\n{proc.stderr}")
    out = proc.stdout.strip()
    return out.splitlines() if out else []


def find_pkg_dir(root: Path) -> Path | None:
    candidates = [
        root / "packages" / "radiants",
        (root / "../../packages/radiants").resolve(),
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


def add_forbidden_check(
    findings: list[Finding],
    *,
    severity: str,
    check_id: str,
    message: str,
    root: Path,
    patterns: list[str],
    paths: list[Path],
    globs: list[str],
    pcre2: bool = False,
) -> None:
    lines = run_rg(root, patterns, paths, pcre2=pcre2, globs=globs)
    if lines:
        findings.append(Finding(severity, check_id, message, lines))


def check_sun_overlay_tokens(findings: list[Finding], *, root: Path, pkg_dir: Path) -> None:
    tokens = pkg_dir / "tokens.css"
    if not tokens.exists():
        findings.append(
            Finding(
                "error",
                "tokens.sun-overlays-opaque",
                f"Missing tokens file: {tokens}",
                [],
            )
        )
        return

    text = tokens.read_text(encoding="utf-8")

    bad_rgba = re.findall(
        r"^\s*--color-(?:surface-overlay-subtle|surface-overlay-medium|hover-overlay|active-overlay)\s*:\s*rgba\([^\n]+\)",
        text,
        flags=re.MULTILINE,
    )
    if bad_rgba:
        findings.append(
            Finding(
                "error",
                "tokens.sun-overlays-opaque",
                "Sun Mode overlay tokens in tokens.css must not use rgba(...).",
                bad_rgba,
            )
        )

    allowed = {
        "surface-overlay-subtle": r"^\s*--color-surface-overlay-subtle\s*:\s*var\(--color-(?:cream|sun-yellow|ink)\)\s*;",
        "surface-overlay-medium": r"^\s*--color-surface-overlay-medium\s*:\s*var\(--color-(?:cream|sun-yellow|ink)\)\s*;",
        "hover-overlay": r"^\s*--color-hover-overlay\s*:\s*var\(--color-(?:cream|sun-yellow|ink)\)\s*;",
        "active-overlay": r"^\s*--color-active-overlay\s*:\s*var\(--color-(?:cream|sun-yellow|ink)\)\s*;",
    }

    for token, pat in allowed.items():
        if not re.search(pat, text, flags=re.MULTILINE):
            findings.append(
                Finding(
                    "error",
                    "tokens.sun-overlays-opaque",
                    f"--color-{token} must be an opaque primitive var(...) in tokens.css.",
                    [],
                )
            )


def print_findings(findings: list[Finding], max_lines: int) -> tuple[int, int]:
    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    if not findings:
        print("RDNA QC: PASS")
        return 0, 0

    for f in findings:
        tag = "ERROR" if f.severity == "error" else "WARN"
        print(f"[{tag}] {f.check_id}: {f.message}")
        if f.lines:
            shown = f.lines[:max_lines]
            for line in shown:
                print(f"  - {line}")
            if len(f.lines) > max_lines:
                print(f"  - ... and {len(f.lines) - max_lines} more")
        print("")

    print(f"RDNA QC: {len(errors)} error(s), {len(warns)} warning(s)")
    return len(errors), len(warns)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run RDNA + Tailwind v4 quality checks.")
    parser.add_argument(
        "--profile",
        choices=("migration", "greenfield"),
        default="migration",
        help="migration=practical baseline, greenfield=strict",
    )
    parser.add_argument("--root", default=".", help="Repo root (default: current directory)")
    parser.add_argument("--max-lines", type=int, default=20, help="Max lines per finding")
    parser.add_argument("--fail-on-warn", action="store_true", help="Non-zero exit if warnings exist")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    pkg_dir = find_pkg_dir(root)

    findings: list[Finding] = []

    design_a = root / "design.md"
    design_b = (pkg_dir / "DESIGN.md") if pkg_dir else None
    if not design_a.exists() and (design_b is None or not design_b.exists()):
        findings.append(
            Finding(
                "error",
                "spec.canonical-design-missing",
                "Missing canonical design spec (expected design.md or packages/radiants/DESIGN.md).",
                [],
            )
        )

    src_paths: list[Path] = [root / "app", root / "components", root / "lib"]
    if pkg_dir:
        src_paths.extend(
            [
                pkg_dir / "components" / "core",
                pkg_dir / "tokens.css",
                pkg_dir / "dark.css",
                pkg_dir / "base.css",
                pkg_dir / "typography.css",
            ]
        )
    src_paths = [p for p in src_paths if p.exists()]

    # Tailwind v4 should not use tailwind.config.* in this stack.
    tw_cfg_hits = []
    for name in ("tailwind.config.js", "tailwind.config.cjs", "tailwind.config.mjs", "tailwind.config.ts"):
        p = root / name
        if p.exists():
            tw_cfg_hits.append(str(p.relative_to(root)))
    if tw_cfg_hits:
        findings.append(
            Finding(
                "error",
                "tailwind.no-v3-config",
                "Tailwind v4 stack should not include tailwind.config.*",
                tw_cfg_hits,
            )
        )

    apply_severity = "error" if args.profile == "greenfield" else "warn"
    add_forbidden_check(
        findings,
        severity=apply_severity,
        check_id="tailwind.no-apply",
        message="`@apply` is disallowed in this Tailwind v4 stack.",
        root=root,
        patterns=[r"@apply"],
        paths=src_paths,
        globs=["*.css", "*.tsx", "*.ts"],
    )

    add_forbidden_check(
        findings,
        severity="error",
        check_id="tokens.no-deprecated-aliases",
        message="Deprecated/removed token aliases detected.",
        root=root,
        patterns=[
            r"--color-black\b",
            r"--color-white\b",
            r"--color-green\b",
            r"--color-success-green\b",
            r"--color-warm-cloud\b",
            r"--glow-green\b",
            r"--color-success-green-dark\b",
            r"--color-warning-yellow-dark\b",
            r"--color-error-red-dark\b",
        ],
        paths=src_paths,
        globs=["*.css", "*.tsx", "*.ts"],
    )

    add_forbidden_check(
        findings,
        severity="error",
        check_id="tailwind.maxw-no-tshirt",
        message="Tailwind v4 max-w t-shirt utility detected (use explicit rem values).",
        root=root,
        patterns=[r"\bmax-w-(xs|sm|md|lg|xl|2xl|3xl|4xl)\b"],
        paths=src_paths,
        globs=["*.tsx", "*.ts", "*.css"],
    )

    if pkg_dir:
        check_sun_overlay_tokens(findings, root=root, pkg_dir=pkg_dir)

    strict_severity = "error" if args.profile == "greenfield" else "warn"

    add_forbidden_check(
        findings,
        severity=strict_severity,
        check_id="typography.semantic-tag-overrides",
        message="Typography skin classes found on semantic tags (h1-h4, p, label).",
        root=root,
        patterns=[
            r'<(h1|h2|h3|h4|p|label)\b[^>]*className="[^"]*(font-|text-(?!size-)(xs|sm|base|lg|xl|2xl|3xl|4xl|\[[^\]]+\])|leading-|uppercase)'
        ],
        paths=[p for p in src_paths if p.is_dir()],
        globs=["*.tsx"],
        pcre2=True,
    )

    if args.profile == "greenfield":
        add_forbidden_check(
            findings,
            severity="error",
            check_id="typography.no-text-sm",
            message="`text-sm` found; RDNA scale excludes it.",
            root=root,
            patterns=[r"\btext-sm\b"],
            paths=[p for p in src_paths if p.is_dir()],
            globs=["*.tsx", "*.ts", "*.css"],
        )

        add_forbidden_check(
            findings,
            severity="error",
            check_id="tailwind.no-arbitrary-px-utility",
            message="Arbitrary px utility detected for text/spacing.",
            root=root,
            patterns=[r"\b(text|p[trblxy]?|m[trblxy]?|gap)-\[[0-9]+px\]"],
            paths=[p for p in src_paths if p.is_dir()],
            globs=["*.tsx", "*.ts", "*.css"],
        )

    errors, warns = print_findings(findings, args.max_lines)
    if errors > 0:
        return 1
    if args.fail_on_warn and warns > 0:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
