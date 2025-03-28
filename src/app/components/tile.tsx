import Link from 'next/link';

interface TileProps {
  href: string;
  title: string;
  description: string;
  variant: 'primary' | 'secondary' | 'highlight';
}

export default function Tile({ href, title, description, variant }: TileProps) {
  const bgColor = {
    primary:
      'bg-primary text-white border-2 border-primary hover:bg-primary/70',
    secondary:
      'bg-secondary text-white border-2 border-secondary hover:bg-secondary/70',
    highlight: 'bg-dark text-white border-2 border-dark hover:bg-dark/70',
  }[variant];

  return (
    <Link href={href} className={`block p-6 transition-colors ${bgColor}`}>
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      <p className="text-sm">{description}</p>
    </Link>
  );
}
