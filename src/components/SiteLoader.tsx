import LogoSpinner from "@/components/LogoSpinner";

interface SiteLoaderProps {
  text?: string;
  fullscreen?: boolean;
}

const SiteLoader = ({ text = "Loading...", fullscreen = true }: SiteLoaderProps) => {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in">
        <LogoSpinner size="lg" text={text} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-16">
      <LogoSpinner size="md" text={text} />
    </div>
  );
};

export default SiteLoader;
