import { useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Loader2, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { notifyAdmin } from '@/lib/notifyAdmin';

const ContactAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "compose">("list");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ["my-messages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && open,
  });

  const handleSend = async () => {
    if (!user || sending) return;
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Please fill in subject and message", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data: saved, error } = await supabase.from("contact_messages").insert({
      sender_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
    }).select('id').single();
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      if (saved) notifyAdmin('user_message', { eventId: saved.id });
      toast({ title: "Message sent to admin!" });
      setSubject("");
      setMessage("");
      setView("list");
      queryClient.invalidateQueries({ queryKey: ["my-messages"] });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setView("list"); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <MessageCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "compose" && (
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setView("list")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {view === "compose" ? "New Message" : "Messages to Admin"}
          </DialogTitle>
        </DialogHeader>

        {view === "list" ? (
          <div className="flex flex-col flex-1 min-h-0">
            <Button onClick={() => setView("compose")} size="sm" className="mb-3 gap-1 self-start">
              <Send className="w-4 h-4" /> New Message
            </Button>
            <ScrollArea className="flex-1 max-h-[50vh]">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
              ) : (
                <div className="space-y-3 pr-2">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className="border rounded-lg p-3 space-y-1">
                      <p className="font-medium text-sm">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground">{msg.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                      {msg.admin_reply && (
                        <div className="mt-2 bg-primary/5 border-l-2 border-primary p-2 rounded">
                          <p className="text-[10px] font-medium text-primary">Admin Reply:</p>
                          <p className="text-xs">{msg.admin_reply}</p>
                          {msg.replied_at && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {format(new Date(msg.replied_at), "MMM d, yyyy h:mm a")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input placeholder="Subject..." value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea placeholder="Your message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full gap-1">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactAdmin;
