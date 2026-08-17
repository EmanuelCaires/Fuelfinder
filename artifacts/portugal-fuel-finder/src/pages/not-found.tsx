import { Link } from 'wouter';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="w-full max-w-md rounded-[26px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-8 text-center shadow-[var(--shadow)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><MapPin size={25} /></span>
        <p className="mt-6 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--ring))]">Road not found</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em]">This turn is missing.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">The page you’re looking for is not on this route. Let’s get you back to the comparison.</p>
        <Link href="/" className="tap-target mt-7 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-404-home"><ArrowLeft size={15} /> Back to home</Link>
      </div>
    </div>
  );
}
