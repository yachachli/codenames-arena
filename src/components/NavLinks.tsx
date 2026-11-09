"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/tournament", "Tournament"], ["/benchmark", "Benchmark"], ["/play", "Play"], ["/live", "Live game"], ["/about", "About"],
] as const;

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="main">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
