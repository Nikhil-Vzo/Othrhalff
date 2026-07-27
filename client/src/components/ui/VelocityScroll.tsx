"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

interface VelocityScrollProps {
  text1?: React.ReactNode;
  text2?: React.ReactNode;
  default_velocity?: number;
  bar1ClassName?: string;
  bar2ClassName?: string;
  textClassName?: string;
}

interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity: number;
  className?: string;
}

export const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function ParallaxText({
  children,
  baseVelocity = 100,
  className,
}: ParallaxProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const [repetitions, setRepetitions] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const calculateRepetitions = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.offsetWidth;
        if (textWidth > 0) {
          const newRepetitions = Math.max(3, Math.ceil(containerWidth / textWidth) + 2);
          setRepetitions(newRepetitions);
        }
      }
    };

    calculateRepetitions();

    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [children]);

  const x = useTransform(baseX, (v) => `${wrap(-100 / repetitions, 0, v)}%`);

  const directionFactor = React.useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div
      className="w-full overflow-hidden whitespace-nowrap flex items-center select-none"
      ref={containerRef}
    >
      <motion.div className={cn("inline-block whitespace-nowrap will-change-transform", className)} style={{ x }}>
        {Array.from({ length: repetitions }).map((_, i) => (
          <span key={i} ref={i === 0 ? textRef : null} className="inline-block">
            {children}{" "}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function VelocityScroll({
  text1,
  text2,
  default_velocity = 3,
  bar1ClassName,
  bar2ClassName,
  textClassName,
}: VelocityScrollProps) {
  return (
    <section className="relative w-full flex flex-col select-none overflow-hidden">
      {/* 1st Bar */}
      <div className={cn("w-full h-[60px] sm:h-[80px] lg:h-[120px] flex items-center overflow-hidden whitespace-nowrap", bar1ClassName)}>
        <ParallaxText baseVelocity={default_velocity} className={textClassName}>
          {text1}
        </ParallaxText>
      </div>

      {/* 2nd Bar */}
      <div className={cn("w-full h-[60px] sm:h-[80px] lg:h-[120px] flex items-center overflow-hidden whitespace-nowrap", bar2ClassName)}>
        <ParallaxText baseVelocity={-default_velocity} className={textClassName}>
          {text2}
        </ParallaxText>
      </div>
    </section>
  );
}
