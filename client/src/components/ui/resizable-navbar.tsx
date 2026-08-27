"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Ghost, Menu, X } from "lucide-react";

const NavbarContext = createContext({
  isScrolled: false,
});

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

export const Navbar = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <NavbarContext.Provider value={{ isScrolled }}>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-black/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent shadow-none",
          className
        )}
      >
        {children}
      </header>
    </NavbarContext.Provider>
  );
};

export const NavBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between mx-auto max-w-7xl w-full px-6 sm:px-8 py-4 sm:py-5",
        className
      )}
    >
      {children}
    </div>
  );
};

export const NavbarLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2.5 cursor-pointer group select-none", className)}>
      <Ghost className="w-6 h-6 text-[#F45D9B] drop-shadow-[0_0_10px_rgba(244,93,155,0.6)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
      <span className="text-xl font-black tracking-tight text-white">
        Othr<span className="text-[#F45D9B]">Halff</span>
      </span>
    </div>
  );
};

export const NavItems = ({
  items,
  className,
}: {
  items: Array<{ name: string; link: string }>;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center gap-8 text-[14px] font-semibold text-white/80 tracking-normal", className)}>
      {items.map((item, idx) => (
        <a
          key={`nav-item-${idx}`}
          href={item.link}
          className="hover:text-white transition-colors relative group py-1"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          {item.name}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F45D9B] group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_#F45D9B]" />
        </a>
      ))}
    </div>
  );
};

export const NavbarButton = ({
  children,
  onClick,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-300 active:scale-[0.96] select-none cursor-pointer",
        variant === "primary"
          ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          : "bg-transparent text-white/80 hover:text-white hover:bg-white/10",
        className
      )}
    >
      {children}
    </button>
  );
};

export const MobileNav = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "md:hidden flex flex-col w-full px-5 py-4 relative",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {children}
    </div>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
  className,
}: {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 text-white/80 hover:text-white active:scale-95 rounded-full bg-white/5 border border-white/10 transition-all cursor-pointer select-none",
        className
      )}
      aria-label="Toggle navigation menu"
    >
      {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
};

export const MobileNavMenu = ({
  isOpen,
  onClose,
  children,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-2 mx-4 bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-50 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-4",
        className
      )}
    >
      {children}
    </div>
  );
};
