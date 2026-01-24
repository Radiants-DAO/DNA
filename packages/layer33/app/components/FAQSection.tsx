import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion';
import { faqItems } from '@/app/data/faq';

export function FAQSection() {
  return (
    <section className="section-faq">
      <div className="page-padding">
        <div className="w-full max-w-[32rem] mx-auto">
          <h2 className="text-center">FAQ</h2>
          <div className="mt-8">
            <Accordion type="single">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-0">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
