import type { AnchorHTMLAttributes } from "react";
import { Link as WouterLink, useLocation } from "wouter";

export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <WouterLink href={href} {...props}>
      {children}
    </WouterLink>
  );
}

export default Link;

export function useRouter() {
  const [, navigate] = useLocation();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => window.history.back(),
  };
}

export function usePathname() {
  const [location] = useLocation();
  return location.split("?")[0] || "/";
}

export function useSearchParams() {
  const [location] = useLocation();
  return new URLSearchParams(location.split("?")[1] ?? "");
}
