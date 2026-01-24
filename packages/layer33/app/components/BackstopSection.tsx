import { DecorationDiv } from '@/components/ui/DecorationDiv';
import { Divider } from '@/components/ui/Divider';

export function BackstopSection() {
  return (
    <section className="section_home-backstop">
      <div className="page-padding">
        <div className="w-full max-w-[64rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[6.25rem] place-items-center">
            <div className="relative w-full aspect-square bg-black flex justify-center items-center">
              <img src="/images/bg.png" alt="" className="w-full h-full object-cover" />
              <DecorationDiv orientation="horizontal" top="15%" left={0} transform="translateX(-50%)" />
              <DecorationDiv orientation="horizontal" top="25%" left={0} transform="translateX(-50%)" />
              <DecorationDiv orientation="horizontal" top="20%" left={0} transform="translateX(-50%)" />
              <DecorationDiv orientation="horizontal" bottom="15%" left={0} transform="translateX(-50%)" />
              <DecorationDiv orientation="horizontal" bottom="12.5%" left={0} transform="translateX(-50%)" />
              <DecorationDiv orientation="horizontal" bottom="10%" left={0} transform="translateX(-50%)" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <small>critical mission</small>
                <div className="uppercase font-semibold font-alfacad">01</div>
              </div>
              <Divider variant="mix-blend" className="my-4" />
              <h2>The Backstop</h2>
              <p>Solana&apos;s security depends on distributed stake.<br /><br />As institutional capital concentrates network control, independent validators become critical infrastructure.<br /><br />Layer 33 ensures decentralization at scale.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
