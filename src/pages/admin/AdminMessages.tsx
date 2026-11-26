import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Loader2, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";
import SiteLoader from "@/components/SiteLoader";
import DateRangeFilter, { inRange, type DateRange } from "@/components/DateRangeFilter";

const AdminMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    
    const msgs = data || [];
    setMessages(msgs);

    // Fetch sender profiles
    const senderIds = [...new Set(msgs.map((m: any) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", senderIds);
      const map: Record<string, any> = {};
      profiles?.forEach((p) => { map[p.user_id] = p; });
      setSenderProfiles(map);
    }
    setLoading(false);
  };

  const handleReply = async (msgId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("contact_messages")
      .update({ admin_reply: replyText.trim(), is_read: true, replied_at: new Date().toISOString() })
      .eq("id", msgId);
    if (error) {
      toast({ title: "Failed to reply", variant: "destructive" });
    } else {
      // Send notification to user
      const msg = messages.find((m) => m.id === msgId);
      if (msg) {
        await supabase.from("notifications").insert({
          user_id: msg.sender_id,
          title: "Admin replied to your message",
          message: `Re: ${msg.subject} — ${replyText.trim().substring(0, 100)}`,
        });
      }
      toast({ title: "Reply sent!" });
      setReplyingTo(null);
      setReplyText("");
      fetchMessages();
    }
    setSending(false);
  };

  const markRead = async (msgId: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", msgId);
    fetchMessages();
  };

  if (loading) return <SiteLoader fullscreen={false} text="Loading messages..." />;

  const shown = messages.filter((m) => inRange(m.created_at, range));
  return (
    <div>
      <div className="mb-3"><DateRangeFilter value={range} onChange={setRange} /></div>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">User Messages</h2>
        <Badge variant="secondary">{messages.filter((m) => !m.is_read).length} unread</Badge>
      </div>

      {messages.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No messages yet</p>
      ) : (
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-3 pr-2">
            {shown.map((msg) => {
              const sender = senderProfiles[msg.sender_id];
              return (
                <Card key={msg.id} className={msg.is_read ? "opacity-80" : "border-primary/30"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.is_read ? <MailOpen className="w-4 h-4 text-muted-foreground shrink-0" /> : <Mail className="w-4 h-4 text-primary shrink-0" />}
                          <span className="font-semibold text-sm truncate">{msg.subject}</span>
                          {!msg.is_read && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">New</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          From: {sender?.full_name || sender?.email || "Unknown"} · {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!msg.is_read && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markRead(msg.id)}>
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm bg-muted/50 rounded p-2">{msg.message}</p>

                    {msg.admin_reply && (
                      <div className="bg-primary/5 border-l-2 border-primary p-2 rounded">
                        <p className="text-[10px] font-medium text-primary">Your Reply:</p>
                        <p className="text-xs">{msg.admin_reply}</p>
                      </div>
                    )}

                    {replyingTo === msg.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReply(msg.id)} disabled={sending} className="gap-1 text-xs h-7">
                            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Send Reply
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-xs h-7">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => { setReplyingTo(msg.id); setReplyText(msg.admin_reply || ""); }}
                      >
                        <Send className="w-3 h-3" /> {msg.admin_reply ? "Edit Reply" : "Reply"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AdminMessages;
