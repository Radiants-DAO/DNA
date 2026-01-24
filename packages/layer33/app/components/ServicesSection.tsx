import { Button } from '@/components/ui/Button';
import { DecorationDiv } from '@/components/ui/DecorationDiv';
import { Divider } from '@/components/ui/Divider';

export function ServicesSection() {
  return (
    <section id="services">
      <div className="page-padding">
        <div className="w-full max-w-[77rem] mx-auto">
          <div className="bg-black text-white py-12 px-6 md:py-24 md:px-16 relative">
            <h2 className="text-center">Our services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 md:mt-20">
              {/* RPC Services */}
              <div className="flex flex-col gap-2 justify-between items-stretch p-8 pt-8 rounded-none outline outline-1 outline-transparent hover:rounded-[1px] hover:translate-y-[-0.5rem] hover:outline-neutral-neutral-3 transition-all duration-500 ease-in-out relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 ease-in-out pointer-events-none z-0" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <small className="text-green">RPC Services</small>
                  </div>
                  <Divider className="my-4" />
                  <h3>RPC</h3>
                  <p>Layer33 partners with Staking Facilities and Triton to deliver fast, affordable RPC and gRPC services. Our coalition of independent validators carries 18M SOL in combined stake weight and is distributed across the globe, ensuring resilience and performance.<br /><br />If you&apos;re looking for reliable, cost-effective data services that also strengthen Solana&apos;s decentralization, you&apos;re in the right place.</p>
                </div>
                <div className="relative z-10">
                  <Button variant="primary" href="#" iconName="rpc-services">
                    Get Started
                  </Button>
                </div>
              </div>

              {/* SWQoS */}
              <div className="flex flex-col gap-2 justify-between items-stretch p-8 pt-8 rounded-none outline outline-1 outline-transparent hover:rounded-[1px] hover:translate-y-[-0.5rem] hover:outline-neutral-neutral-3 transition-all duration-500 ease-in-out relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 ease-in-out pointer-events-none z-0" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <small className="text-blue">SWQoS</small>
                  </div>
                  <Divider className="my-4" />
                  <h3>SWQoS</h3>
                  <p>Layer33 partners with bloXroute, Astralane, and Triton to provide Stake-Weighted Quality of Service (SWQoS) routing—the most reliable path to consistent Solana transaction landing.<br /><br />Using Yellowstone Shield through Triton, you can allowlist Layer33 validators to guarantee your transactions route through decentralized, high-integrity infrastructure.<br /><br />Both bloXroute and Astralane have fully integrated the Layer33 validator set, meaning any use of their services directly supports our coalition.</p>
                </div>
                <div className="relative z-10">
                  <Button variant="primary" href="#" iconName="block-arrows-basic-arrows-right">
                    Get Started
                  </Button>
                </div>
              </div>

              {/* Staking with Layer 33 */}
              <div className="md:col-span-2 flex flex-col gap-2 border border-black bg-purple text-black justify-between items-stretch p-8 pt-8 relative overflow-hidden group transition-all duration-500 ease-in-out">
                <div className="absolute inset-0 bg-gradient-to-br from-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none z-0" />
                <div className="relative z-10">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <small>Staking with Layer 33</small>
                      <div className="flex">
                        <img src="/assets/icons/staking.svg" alt="" className="w-[19px] h-[20px]" />
                      </div>
                    </div>
                    <Divider className="my-4" />
                    <p>Delegate SOL to the Layer33 stake pool and support 25 independent validators committed to network decentralization.</p>
                    <Divider className="my-4" />
                  </div>
                  <Button variant="primary" href="/staking" iconName="staking">
                    Stake now
                  </Button>
                </div>
              </div>
            </div>

            <DecorationDiv orientation="horizontal" top="-2rem" right="-5rem" width="10rem" className="hidden md:block" />
            <DecorationDiv orientation="horizontal" bottom="-2rem" right="-5rem" width="10rem" className="hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
