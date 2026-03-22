#!/usr/bin/env npx ts-node

/**
 * RadOS App Scaffold Generator
 *
 * Usage:
 *   npx ts-node scripts/create-app.ts <app-name> [options]
 *
 * Examples:
 *   npx ts-node scripts/create-app.ts calendar
 *   npx ts-node scripts/create-app.ts music-player --with-state --with-tabs
 *
 * Options:
 *   --with-state    Include Zustand slice
 *   --with-tabs     Include tabbed interface
 *   --with-mock     Include mock data file
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface AppConfig {
  name: string;         // kebab-case: "music-player"
  pascalName: string;   // PascalCase: "MusicPlayer"
  camelName: string;    // camelCase: "musicPlayer"
  withState: boolean;
  withTabs: boolean;
  withMock: boolean;
}

// ============================================================================
// Templates
// ============================================================================

const basicAppTemplate = (config: AppConfig) => `'use client';

import React from 'react';
import { Card, Button } from '@rdna/radiants/components/core';
import { WindowContent } from '@/components/Rad_os';
import type { AppProps } from '@/lib/apps';

export function ${config.pascalName}App({ windowId }: AppProps) {
  return (
    <WindowContent padding="md">
      <h1 className="font-joystix text-lg text-main mb-4">
        ${config.pascalName.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
      </h1>

      <Card>
        <p className="font-mondwest text-base">
          ${config.pascalName} app content goes here.
        </p>
      </Card>
    </WindowContent>
  );
}

export default ${config.pascalName}App;
`;

const tabbedAppTemplate = (config: AppConfig) => `'use client';

import React from 'react';
import { Tabs, Card } from '@rdna/radiants/components/core';
import { WindowContent } from '@/components/Rad_os';
import type { AppProps } from '@/lib/apps';

export function ${config.pascalName}App({ windowId }: AppProps) {
  return (
    <WindowContent>
      <Tabs defaultValue="tab1" className="flex flex-col h-full">
        <Tabs.List className="px-4 pt-2">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
        </Tabs.List>

        <div className="flex-1 overflow-auto p-4">
          <Tabs.Content value="tab1">
            <Card>
              <h2 className="font-joystix text-sm mb-2">TAB 1</h2>
              <p className="font-mondwest text-base">
                Content for tab 1.
              </p>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="tab2">
            <Card>
              <h2 className="font-joystix text-sm mb-2">TAB 2</h2>
              <p className="font-mondwest text-base">
                Content for tab 2.
              </p>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="tab3">
            <Card>
              <h2 className="font-joystix text-sm mb-2">TAB 3</h2>
              <p className="font-mondwest text-base">
                Content for tab 3.
              </p>
            </Card>
          </Tabs.Content>
        </div>
      </Tabs>
    </WindowContent>
  );
}

export default ${config.pascalName}App;
`;

const sliceTemplate = (config: AppConfig) => `import { StateCreator } from 'zustand';

// ============================================================================
// Types
// ============================================================================

interface ${config.pascalName}Item {
  id: string;
  name: string;
  // Add more properties as needed
}

// ============================================================================
// Slice Interface
// ============================================================================

export interface ${config.pascalName}Slice {
  items: ${config.pascalName}Item[];
  selectedItem: ${config.pascalName}Item | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  selectItem: (item: ${config.pascalName}Item | null) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// Slice Creator
// ============================================================================

export const create${config.pascalName}Slice: StateCreator<
  ${config.pascalName}Slice,
  [],
  [],
  ${config.pascalName}Slice
> = (set) => ({
  ...initialState,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual data source
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockItems: ${config.pascalName}Item[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      set({ items: mockItems, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        isLoading: false,
      });
    }
  },

  selectItem: (item) => set({ selectedItem: item }),

  reset: () => set(initialState),
});
`;

const mockDataTemplate = (config: AppConfig) => `// ============================================================================
// ${config.pascalName} Mock Data
// ============================================================================

export interface ${config.pascalName}Item {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export const ${config.camelName}MockData: ${config.pascalName}Item[] = [
  {
    id: '${config.camelName}-001',
    name: '${config.pascalName} Item 1',
    description: 'Description for item 1',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: '${config.camelName}-002',
    name: '${config.pascalName} Item 2',
    description: 'Description for item 2',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: '${config.camelName}-003',
    name: '${config.pascalName} Item 3',
    description: 'Description for item 3',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];
`;

const catalogSnippet = (config: AppConfig) => `
// Add to lib/apps/catalog.tsx:

// 1. Add lazy import at the top:
const ${config.pascalName}App = lazy(() => import('@/components/apps/${config.pascalName}App'));

// 2. Add entry to APP_CATALOG array:
{
  id: '${config.name}',
  windowTitle: '${config.pascalName.replace(/([A-Z])/g, ' $1').trim()}',
  windowIcon: <Icon name="square" size={20} />,
  component: ${config.pascalName}App,
  defaultSize: 'md',
  resizable: true,
  desktopVisible: true,
  startMenuSection: 'apps',
},
`;

// ============================================================================
// Helpers
// ============================================================================

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(`  Created: ${filePath}`);
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
RadOS App Scaffold Generator

Usage:
  npx ts-node scripts/create-app.ts <app-name> [options]

Options:
  --with-state    Include Zustand slice
  --with-tabs     Include tabbed interface
  --with-mock     Include mock data file
  --help          Show this help message

Examples:
  npx ts-node scripts/create-app.ts calendar
  npx ts-node scripts/create-app.ts music-player --with-state --with-tabs
`);
    process.exit(0);
  }

  const appName = args[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const config: AppConfig = {
    name: appName,
    pascalName: toPascalCase(appName),
    camelName: toCamelCase(appName),
    withState: args.includes('--with-state'),
    withTabs: args.includes('--with-tabs'),
    withMock: args.includes('--with-mock'),
  };

  console.log(`\nCreating RadOS app: ${config.pascalName}\n`);

  // Paths — flat file pattern (matches existing apps)
  const rootDir = path.resolve(__dirname, '..');
  const appsDir = path.join(rootDir, 'components', 'apps');
  const storeDir = path.join(rootDir, 'store', 'slices');
  const mockDir = path.join(rootDir, 'lib', 'mockData');

  // Create app component as a flat file (e.g., components/apps/CalendarApp.tsx)
  const appContent = config.withTabs ? tabbedAppTemplate(config) : basicAppTemplate(config);
  writeFile(path.join(appsDir, `${config.pascalName}App.tsx`), appContent);

  // Create Zustand slice
  if (config.withState) {
    writeFile(
      path.join(storeDir, `${config.camelName}Slice.ts`),
      sliceTemplate(config)
    );
  }

  // Create mock data
  if (config.withMock) {
    writeFile(
      path.join(mockDir, `${config.camelName}.ts`),
      mockDataTemplate(config)
    );
  }

  // Print next steps
  console.log(`
Next steps:

1. Register in lib/apps/catalog.tsx:
${catalogSnippet(config)}

2. Pick an icon from @rdna/radiants/icons:
   <Icon name="your-icon" size={20} />
`);

  if (config.withState) {
    console.log(`3. Add slice to store/index.ts:
   import { create${config.pascalName}Slice, ${config.pascalName}Slice } from './slices/${config.camelName}Slice';

   // Add to RadOSStore type
   type RadOSStore = WindowsSlice & ${config.pascalName}Slice;

   // Add to create function
   ...create${config.pascalName}Slice(...args),
`);
  }

  if (config.withMock) {
    console.log(`${config.withState ? '4' : '3'}. Export mock data from lib/mockData/index.ts:
   export * from './${config.camelName}';
`);
  }

  console.log('Done!\n');
}

main();
