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
    // Trigger scroll check on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <NavbarContext.Provider value={{ isScrolled }}>
      <header
        className={cn(
          "fixed top-3 left-0 right-0 w-full z-50 px-4 sm:px-6",
          className
        )}
      >
        {children}
      </header>
    </NavbarContext.Provider>
  );
};

export const NavBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isScrolled } = useContext(NavbarContext);

  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between mx-auto transition-[background-color,border-color,box-shadow] duration-300 ease-in-out border px-8 py-3.5 rounded-full max-w-6xl w-full",
        isScrolled
          ? "bg-zinc-950/80 backdrop-blur-2xl border-[#F45D9B]/35 shadow-[0_10px_30px_rgba(244,93,155,0.15)] bg-gradient-to-r from-zinc-950/80 via-[#F45D9B]/10 to-zinc-950/80"
          : "bg-transparent border-transparent shadow-none",
        className
      )}
    >
      {children}
    </div>
  );
};

export const NavbarLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2 cursor-pointer group select-none", className)}>
      <Ghost className="w-5 h-5 text-[#F45D9B] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
      <span className="text-lg font-bold tracking-tight text-white/95">
        OtherHalff
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
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F45D9B] group-hover:w-full transition-all duration-300" />
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
        "text-xs sm:text-sm font-bold px-5 py-3 sm:px-6 rounded-full transition-all duration-300 active:scale-[0.96] select-none cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.2)]",
        variant === "primary"
          ? "bg-white text-gray-950 hover:bg-white/95 hover:shadow-[0_8px_20px_rgba(255,255,255,0.15)]"
          : "bg-white/10 text-white hover:bg-white/15 border border-white/10 hover:border-white/20",
        className
      )}
    >
      {children}
    </button>
  );
};

export const MobileNav = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isScrolled } = useContext(NavbarContext);

  return (
    <div
      className={cn(
        "md:hidden flex flex-col mx-auto transition-[background-color,border-color,box-shadow] duration-300 ease-in-out border rounded-full w-full max-w-[92%] px-5 py-3 relative",
        isScrolled
          ? "bg-zinc-950/85 backdrop-blur-2xl border-[#F45D9B]/35 shadow-[0_10px_30px_rgba(244,93,155,0.15)] bg-gradient-to-r from-zinc-950/85 via-[#F45D9B]/10 to-zinc-950/85"
          : "bg-transparent border-transparent shadow-none",
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
        "p-2.5 text-white/80 hover:text-white active:scale-95 rounded-full bg-white/5 border border-white/10 transition-all cursor-pointer select-none",
        className
      )}
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
        "absolute top-full left-0 right-0 mt-3 w-full bg-zinc-950/95 backdrop-blur-3xl border border-[#F45D9B]/30 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_20px_50px_rgba(244,93,155,0.2)] z-50 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-5",
        className
      )}
    >
      {children}
    </div>
  );
};
