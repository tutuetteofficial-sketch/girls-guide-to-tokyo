"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    label: "PLACES",
    href: "/places",
  },
  {
    label: "PRODUCTS",
    href: "/products",
  },
  {
    label: "GUIDES",
    href: "/articles",
  },
  {
    label: "MY LIST",
    href: "/my-list",
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/places") {
      return (
        pathname === "/places" ||
        pathname.startsWith("/places/")
      );
    }

    if (href === "/products") {
      return (
        pathname === "/products" ||
        pathname.startsWith("/products/")
      );
    }

    if (href === "/articles") {
      return (
        pathname === "/articles" ||
        pathname.startsWith("/articles/")
      );
    }

    if (href === "/my-list") {
      return (
        pathname === "/my-list" ||
        pathname.startsWith("/my-list/")
      );
    }

    return pathname === href;
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link
            href="/"
            className="site-header__logo"
            onClick={closeMenu}
          >
            TOKYO GUIDE
          </Link>

          <nav className="site-header__desktop-nav">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-header__nav-link ${
                    active
                      ? "site-header__nav-link--active"
                      : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className={`site-header__menu-button ${
              menuOpen
                ? "site-header__menu-button--open"
                : ""
            }`}
            aria-label={
              menuOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen((value) => !value)
            }
          >
            <span />
            <span />
          </button>
        </div>

        <div
          className={`site-header__mobile-menu ${
            menuOpen
              ? "site-header__mobile-menu--open"
              : ""
          }`}
        >
          <nav className="site-header__mobile-nav">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`site-header__mobile-link ${
                    active
                      ? "site-header__mobile-link--active"
                      : ""
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="site-header__mobile-arrow">
                    →
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <style jsx global>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: rgba(250, 248, 246, 0.96);
          border-bottom: 1px solid #e7e0dc;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .site-header__inner {
          width: 100%;
          max-width: 1180px;
          height: 72px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .site-header__logo {
          color: #222;
          text-decoration: none;
          font-family: Georgia, serif;
          font-size: 16px;
          letter-spacing: 2.5px;
          white-space: nowrap;
        }

        .site-header__desktop-nav {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .site-header__nav-link {
          position: relative;
          display: flex;
          align-items: center;
          height: 72px;
          color: #777;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.8px;
          white-space: nowrap;
          transition:
            color 0.2s ease,
            opacity 0.2s ease;
        }

        .site-header__nav-link:hover {
          color: #222;
        }

        .site-header__nav-link--active {
          color: #222;
        }

        .site-header__nav-link--active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 19px;
          height: 1px;
          background: #c8647b;
        }

        .site-header__menu-button {
          display: none;
          position: relative;
          width: 42px;
          height: 42px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .site-header__menu-button span {
          position: absolute;
          left: 10px;
          width: 22px;
          height: 1px;
          background: #222;
          transition:
            transform 0.2s ease,
            top 0.2s ease;
        }

        .site-header__menu-button span:first-child {
          top: 16px;
        }

        .site-header__menu-button span:last-child {
          top: 25px;
        }

        .site-header__menu-button--open
          span:first-child {
          top: 21px;
          transform: rotate(45deg);
        }

        .site-header__menu-button--open
          span:last-child {
          top: 21px;
          transform: rotate(-45deg);
        }

        .site-header__mobile-menu {
          display: none;
        }

        @media (max-width: 700px) {
          .site-header__inner {
            height: 64px;
            padding: 0 18px;
          }

          .site-header__desktop-nav {
            display: none;
          }

          .site-header__menu-button {
            display: block;
          }

          .site-header__nav-link {
            height: 64px;
          }

          .site-header__mobile-menu {
            display: block;
            max-height: 0;
            overflow: hidden;
            border-top: 0 solid #e7e0dc;
            transition:
              max-height 0.25s ease,
              border-top-width 0.25s ease;
          }

          .site-header__mobile-menu--open {
            max-height: 400px;
            border-top-width: 1px;
          }

          .site-header__mobile-nav {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
            padding: 4px 18px 18px;
          }

          .site-header__mobile-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 19px 0;
            border-bottom: 1px solid #e7e0dc;
            color: #666;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
          }

          .site-header__mobile-link:last-child {
            border-bottom: 0;
          }

          .site-header__mobile-link--active {
            color: #c8647b;
          }

          .site-header__mobile-arrow {
            color: #aaa;
            font-size: 15px;
            font-weight: 400;
          }
        }

        @media (min-width: 701px) and (max-width: 900px) {
          .site-header__desktop-nav {
            gap: 18px;
          }

          .site-header__nav-link {
            font-size: 10px;
            letter-spacing: 1.4px;
          }

          .site-header__inner {
            padding: 0 18px;
          }
        }
      `}</style>
    </>
  );
}