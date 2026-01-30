import { readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

async function generateSchemas(componentsDir: string) {
  const dirs = readdirSync(componentsDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory()
  );

  let generated = 0;

  for (const dir of dirs) {
    const metaPath = join(componentsDir, dir.name, `${dir.name}.meta.ts`);
    if (!existsSync(metaPath)) continue;

    const mod = await import(pathToFileURL(metaPath).href);
    const meta = Object.values(mod).find(
      (v: any) => v?.name && v?.props
    ) as any;
    if (!meta) continue;

    const { tokenBindings, ...schema } = meta;

    // Write .schema.json
    writeFileSync(
      join(componentsDir, dir.name, `${dir.name}.schema.json`),
      JSON.stringify(schema, null, 2) + "\n"
    );

    // Write .dna.json if tokenBindings exist
    if (tokenBindings) {
      writeFileSync(
        join(componentsDir, dir.name, `${dir.name}.dna.json`),
        JSON.stringify({ component: schema.name, tokenBindings }, null, 2) +
          "\n"
      );
    }

    generated++;
  }

  console.log(`Generated schemas for ${generated} components`);
}

const componentsDir = process.argv[2];
if (!componentsDir) {
  console.error("Usage: tsx generate-schemas.ts <components-dir>");
  process.exit(1);
}
generateSchemas(componentsDir);
