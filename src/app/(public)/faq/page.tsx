import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "FAQ - Tagz.au",
};

const faqs = [
  {
    q: "What is a Tagz.au Tag?",
    a: "A Tagz.au Tag is a smart identification tag. Each tag has a QR code and NFC chip that links to a detailed online profile containing your contact details, important information, and more.",
  },
  {
    q: "How do I create a profile?",
    a: "Simply scan the QR code on your tag or visit our website, create an account, activate your tag with the code provided, and fill in your information. You can add photos, details, emergency contacts, and more.",
  },
  {
    q: "How does it work when someone scans my tag?",
    a: "When someone scans the QR code with their smartphone camera or taps the NFC chip with their phone, it opens your profile page where they can see your contact details and reach you directly. You also receive an email alert with the scanner's GPS location.",
  },
  {
    q: "Do I need to download an app?",
    a: "No. Tagz.au works entirely through a web browser. The person scanning your tag doesn't need any app — they simply scan the QR code with their phone's camera.",
  },
  {
    q: "Is there a subscription fee?",
    a: "No. There are no subscription fees. Once you purchase a tag, the online profile service is free to use forever. You can create unlimited profiles in your account.",
  },
  {
    q: "How many profiles can I add?",
    a: "You can add an unlimited number of profiles to your account. Each profile can be linked to one or more physical tags.",
  },
  {
    q: "Can I change my information later?",
    a: "Yes. Your profile is dynamic — you can update any information at any time from your dashboard. Changes are reflected immediately when someone scans the tag.",
  },
  {
    q: "Does the tag work worldwide?",
    a: "Yes. QR codes and NFC work with any smartphone anywhere in the world. Our tags can be scanned by anyone, anywhere, anytime.",
  },
  {
    q: "How secure is my data?",
    a: "We use industry-standard encryption to store your data securely. You also have a privacy toggle that lets you hide your contact information from the public scan page whenever you choose.",
  },
  {
    q: "What if I don't receive the activation email?",
    a: "Check your spam and promotions folders. Make sure you entered the correct email address. If you still don't receive it, try using an alternative email address or contact our support team.",
  },
  {
    q: "How is this better than a traditional tag?",
    a: "Traditional tags contain limited, static information that can become outdated. Tagz.au tags link to a detailed, updatable profile with important info, multiple contacts, photos, and GPS location alerts when scanned. Anyone with a smartphone can access it instantly.",
  },
  {
    q: "What can I use Tagz.au for?",
    a: "Tagz.au tags can be used for pets, personal belongings, luggage, keys, equipment, and more. Anything you want to keep track of or make it easy for someone to return to you.",
  },
];

export default function FaqPage() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-2">
          Everything you need to know about Tagz.au
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 text-center p-8 rounded-lg bg-muted/50">
        <h2 className="text-xl font-semibold mb-2">Ready to get started?</h2>
        <p className="text-muted-foreground mb-4">
          Purchase a smart tag and start protecting what matters.
        </p>
        <Button size="lg" asChild>
          <Link href="/buy">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy a Tag
          </Link>
        </Button>
      </div>
    </div>
  );
}
