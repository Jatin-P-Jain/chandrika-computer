"use client";

import React, { ComponentProps } from "react";
import Link from "next/link";
import { useNavigationLock } from "@/context/navigation-lock-provider";

interface SafeLinkProps extends ComponentProps<typeof Link> {
  children: React.ReactNode;
  disableWhileNavigating?: boolean;
}

export const SafeLink = React.forwardRef<HTMLAnchorElement, SafeLinkProps>(
  (
    { href, onClick, children, disableWhileNavigating = true, ...props },
    ref,
  ) => {
    const { isNavigating, lock } = useNavigationLock();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call original onClick if provided
      if (onClick) {
        onClick(e);
      }

      // Don't lock for special click types
      const isModifiedClick =
        e.metaKey || // Cmd on Mac
        e.ctrlKey || // Ctrl on Windows/Linux
        e.shiftKey ||
        e.button !== 0; // Not a left click

      if (isModifiedClick) {
        return;
      }

      // Don't lock for non-self targets
      const target = (e.currentTarget as HTMLAnchorElement).target;
      if (target && target !== "_self") {
        return;
      }

      // Don't lock for external protocols
      const hrefStr = String(href);
      if (
        hrefStr.startsWith("http://") ||
        hrefStr.startsWith("https://") ||
        hrefStr.startsWith("mailto:") ||
        hrefStr.startsWith("tel:") ||
        hrefStr.startsWith("#")
      ) {
        return;
      }

      // Avoid locking when destination is effectively current route.
      // This prevents controls from appearing disabled for the failsafe duration.
      try {
        const currentUrl = new URL(window.location.href);
        const destinationUrl = new URL(
          (e.currentTarget as HTMLAnchorElement).href,
          window.location.href,
        );

        if (
          currentUrl.pathname === destinationUrl.pathname &&
          currentUrl.search === destinationUrl.search
        ) {
          return;
        }
      } catch {
        // If URL parsing fails, continue with existing lock behavior.
      }

      // Lock for in-app navigation
      lock();
    };

    return (
      <Link
        ref={ref}
        href={href}
        onClick={handleClick}
        aria-disabled={disableWhileNavigating && isNavigating}
        style={{
          pointerEvents:
            disableWhileNavigating && isNavigating ? "none" : "auto",
          opacity: disableWhileNavigating && isNavigating ? 0.8 : 1,
          transition: "opacity 150ms ease-out",
        }}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

SafeLink.displayName = "SafeLink";
