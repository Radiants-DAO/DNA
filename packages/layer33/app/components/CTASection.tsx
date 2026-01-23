export function CTASection() {
  return (
    <section
      className="section_cta relative"
      style={{
        backgroundImage: `linear-gradient(270deg, var(--color-black) 88%, transparent 88%)`
      }}
    >
      <div className="page-padding">
        <div className="w-full max-w-[32rem] mx-auto">
          <div className="relative">
            <img src="/images/Kemosabe-Chain-Organize.png" alt="" className="w-full" loading="lazy" />
            {/* Footer decoration - vertical blue line on left */}
            <div className="absolute top-0 bottom-0 bg-blue w-px h-full -left-4 md:-left-8" />
            {/* Footer decoration text _2 - rotated 180deg */}
            <div
              className="absolute hidden md:flex justify-between items-center uppercase text-white bg-transparent w-full h-auto"
              style={{
                inset: 'auto 0% -2rem 0',
                transform: 'rotate(180deg)'
              }}
            >
              <a href="#" className="text-white">layer33</a>
            </div>
            {/* Footer decoration text - rotated 90deg */}
            <div
              className="absolute hidden md:flex justify-between items-center uppercase text-white bg-transparent w-full h-auto"
              style={{
                inset: '48% -54% auto auto',
                transform: 'rotate(90deg)'
              }}
            >
              <a href="#" className="text-white">maintaining the 33% threshhold</a>
              <div className="flex items-center">
                <a href="#" className="uppercase text-white">33<br /></a>
                <div className="ml-2 border border-purple w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
