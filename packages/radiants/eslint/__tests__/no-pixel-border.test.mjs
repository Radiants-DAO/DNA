import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "../rules/no-pixel-border.mjs";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("rdna/no-pixel-border", () => {
  it("passes RuleTester", () => {
    tester.run("no-pixel-border", rule, {
      valid: [
        { code: '<div className="rounded-md border-line" />' },
        { code: '<div className="pixel-rounded-4 border-none" />' },
      ],
      invalid: [
        {
          code: '<div className="pixel-rounded-4 border-line" />',
          errors: [
            {
              messageId: "clippedBorder",
              data: {
                cls: "border-line",
                corner: "pixel-rounded-4",
              },
            },
          ],
        },
        {
          code: '<div className="pixel-corner overflow-hidden" />',
          errors: [{ messageId: "clippedOverflow", data: { corner: "pixel-corner" } }],
        },
      ],
    });
  });
});
