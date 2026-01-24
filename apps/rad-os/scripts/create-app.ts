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
import { Card, Button } from '@/components/ui';

interface ${config.pascalName}AppProps {
  windowId: string;
}

export function ${config.pascalName}App({ windowId }: ${config.pascalName}AppProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <h1 className="font-joystix text-pixel-lg text-primary mb-4">
          ${config.pascalName.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
        </h1>

        <Card>
          <p className="font-mondwest text-body-md">
            ${config.pascalName} app content goes here.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default ${config.pascalName}App;
`;

const tabbedAppTemplate = (config: AppConfig) => `'use client';

import React from 'react';
import { Tabs, TabList, TabTrigger, TabContent, Card } from '@/components/ui';

interface ${config.pascalName}AppProps {
  windowId: string;
}

export function ${config.pascalName}App({ windowId }: ${config.pascalName}AppProps) {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="tab1" className="flex flex-col h-full">
        {/* Tab Menu */}
        <TabList className="px-4 pt-2">
          <TabTrigger value="tab1">Tab 1</TabTrigger>
          <TabTrigger value="tab2">Tab 2</TabTrigger>
          <TabTrigger value="tab3">Tab 3</TabTrigger>
        </TabList>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          <TabContent value="tab1">
            <Card>
              <h2 className="font-joystix text-pixel-md mb-2">TAB 1</h2>
              <p className="font-mondwest text-body-md">
                Content for tab 1.
              </p>
            </Card>
          </TabContent>

          <TabContent value="tab2">
            <Card>
              <h2 className="font-joystix text-pixel-md mb-2">TAB 2</h2>
              <p className="font-mondwest text-body-md">
                Content for tab 2.
              </p>
            </Card>
          </TabContent>

          <TabContent value="tab3">
            <Card>
              <h2 className="font-joystix text-pixel-md mb-2">TAB 3</h2>
              <p className="font-mondwest text-body-md">
                Content for tab 3.
              </p>
            </Card>
          </TabContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ${config.pascalName}App;
`;

const statefulAppTemplate = (config: AppConfig) => `'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store';
import { Card, Button, Spinner } from '@/components/ui';

interface ${config.pascalName}AppProps {
  windowId: string;
}

export function ${config.pascalName}App({ windowId }: ${config.pascalName}AppProps) {
  // Select state from store
  const items = useAppStore((state) => state.${config.camelName}.items);
  const isLoading = useAppStore((state) => state.${config.camelName}.isLoading);
  const error = useAppStore((state) => state.${config.camelName}.error);
  const fetchItems = useAppStore((state) => state.${config.camelName}.fetchItems);

  // Fetch data on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Spinner />
        <span className="font-joystix text-pixel-sm text-black/50">
          LOADING...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <span className="font-joystix text-pixel-sm text-sun-red">
          {error}
        </span>
        <Button onClick={() => fetchItems()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <h1 className="font-joystix text-pixel-lg text-primary mb-4">
          ${config.pascalName.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
        </h1>

        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-card">
              <h3 className="font-joystix text-pixel-sm">{item.name}</h3>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ${config.pascalName}App;
`;

const indexTemplate = (config: AppConfig) => `export { ${config.pascalName}App } from './${config.pascalName}App';
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
      // TODO: Replace with actual API call or import mock data
      // import { ${config.camelName}MockData } from '@/lib/mockData';
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network

      // Placeholder data - replace with actual data source
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

const registrySnippet = (config: AppConfig) => `
// Add to lib/constants.ts APP_REGISTRY:

${config.name}: {
  id: '${config.name}',
  title: '${config.pascalName.replace(/([A-Z])/g, ' $1').trim()}',
  icon: <${config.pascalName}Icon size={16} />,
  component: ${config.pascalName}App,
  defaultSize: { width: 600, height: 400 },
  minSize: { width: 400, height: 300 },
  resizable: true,
},

// Add to APP_IDS:
${config.camelName}: '${config.name}',
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

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath: string, content: string): void {
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

  // Paths
  const rootDir = path.resolve(__dirname, '..');
  const appDir = path.join(rootDir, 'components', 'apps', config.pascalName);
  const storeDir = path.join(rootDir, 'store', 'slices');
  const mockDir = path.join(rootDir, 'lib', 'mockData');

  // Create app component
  ensureDir(appDir);

  let appContent: string;
  if (config.withState) {
    appContent = statefulAppTemplate(config);
  } else if (config.withTabs) {
    appContent = tabbedAppTemplate(config);
  } else {
    appContent = basicAppTemplate(config);
  }

  writeFile(path.join(appDir, `${config.pascalName}App.tsx`), appContent);
  writeFile(path.join(appDir, 'index.ts'), indexTemplate(config));

  // Create Zustand slice
  if (config.withState) {
    ensureDir(storeDir);
    writeFile(
      path.join(storeDir, `${config.camelName}Slice.ts`),
      sliceTemplate(config)
    );
  }

  // Create mock data
  if (config.withMock) {
    ensureDir(mockDir);
    writeFile(
      path.join(mockDir, `${config.camelName}.ts`),
      mockDataTemplate(config)
    );
  }

  // Print next steps
  console.log(`
Next steps:

1. Add to APP_REGISTRY in lib/constants.ts:
${registrySnippet(config)}

2. Import the app component:
   import { ${config.pascalName}App } from '@/components/apps/${config.pascalName}';

3. Create an icon component or use an existing one:
   import { ${config.pascalName}Icon } from '@/components/icons';
`);

  if (config.withState) {
    console.log(`4. Add slice to store/index.ts:
   import { create${config.pascalName}Slice, ${config.pascalName}Slice } from './slices/${config.camelName}Slice';

   // Add to AppStore type
   type AppStore = WindowSlice & ${config.pascalName}Slice;

   // Add to create function
   ...create${config.pascalName}Slice(...args),
`);
  }

  if (config.withMock) {
    console.log(`5. Export mock data from lib/mockData/index.ts:
   export * from './${config.camelName}';
`);
  }

  console.log('Done!\n');
}

main();
`;
