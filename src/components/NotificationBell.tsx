import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Briefcase, MessageCircle, FileText, UserPlus, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

const getNotifMeta = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("application")) return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (t.includes("message")) return { Icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-500/10" };
  if (t.includes("user") || t.includes("registered") || t.includes("joined")) return { Icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10" };
  if (t.includes("job")) return { Icon: Briefcase, color: "text-primary", bg: "bg-primary/10" };
  if (t.includes("announcement")) return { Icon: Megaphone, color: "text-orange-500", bg: "bg-orange-500/10" };
  return { Icon: Sparkles, color: "text-muted-foreground", bg: "bg-muted" };
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const notifications = (data as Notification[]) || [];
    setNotifications(notifications);

    if (notifications.length === 10) {
      const oldestKeptDate = notifications[9].created_at;
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .lt("created_at", oldestKeptDate);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) markAllRead();
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Notifications</h4>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {unreadCount} new
            </span>
          )}
        </div>
        <ScrollArea className="h-80 overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No new notifications right now</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const { Icon, color, bg } = getNotifMeta(n.title);
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{n.title}</p>
                        {!n.is_read && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
