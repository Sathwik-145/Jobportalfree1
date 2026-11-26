import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SocialShareProps {
  title: string;
  url?: string;
}

const SocialShare = ({ title, url }: SocialShareProps) => {
  const shareUrl = url || window.location.href;
  const text = `Check out this job: ${title}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareWhatsApp}>
          <span className="mr-2">💬</span> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareLinkedIn}>
          <span className="mr-2">💼</span> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTelegram}>
          <span className="mr-2">✈️</span> Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <span className="mr-2">🔗</span> Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;
