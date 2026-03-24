import { describe, expect, it } from 'vitest';
import { buildRegistryMetadata } from '../build-registry-metadata';
import { pickContractFields } from '../contract-fields';

describe('buildRegistryMetadata', () => {
  it('returns only server-safe metadata', () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.sourcePath).toMatch(/^packages\/radiants\//);
      expect('component' in entry).toBe(false);
      expect('Demo' in entry).toBe(false);
    }
  });

  it('every entry has a renderMode', () => {
    const entries = buildRegistryMetadata();
    for (const entry of entries) {
      expect(['inline', 'custom', 'description-only']).toContain(entry.renderMode);
    }
  });

  it('returns all non-excluded components', () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThanOrEqual(39);
  });

  it('surfaces canonical props, slots, and display labels', () => {
    const button = buildRegistryMetadata().find((entry) => entry.name === 'Button');
    const badge = buildRegistryMetadata().find((entry) => entry.name === 'Badge');
    const separator = buildRegistryMetadata().find((entry) => entry.name === 'Separator');

    expect(button?.category).toBe('action');
    expect(button?.id).toBe('button');
    expect(button?.label).toBe('Button.tsx');
    expect(button?.group).toBe('Actions');
    expect(button?.props?.mode?.type).toBe('enum');
    expect(button?.slots).toEqual(expect.any(Object));
    expect(button?.states).toContain('hover');

    expect(badge?.category).toBe('feedback');
    expect(separator?.variants).toEqual(expect.any(Array));
    expect(separator?.variants?.length).toBeGreaterThan(0);
  });

  it('surfaces defaultProps and tokenBindings from canonical metadata', () => {
    const input = buildRegistryMetadata().find((entry) => entry.name === 'Input');
    const button = buildRegistryMetadata().find((entry) => entry.name === 'Button');

    expect(input?.defaultProps).toEqual(expect.any(Object));
    expect(button?.tokenBindings).toEqual(expect.any(Object));
  });

  it('keeps co-authored components distinct even when they share a source file', () => {
    const entries = buildRegistryMetadata();
    const textarea = entries.find((entry) => entry.name === 'TextArea');
    const radio = entries.find((entry) => entry.name === 'Radio');

    expect(textarea?.props?.placeholder).toBeDefined();
    expect(radio?.props?.checked).toBeDefined();
  });

  it('accepts enum metadata authored with options or values', () => {
    const drawer = buildRegistryMetadata().find((entry) => entry.name === 'Drawer');

    expect(drawer?.props?.direction?.options ?? drawer?.props?.direction?.values).toEqual([
      'bottom',
      'top',
      'left',
      'right',
    ]);
  });

  it('declares only the custom-demo props we intentionally expose in panels', () => {
    const entries = buildRegistryMetadata();

    expect(entries.find((entry) => entry.name === 'Select')?.controlledProps).toEqual([
      'value',
      'placeholder',
      'disabled',
      'error',
      'fullWidth',
    ]);

    expect(entries.find((entry) => entry.name === 'Drawer')?.controlledProps).toEqual([
      'direction',
      'defaultOpen',
    ]);

    expect(entries.find((entry) => entry.name === 'Sheet')?.controlledProps).toEqual(['side']);
    expect(entries.find((entry) => entry.name === 'Popover')?.controlledProps).toEqual([
      'position',
    ]);
  });

  it("projects sparse contract fields from fixture metadata", () => {
    const fields = pickContractFields({
      name: "Toggle",
      description: "Toggle",
      props: {},
      wraps: "@base-ui/react/toggle",
      a11y: { role: "button", requiredAttributes: ["aria-pressed"] },
      styleOwnership: [{ attribute: "data-state", themeOwned: ["selected"] }],
    });

    expect(fields).toEqual({
      wraps: "@base-ui/react/toggle",
      a11y: { role: "button", requiredAttributes: ["aria-pressed"] },
      styleOwnership: [{ attribute: "data-state", themeOwned: ["selected"] }],
    });
  });

  it("projects pilot contract fields from real component meta files", () => {
    const entries = buildRegistryMetadata();
    const separator = entries.find((entry) => entry.name === "Separator");
    const meter = entries.find((entry) => entry.name === "Meter");
    const collapsible = entries.find((entry) => entry.name === "Collapsible");
    const toggle = entries.find((entry) => entry.name === "Toggle");
    const card = entries.find((entry) => entry.name === "Card");

    expect(separator?.replaces?.map((item) => item.element)).toEqual(["hr"]);
    expect(separator?.wraps).toBe("@base-ui/react/separator");
    expect(meter?.replaces?.map((item) => item.element)).toEqual(["meter", "progress"]);
    expect(collapsible?.replaces?.map((item) => item.element)).toEqual(["details", "summary"]);
    expect(toggle?.a11y).toEqual(
      expect.objectContaining({
        role: "button",
        requiredAttributes: ["aria-pressed"],
      }),
    );
    expect(card?.styleOwnership).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attribute: "data-variant",
          themeOwned: expect.arrayContaining(["default", "inverted", "raised"]),
        }),
      ]),
    );
  });
});
