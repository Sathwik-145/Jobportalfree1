import PublicContacts from "@/components/PublicContacts";
import { defaultContacts, usePresentation } from "@/lib/portalPresentation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Youtube, Instagram, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeadlineTicker from "@/components/HeadlineTicker";



const ContactUs = () => {
  const { toast } = useToast();
  const contacts = usePresentation("public_contacts", defaultContacts);
  const CONTACT_EMAIL = contacts.email;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Please fill in Name, Email, and Message", variant: "destructive" });
      return;
    }

    const subject = encodeURIComponent(`Contact from ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\nPhone: ${phone.trim() || "N/A"}\n\nMessage:\n${message.trim()}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    toast({ title: "Redirecting to your email client!", description: "Your message details have been pre-filled." });
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <HeadlineTicker />
      <main className="flex-1 container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-2">Contact Us</h1>
          <p className="text-muted-foreground text-center mb-8">Have questions or feedback? We'd love to hear from you!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" placeholder="Describe your query or feedback..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={1000} />
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <Send className="w-4 h-4" /> Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info & Social */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PublicContacts />
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p>India</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <PublicContacts />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
