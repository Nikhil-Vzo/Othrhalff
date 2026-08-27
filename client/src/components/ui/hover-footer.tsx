"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextHoverEffect = ({
  text = "OTHRHALFF",
  prefix = "OTHR",
  suffix = "HALFF",
  duration,
  className,
}: {
  text?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const [isTouchOrMobile, setIsTouchOrMobile] = useState(false);

  // Desktop text (all caps bold)
  let firstPart = prefix;
  let secondPart = suffix;
  if (text.toUpperCase() === "OTHRHALFF") {
    firstPart = "OTHR";
    secondPart = "HALFF";
  }

  // Mobile script text in signature Geraldine font styling
  const mobileFirstPart = "Othr";
  const mobileSecondPart = "Halff";

  // Detect mobile or touch screen
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const isTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
        setIsTouchOrMobile(isTouch);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isTouchOrMobile && svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor, isTouchOrMobile]);

  // ── MOBILE VIEW: Rendered with custom 'Geraldine' signature font + dual brand colors ──
  if (isTouchOrMobile) {
    return (
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 540 130"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("select-none overflow-visible", className)}
      >
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "'Geraldine', cursive, sans-serif",
            fontSize: "92px",
            fontWeight: "normal",
            letterSpacing: "0.02em",
          }}
        >
          {/* Othr in Crisp Solid White in Geraldine Script */}
          <tspan
            fill="#FFFFFF"
            style={{
              filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.75))",
            }}
          >
            {mobileFirstPart}
          </tspan>

          {/* Halff in Signature Hot Pink in Geraldine Script */}
          <tspan
            fill="#F45D9B"
            style={{
              filter: "drop-shadow(0 0 16px rgba(244, 93, 155, 0.95)) drop-shadow(0 0 28px rgba(255, 46, 147, 0.6))",
            }}
          >
            {mobileSecondPart}
          </tspan>
        </text>
      </svg>
    );
  }

  // ── DESKTOP VIEW: Seamless, unclipped spotlight hover with dual-tone glow ──
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 560 110"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none uppercase cursor-pointer overflow-visible", className)}
    >
      <defs>
        {/* Soft Ambient Filters with wide bounding box to eliminate any box clipping */}
        <filter id="neonPinkGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Seamless Radial Spotlight Mask */}
        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="36%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="35%" stopColor="white" stopOpacity="0.9" />
          <stop offset="65%" stopColor="white" stopOpacity="0.45" />
          <stop offset="85%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </motion.radialGradient>

        {/* Global Mask with large canvas coverage and explicit userSpaceOnUse units */}
        <mask
          id="textMask"
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x="-300"
          y="-300"
          width="1200"
          height="800"
        >
          <rect
            x="-300"
            y="-300"
            width="1200"
            height="800"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* ── 1. BASE OUTLINE LAYER (Unhovered state) ── */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        strokeWidth="0.8"
        className="font-sans font-black"
        style={{
          fontSize: "72px",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <tspan
          fill="rgba(255, 255, 255, 0.03)"
          stroke="rgba(255, 255, 255, 0.28)"
          className="transition-colors duration-300"
        >
          {firstPart}
        </tspan>
        <tspan
          fill="rgba(244, 93, 155, 0.05)"
          stroke="rgba(244, 93, 155, 0.5)"
          className="transition-colors duration-300"
        >
          {secondPart}
        </tspan>
      </text>

      {/* ── 2. NEON DASH ANIMATION LAYER ── */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        strokeWidth="0.85"
        className="font-sans font-black"
        style={{
          fontSize: "72px",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        initial={{ strokeDashoffset: 1200, strokeDasharray: 1200 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1200,
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
        }}
      >
        <tspan
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
        >
          {firstPart}
        </tspan>
        <tspan
          fill="none"
          stroke="#F45D9B"
          filter="url(#neonPinkGlow)"
        >
          {secondPart}
        </tspan>
      </motion.text>

      {/* ── 3. INTERACTIVE SPOTLIGHT REVEAL (Pure White + Hot Pink with zero box clipping) ── */}
      <g mask="url(#textMask)">
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-sans font-black"
          style={{
            fontSize: "72px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* OTHR: Solid Pure White with clean luminous stroke & fill */}
          <tspan
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="0.4"
          >
            {firstPart}
          </tspan>

          {/* HALFF: Solid Hot Pink with vibrant neon pink stroke & fill */}
          <tspan
            fill="#F45D9B"
            stroke="#F45D9B"
            strokeWidth="0.4"
          >
            {secondPart}
          </tspan>
        </text>
      </g>
    </svg>
  );
};

export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, rgba(11, 5, 20, 0.7) 40%, rgba(244, 93, 155, 0.15) 85%, rgba(192, 132, 252, 0.08) 100%)",
      }}
    />
  );
};
