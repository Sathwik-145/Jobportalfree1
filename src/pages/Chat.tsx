import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChatWindow } from "@/components/ChatWidget";

const Chat = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Chat with JobBot
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">Your AI assistant for jobs, careers, and site help.</p>
          </div>
          <ChatWindow fullPage />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Chat;
