import { Linter, RuleTester } from "eslint";
import { describe, expect, it } from "vitest";
import rule from "../rules/no-clipped-shadow.mjs";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("rdna/no-clipped-shadow", () => {
  it("passes RuleTester", () => {
    tester.run("no-clipped-shadow", rule, {
      valid: [
        { code: '<div className="pixel-rounded-4 pixel-shadow-raised" />' },
        { code: '<div className="rounded-md shadow-raised" />' },
      ],
      invalid: [
        {
          code: '<div className="pixel-rounded-4 shadow-raised" />',
          errors: [
            {
              messageId: "clippedShadowSameElement",
              data: {
                shadow: "shadow-raised",
                corner: "pixel-rounded-4",
                suggestion: "pixel-shadow-raised",
              },
            },
          ],
        },
        {
          code: '<div className="pixel-rounded-8"><div className="shadow-floating" /></div>',
          errors: [
            {
              messageId: "clippedShadowAncestor",
              data: {
                shadow: "shadow-floating",
                corner: "pixel-rounded-8",
                suggestion: "pixel-shadow-floating",
              },
            },
          ],
        },
      ],
    });
  });

  it("uses the contract-backed glow shadow suggestion text", () => {
    const linter = new Linter({ configType: "eslintrc" });
    linter.defineRule("rdna/no-clipped-shadow", rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
      rules: { "rdna/no-clipped-shadow": "error" },
    };

    const messages = linter.verify('<div className="pixel-corner shadow-glow-success" />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe("clippedShadowSameElement");
    expect(messages[0]?.message).toContain("custom filter: drop-shadow with success color");
  });
});
