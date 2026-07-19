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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <NavbarContext.Provider value={{ isScrolled }}>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ease-in-out py-4 px-4 sm:px-6",
          isScrolled ? "top-2 sm:top-4" : "top-0",
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
        "hidden md:flex items-center justify-between mx-auto transition-all duration-500 ease-in-out border border-transparent",
        isScrolled
          ? "max-w-3xl bg-black/60 backdrop-blur-xl border-white/10 px-8 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          : "max-w-7xl px-4 py-2",
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
      <Ghost className="w-5 h-5 text-[#F45D9B] transition-transform duration-300" />
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
    <div className={cn("flex items-center gap-8 text-[13px] font-semibold text-white/90 tracking-normal", className)}>
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
        "text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
        variant === "primary"
          ? "bg-white text-gray-900 hover:bg-white/90"
          : "bg-white/5 text-white/95 border border-white/10 hover:border-white/20 hover:bg-white/10",
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
        "md:hidden flex flex-col mx-auto transition-all duration-500 ease-in-out border border-transparent w-full",
        isScrolled
          ? "bg-black/60 backdrop-blur-xl border-white/10 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] max-w-[95%]"
          : "px-4 py-2",
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
        "p-2 text-white/80 hover:text-white rounded-full bg-white/5 border border-white/10 transition-all",
        className
      )}
    >
      {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
        "absolute top-full left-0 right-0 mt-4 mx-auto w-[95%] bg-black/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-5",
        className
      )}
    >
      {children}
    </div>
  );
};
