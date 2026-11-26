import { type Festival } from "@/lib/festivals";

const ART = import.meta.glob("@/assets/fest/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
export const festivalImage = (id: string) => Object.entries(ART).find(([k]) => k.endsWith(`/${id}.jpg`))?.[1];

export default function FestivalArt({ festival, image, animated = false }: { festival: Festival; image?: string; animated?: boolean }) {
  const src = image || festivalImage(festival.id);
  return <figure className={`festival-art ${animated ? "festival-art-animated" : ""}`} aria-label={`${festival.name} artwork`}>
    {src ? <img src={src} alt={festival.name} width={1280} height={1280} decoding="async" className="festival-art-img" />
      : <div className="festival-art-fallback">{festival.emoji}</div>}
    <span className="festival-art-shine" aria-hidden />
    <figcaption className="festival-art-caption"><span>{festival.emoji}</span><span>{festival.greeting}</span></figcaption>
  </figure>;
}
