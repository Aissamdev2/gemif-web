"use client";

import { motion } from "framer-motion";
import React, { ReactNode } from "react";

interface LandingFramerProps {
  children: ReactNode;
  animation?: "fadeUp" | "fadeRight" | "fadeLeft" | "scaleIn";
  custom?: number;
}

export default function LandingFramer({ children, animation = "fadeUp", custom = 0 }: LandingFramerProps) {
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 30 },
      visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6 } }),
    },
    fadeRight: {
      hidden: { opacity: 0, x: -40 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
    },
    fadeLeft: {
      hidden: { opacity: 0, x: 40 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.98 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants[animation]}
      custom={custom}
    >
      {children}
    </motion.div>
  );
}
