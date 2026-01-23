import { DecorationGroup } from '@/components/ui/DecorationGroup';

export function QuoteSection() {
  return (
    <section
      className="relative py-16 md:py-24 lg:py-32 pr-0 md:pr-[12%] bg-black md:bg-[linear-gradient(90deg,rgba(0,0,0,1)_88%,rgba(255,255,255,0)_88%)]"
    >
      <div className="page-padding">
        <div className="w-full max-w-[64rem] mx-auto">
          <div className="bg-black text-white uppercase text-xl md:text-[2rem] font-light leading-[1.25]">
            <div>
              Concentrated stake means concentrated data access, transaction reordering capability, and MEV extraction at scale. The 33% threshold isn&apos;t arbitrary—it&apos;s the minimum distribution required to prevent institutional control of the network layer.
            </div>
          </div>
        </div>
      </div>

      {/* Grey Square Decoration */}
      <div
        className="absolute -z-10 aspect-square w-[10rem] md:w-[20rem] bottom-[-2rem] md:bottom-[-4rem] right-[5%]"
        style={{
          backgroundImage: `linear-gradient(rgba(200, 200, 200, 0.95), rgba(200, 200, 200, 0.95)), url(/images/bg.png)`,
          backgroundPosition: '0 0, 0 0',
          backgroundSize: 'auto, auto'
        }}
      />

      <DecorationGroup
        orientation="vertical"
        lineCount={3}
        top="-2.5rem"
        left="10%"
        lineGap="1rem"
        className="text-[0.75rem] hidden md:block"
      />

      <DecorationGroup
        orientation="vertical"
        lineCount={3}
        top="-2.5rem"
        right="20%"
        lineGap="1rem"
        className="hidden md:block"
      />
    </section>
  );
}
