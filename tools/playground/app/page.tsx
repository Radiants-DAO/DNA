import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-heading uppercase tracking-tight">
        DNA Playground
      </h1>
      <p className="text-content-secondary max-w-[28rem] text-center">
        Component iteration and design comparison tool for RDNA themes.
      </p>
      <Link
        href="/playground"
        className="inline-flex items-center gap-2 rounded-sm border border-edge-primary bg-action-primary px-6 py-3 font-heading text-sm uppercase tracking-tight text-content-inverted transition-all hover:-translate-y-0.5 hover:shadow-raised"
      >
        Open Playground
      </Link>
    </main>
  );
}
