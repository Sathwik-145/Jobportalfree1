import LogoSpinner from "@/components/LogoSpinner";

/** In-place logo loader used while a page's code downloads (never a full-screen takeover). */
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading page">
      <LogoSpinner size="lg" />
    </div>
  );
}
