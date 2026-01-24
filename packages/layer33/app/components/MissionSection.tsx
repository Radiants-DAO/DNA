import { Divider } from '@/components/ui/Divider';

export function MissionSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="page-padding">
        <div className="w-full max-w-[77rem] mx-auto">
          <div className="flex justify-between items-center gap-4">
            <div className="text-xl md:text-[2.5rem] font-medium">Layer33</div>
            <div className="uppercase font-semibold font-alfacad">04</div>
          </div>
          <Divider variant="mix-blend" className="my-4" />
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">
            <h2 className="max-w-[6ch]">Where purposeful capital goes to work</h2>
            <div className="text-left md:text-right">Distributed stake to validators who build.<br />Performance and contribution over speculation.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
