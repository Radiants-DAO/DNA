/**
 * Base UI wrapper policy contract tests.
 *
 * These tests pin the remediation pass to the installed @base-ui/react version
 * and lock in the cluster-level export surface so agents cannot silently break
 * the public API while refactoring.
 */

it('pins to the installed Base UI version', async () => {
  const pkg = await import('../../../node_modules/@base-ui/react/package.json', {
    assert: { type: 'json' },
  });
  expect(pkg.default.version).toBe('1.3.0');
});

it('uses the stable Drawer namespace export (1.3.0+)', async () => {
  const mod = await import('@base-ui/react/drawer');
  expect(mod).toHaveProperty('Drawer');
});

it('selection cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.Toggle).toBeDefined();
  expect(mod.Checkbox).toBeDefined();
  expect(mod.Radio).toBeDefined();
  expect(mod.Switch).toBeDefined();
});

it('navigation cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.Tabs).toBeDefined();
  expect(mod.Breadcrumbs).toBeDefined();
});

it('form cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.Select).toBeDefined();
  expect(mod.Slider).toBeDefined();
  expect(mod.NumberField).toBeDefined();
  expect(mod.Combobox).toBeDefined();
});

it('overlay cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.Dialog).toBeDefined();
  expect(mod.AlertDialog).toBeDefined();
  expect(mod.Sheet).toBeDefined();
  expect(mod.Popover).toBeDefined();
  expect(mod.Drawer).toBeDefined();
  expect(mod.Tooltip).toBeDefined();
  expect(mod.HelpPanel).toBeDefined();
});

it('feedback cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.ToastProvider).toBeDefined();
  expect(mod.useToast).toBeDefined();
  expect(mod.Alert).toBeDefined();
  expect(mod.Badge).toBeDefined();
  expect(mod.Spinner).toBeDefined();
});

it('menu cluster exports are intact', async () => {
  const mod = await import('../index');
  expect(mod.DropdownMenu).toBeDefined();
  expect(mod.ContextMenu).toBeDefined();
  expect(mod.Menubar).toBeDefined();
});
