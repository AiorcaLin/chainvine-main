import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChainVineLogo } from '@/components/Icons';

export default function WithHeaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ChainVineLogo size={32} className="text-accent" />
            <span className="text-xl font-bold text-foreground">
              Chain<span className="text-accent">Vine</span>
            </span>
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
