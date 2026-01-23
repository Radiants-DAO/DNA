import { MobileNav } from '@/components/MobileNav';
import { menuItems } from '@/components/navConfig';
import { Footer } from '@/components/33layout';
import { HeroSection } from '@/app/components/HeroSection';
import { QuoteSection } from '@/app/components/QuoteSection';
import { ValidatorsSection } from '@/app/components/validators';
import { DashboardsSection } from '@/app/components/DashboardsSection';
import { ServicesSection } from '@/app/components/ServicesSection';
import { BackstopSection } from '@/app/components/BackstopSection';
import { FAQSection } from '@/app/components/FAQSection';
import { MissionSection } from '@/app/components/MissionSection';
import { CTASection } from '@/app/components/CTASection';

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      <MobileNav menuItems={menuItems} />
      <HeroSection />
      <QuoteSection />
      <ValidatorsSection />
      <DashboardsSection />
      <ServicesSection />
      <BackstopSection />
      <FAQSection />
      <MissionSection />
      <CTASection />
      <Footer />
    </div>
  );
}
