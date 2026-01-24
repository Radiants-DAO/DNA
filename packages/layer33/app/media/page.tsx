import { MobileNav } from '@/components/MobileNav';
import { menuItems } from '@/components/navConfig';
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons';
import { LogoCard } from './components/LogoCard';
import { ColorSwatch } from './components/ColorSwatch';
import { Divider } from '@/components/ui/Divider';
import { Footer } from '@/components/33layout';

// Brand colors from globals.css
const COLORS = [
  { name: 'Green', hex: '#27FF93' },
  { name: 'Blue', hex: '#32D6FF' },
  { name: 'Purple', hex: '#AF9FFF' },
  { name: 'Accent 1', hex: '#D8006C' },
  { name: 'Accent 2', hex: '#CD2900' },
  { name: 'Accent 3', hex: '#506000' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Neutral 1', hex: '#E5E4E3' },
  { name: 'Neutral 2', hex: '#C8C8C8' },
  { name: 'Neutral 3', hex: '#7D7D7D' },
  { name: 'Neutral 4', hex: '#424242' },
];

export default function MediaPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <MobileNav menuItems={menuItems} />

      {/* Main Content */}
      <main className="flex-1 py-8 md:py-16 px-4 md:px-10">
        <div className="container-medium w-full max-w-[64rem] mx-auto">
          {/* Page Title */}
          <h1 className="text-center text-2xl md:text-4xl font-alfacad uppercase mb-6 md:mb-8">Brand Assets</h1>

          {/* Tabs */}
          <div className="flex flex-col">
            <Tabs defaultValue="logos" className="flex flex-col">
              {/* Tab Menu - Centered */}
              <TabList className="justify-center px-2 md:px-4 pt-2">
                <TabTrigger value="logos">
                  Logos
                </TabTrigger>
                <TabTrigger value="colors">Colors</TabTrigger>
                <TabTrigger value="fonts">Fonts</TabTrigger>
                <TabTrigger value="ai-gen">AI Gen</TabTrigger>
              </TabList>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-2 md:p-4">
              {/* Logos Tab */}
              <TabContent value="logos">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logomark Black */}
                  <LogoCard 
                    name="Logomark Black" 
                    svgPath="/assets/logos/logomark.svg" 
                    bgColor="white" 
                    logoColor="black" 
                  />
                  {/* Logomark White */}
                  <LogoCard 
                    name="Logomark White" 
                    svgPath="/assets/logos/logomark-white.svg" 
                    bgColor="black" 
                    logoColor="white" 
                  />
                  {/* Wordmark Black */}
                  <LogoCard 
                    name="Wordmark Black" 
                    svgPath="/assets/logos/wordmark.svg" 
                    bgColor="white" 
                    logoColor="black" 
                  />
                  {/* Wordmark White */}
                  <LogoCard 
                    name="Wordmark White" 
                    svgPath="/assets/logos/wordmark-white.svg" 
                    bgColor="black" 
                    logoColor="white" 
                  />
                </div>
              </TabContent>

              {/* Colors Tab */}
              <TabContent value="colors">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {COLORS.map((color) => (
                    <ColorSwatch key={color.hex} name={color.name} hex={color.hex} />
                  ))}
                </div>
              </TabContent>

              {/* Fonts Tab */}
              <TabContent value="fonts">
                <div className="space-y-4">
                  {/* Afacad Flux */}
                  <Card>
                    <h3 className="font-alfacad text-xl text-black mb-2 uppercase">
                      Afacad Flux
                    </h3>
                    <p className="font-alfacad text-base text-black/70 mb-4">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                      abcdefghijklmnopqrstuvwxyz<br />
                      0123456789
                    </p>
                    <Button variant="secondary" iconName="download">
                      Download Font
                    </Button>
                  </Card>

                  {/* Space Mono */}
                  <Card>
                    <h3 className="font-space-mono text-xl text-black mb-2 uppercase">
                      Space Mono
                    </h3>
                    <p className="font-space-mono text-base text-black/70 mb-4">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                      abcdefghijklmnopqrstuvwxyz<br />
                      0123456789
                    </p>
                    <Button variant="secondary" iconName="download">
                      Download Font
                    </Button>
                  </Card>
                </div>
              </TabContent>

              {/* AI Gen Tab */}
              <TabContent value="ai-gen">
                <Card>
                  <h3 className="font-alfacad text-lg text-black mb-4 uppercase">
                    AI Prompt Codes
                  </h3>
                  <p className="font-alfacad text-base text-black/80 mb-4">
                    Use these prompt codes with Midjourney to generate Layer33-style imagery.
                  </p>
                  <Card variant="dark" className="font-space-mono text-sm">
                    --sref 2686106303 1335137003 --p 28kclbj
                  </Card>
                </Card>
              </TabContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
