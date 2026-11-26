import { motion } from "framer-motion";
import { useState } from "react";

const COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Infosys", domain: "infosys.com" },
  { name: "TCS", domain: "tcs.com" },
  { name: "Wipro", domain: "wipro.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Zomato", domain: "zomato.com" },
  { name: "Flipkart", domain: "flipkart.com" },
  { name: "Swiggy", domain: "swiggy.com" },
  { name: "Paytm", domain: "paytm.com" },
  { name: "Razorpay", domain: "razorpay.com" },
  { name: "Freshworks", domain: "freshworks.com" },
  { name: "Accenture", domain: "accenture.com" },
  { name: "Capgemini", domain: "capgemini.com" },
  { name: "Cognizant", domain: "cognizant.com" },
  { name: "HCL", domain: "hcltech.com" },
  { name: "Tech Mahindra", domain: "techmahindra.com" },
  { name: "Deloitte", domain: "deloitte.com" },
  { name: "PwC", domain: "pwc.com" },
  { name: "EY", domain: "ey.com" },
  { name: "KPMG", domain: "kpmg.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "JPMorgan", domain: "jpmorgan.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "Citi", domain: "citi.com" },
  { name: "HSBC", domain: "hsbc.com" },
  { name: "Barclays", domain: "barclays.com" },
  { name: "American Express", domain: "americanexpress.com" },
  { name: "Visa", domain: "visa.com" },
  { name: "Mastercard", domain: "mastercard.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Square", domain: "squareup.com" },
  { name: "Shopify", domain: "shopify.com" },
  { name: "Twilio", domain: "twilio.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Zoom", domain: "zoom.us" },
  { name: "Atlassian", domain: "atlassian.com" },
  { name: "GitHub", domain: "github.com" },
  { name: "GitLab", domain: "gitlab.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "Figma", domain: "figma.com" },
  { name: "Canva", domain: "canva.com" },
  { name: "Dropbox", domain: "dropbox.com" },
  { name: "Asana", domain: "asana.com" },
  { name: "HubSpot", domain: "hubspot.com" },
  { name: "Zendesk", domain: "zendesk.com" },
  { name: "ServiceNow", domain: "servicenow.com" },
  { name: "Workday", domain: "workday.com" },
  { name: "SAP", domain: "sap.com" },
  { name: "Intuit", domain: "intuit.com" },
  { name: "Nvidia", domain: "nvidia.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "AMD", domain: "amd.com" },
  { name: "Qualcomm", domain: "qualcomm.com" },
  { name: "Cisco", domain: "cisco.com" },
  { name: "Dell", domain: "dell.com" },
  { name: "HP", domain: "hp.com" },
  { name: "Lenovo", domain: "lenovo.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Sony", domain: "sony.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "SpaceX", domain: "spacex.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Anthropic", domain: "anthropic.com" },
  { name: "Snowflake", domain: "snowflake.com" },
  { name: "Databricks", domain: "databricks.com" },
  { name: "MongoDB", domain: "mongodb.com" },
  { name: "Datadog", domain: "datadoghq.com" },
  { name: "Cloudflare", domain: "cloudflare.com" },
  { name: "DigitalOcean", domain: "digitalocean.com" },
  { name: "Vercel", domain: "vercel.com" },
  { name: "Netlify", domain: "netlify.com" },
  { name: "Twitter", domain: "x.com" },
  { name: "Pinterest", domain: "pinterest.com" },
  { name: "Snapchat", domain: "snap.com" },
  { name: "TikTok", domain: "tiktok.com" },
  { name: "Reddit", domain: "reddit.com" },
  { name: "Discord", domain: "discord.com" },
  { name: "Twitch", domain: "twitch.tv" },
  { name: "Disney", domain: "disney.com" },
  { name: "Walmart", domain: "walmart.com" },
  { name: "Target", domain: "target.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Coca-Cola", domain: "coca-cola.com" },
  { name: "PepsiCo", domain: "pepsico.com" },
  { name: "Unilever", domain: "unilever.com" },
  { name: "Reliance", domain: "ril.com" },
  { name: "Tata", domain: "tata.com" },
  { name: "Mahindra", domain: "mahindra.com" },
  { name: "Bajaj", domain: "bajaj.com" },
  { name: "HDFC Bank", domain: "hdfcbank.com" },
  { name: "ICICI Bank", domain: "icicibank.com" },
  { name: "Axis Bank", domain: "axisbank.com" },
  { name: "Kotak", domain: "kotak.com" },
  { name: "SBI", domain: "sbi.co.in" },
  { name: "Byju's", domain: "byjus.com" },
  { name: "Ola", domain: "olacabs.com" },
  { name: "Myntra", domain: "myntra.com" },
  { name: "Nykaa", domain: "nykaa.com" },
  { name: "PhonePe", domain: "phonepe.com" },
  { name: "Zoho", domain: "zoho.com" },
  { name: "Mindtree", domain: "mindtree.com" },
  { name: "Persistent", domain: "persistent.com" },
  { name: "Mphasis", domain: "mphasis.com" },
  { name: "L&T", domain: "larsentoubro.com" },
];

function LogoChip({ name, domain }: { name: string; domain: string }) {
  const [failed, setFailed] = useState(false);
  // Google's S2 favicons service is the most reliable globally.
  const src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return (
    <div className="group flex items-center gap-3 pr-5 pl-2 h-14 rounded-full bg-card/70 backdrop-blur-md border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-300">
      <div className="w-10 h-10 rounded-full bg-white border border-border/50 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
        {failed ? (
          <span className="text-xs font-bold text-foreground/70">{name[0]}</span>
        ) : (
          <img
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            width={32}
            height={32}
            className="w-full h-full object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="font-semibold text-sm whitespace-nowrap text-foreground/80 group-hover:text-foreground transition-colors">
        {name}
      </span>
    </div>
  );
}

export default function CompanyMarquee() {
  const row = [...COMPANIES, ...COMPANIES];
  return (
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 120, ease: "linear", repeat: Infinity }}
      >
        {row.map((c, i) => (
          <LogoChip key={`${c.domain}-${i}`} name={c.name} domain={c.domain} />
        ))}
      </motion.div>
    </div>
  );
}
