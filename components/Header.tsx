"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const NAV_ITEMS = [
  { label: "Ask", href: "/" },
  { label: "Examples", href: "/examples" },
  { label: "Architecture", href: "/architecture" },
];

export function Header({
  initials = "SE",
  activePath = "/",
}: {
  initials?: string;
  activePath?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    firstMobileLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <Link
        href="/"
        className="brand"
        aria-label="Mr. Reconcile home"
        onClick={() => setMobileMenuOpen(false)}
      >
        Mr. Reconcile<span className="brand__dot">.</span>
      </Link>
      <nav
        className="site-nav site-nav--desktop"
        aria-label="Primary navigation"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`site-nav__link${activePath === item.href ? " site-nav__link--active" : ""}`}
            aria-current={activePath === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <div className="avatar" aria-label={`Signed in as ${initials}`}>
          {initials}
        </div>
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className="mobile-menu-toggle"
        aria-expanded={mobileMenuOpen}
        aria-controls={mobileMenuId}
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span className="mobile-menu-toggle__icon" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <div
        className="mobile-menu"
        id={mobileMenuId}
        hidden={!mobileMenuOpen}
      >
        <nav className="mobile-menu__nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item, index) => (
            <Link
              ref={index === 0 ? firstMobileLinkRef : undefined}
              key={item.label}
              href={item.href}
              className={`mobile-menu__link${activePath === item.href ? " mobile-menu__link--active" : ""}`}
              aria-current={activePath === item.href ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{item.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__account">
          <div className="avatar" aria-hidden="true">
            {initials}
          </div>
          <span>Signed in as {initials}</span>
        </div>
      </div>
    </header>
  );
}
