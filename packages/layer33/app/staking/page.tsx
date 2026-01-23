import { MobileNav } from '@/components/MobileNav';
import { menuItems } from '@/components/navConfig';
import { StakingForm } from './components/StakingForm';
import { DecorationDiv } from '@/components/ui/DecorationDiv';
import { Footer } from '@/components/33layout';
import { FAQSection } from '@/app/components/FAQSection';
import { CTASection } from '@/app/components/CTASection';

export default function StakingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <MobileNav menuItems={menuItems} />

      {/* Hero Section - Staking Form */}
      <section className="section_staking-hero">
        <div className="page-padding">
          <div className="container-large w-full max-w-[77rem] mx-auto">
            <StakingForm />

            {/* Hero Text Block */}
            <div className="container-small w-full max-w-[64rem] mx-auto mt-8 md:mt-12">
              <div className="hero_text margin bg-neutral-neutral-1 text-center flex justify-center items-center relative">
                <img
                  src="/images/bg.png"
                  alt=""
                  width={1024}
                  height={768}
                  className="bg_img absolute inset-0 w-full h-full max-w-none"
                  style={{
                    zIndex: 0,
                    opacity: 0.13,
                    mixBlendMode: 'difference',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
                <div className="container-xsmall w-full max-w-[32rem] mx-auto relative z-[1]">
                  <h1 className="heading-style-h2 text-2xl md:text-3xl lg:text-[3.75rem] font-normal leading-none text-black">
                    INDEPENDENT VALIDATORS, COLLECTIVE STRENGTH.
                  </h1>
                </div>
                <DecorationDiv orientation="vertical" top="1rem" left="-2.5rem" className="z-[1] hidden md:block" />
                <DecorationDiv orientation="vertical" bottom="2.5rem" right="-2.5rem" className="z-[1] hidden md:block" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
