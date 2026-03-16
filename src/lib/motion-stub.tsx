/**
 * Lightweight drop-in replacement for framer-motion.
 * Renders plain HTML elements with zero animation overhead.
 * Import this instead of framer-motion in page components for instant loading.
 *
 * Usage: import { motion, AnimatePresence } from "@/lib/motion-stub";
 */
import React, { forwardRef } from "react";

// Strip all motion-specific props and render a plain element
function createMotionComponent<T extends keyof JSX.IntrinsicElements>(tag: T) {
  return forwardRef<any, any>(
    (
      {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        whileInView,
        whileFocus,
        whileDrag,
        layout,
        layoutId,
        variants,
        onAnimationStart,
        onAnimationComplete,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        onDragStart,
        onDragEnd,
        onDrag,
        style: styleProp,
        ...props
      }: any,
      ref
    ) => {
      // Filter out any remaining motion-specific props
      return React.createElement(tag, { ...props, ref, style: styleProp });
    }
  );
}

export const motion = {
  div: createMotionComponent("div"),
  span: createMotionComponent("span"),
  p: createMotionComponent("p"),
  a: createMotionComponent("a"),
  button: createMotionComponent("button"),
  section: createMotionComponent("section"),
  article: createMotionComponent("article"),
  header: createMotionComponent("header"),
  footer: createMotionComponent("footer"),
  nav: createMotionComponent("nav"),
  main: createMotionComponent("main"),
  ul: createMotionComponent("ul"),
  li: createMotionComponent("li"),
  img: createMotionComponent("img"),
  h1: createMotionComponent("h1"),
  h2: createMotionComponent("h2"),
  h3: createMotionComponent("h3"),
  h4: createMotionComponent("h4"),
  label: createMotionComponent("label"),
  form: createMotionComponent("form"),
  input: createMotionComponent("input"),
  textarea: createMotionComponent("textarea"),
  svg: createMotionComponent("svg"),
  path: createMotionComponent("path"),
  circle: createMotionComponent("circle"),
  tr: createMotionComponent("tr"),
  td: createMotionComponent("td"),
};

// AnimatePresence stub — just renders children
export function AnimatePresence({
  children,
  mode,
  onExitComplete,
}: {
  children: React.ReactNode;
  mode?: string;
  onExitComplete?: () => void;
  initial?: boolean;
}) {
  return <>{children}</>;
}

// Re-export hooks as no-ops
export function useScroll(..._args: any[]) {
  return { scrollY: { get: () => 0, on: () => () => {} }, scrollYProgress: { get: () => 0, on: () => () => {} } };
}
export function useTransform(..._args: any[]) {
  return 0;
}
export function useInView(..._args: any[]) {
  return true;
}
export function useMotionValue(initial: number = 0) {
  return { get: () => initial, set: (..._a: any[]) => {}, on: () => () => {} };
}
export function useSpring(..._args: any[]) {
  return _args[0] ?? 0;
}
export function useAnimation() {
  return { start: () => Promise.resolve(), stop: () => {} };
}
