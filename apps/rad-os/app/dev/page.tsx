import Link from 'next/link';

const DEV_TOOLS = [
  {
    href: '/dev/ctrl',
    title: 'CTRL Preview',
    description: 'Interactive showcase for @rdna/ctrl controls, selectors, readouts, and layout.',
  },
  {
    href: '/dev/pixel-corners',
    title: 'Pixel Corners',
    description: 'Pixel corner geometry, scales, shadows, and concave corner samples.',
  },
  {
    href: '/dev/colors',
    title: 'Color Mapping',
    description: 'Semantic color tokens resolved across light and dark modes.',
  },
  {
    href: '/dev/icon-conversion-review',
    title: 'Icon Conversion Review',
    description: 'Review UI for converted pixel icons and accepted conversion issues.',
  },
] as const;

export default function DevToolsPage() {
  return (
    <main className="min-h-screen bg-page p-8 text-main">
      <div className="mx-auto flex max-w-[64rem] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wider text-mute">Internal</p>
          <h1 className="text-3xl text-head">Dev Tools</h1>
          <p className="max-w-[42rem] text-sm text-sub">
            Design-system previews, token inspection, and asset review tools used while authoring
            RDNA packages.
          </p>
        </header>

        <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Dev tools">
          {DEV_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex min-h-32 flex-col justify-between border border-line bg-card p-5 transition-colors hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="text-xl text-head">{tool.title}</span>
              <span className="text-sm text-sub">{tool.description}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
