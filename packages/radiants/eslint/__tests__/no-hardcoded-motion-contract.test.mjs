import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { motion } from "../contract.mjs";

describe("no-hardcoded-motion contract wiring", () => {
  it("exposes both class-token and css-variable motion suggestions", () => {
    expect(motion.allowedEasings).toEqual(expect.arrayContaining(["ease-standard"]));
    expect(motion.easingTokens).toEqual(expect.arrayContaining(["--easing-default"]));
    expect(motion.durationTokens).toEqual(
      expect.arrayContaining(["duration-base", "duration-slow"]),
    );
  });

  it("keeps the rule on direct contract imports", () => {
    const source = readFileSync(resolve(process.cwd(), "eslint/rules/no-hardcoded-motion.mjs"), "utf8");
    expect(source).toContain("../contract.mjs");
    expect(source).not.toContain("token-map.mjs");
  });
});
