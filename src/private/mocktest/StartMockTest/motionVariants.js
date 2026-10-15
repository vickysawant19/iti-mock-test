// Centralized Framer Motion spring presets and variants for Mock Test CBT components

export const springSnappy = {
  type: "spring",
  stiffness: 420,
  damping: 28,
  mass: 0.8,
};

export const springSmooth = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

// Directional slide for Question switching (+1 = Next, -1 = Prev)
export const questionSlideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 45 : -45,
    opacity: 0,
    scale: 0.99,
    filter: "blur(3px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      x: springSnappy,
      opacity: { duration: 0.18 },
      filter: { duration: 0.15 },
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? -45 : 45,
    opacity: 0,
    scale: 0.99,
    filter: "blur(3px)",
    transition: {
      x: { type: "tween", duration: 0.14, ease: "easeIn" },
      opacity: { duration: 0.12 },
    },
  }),
};

// Staggered container for MCQ options
export const optionsListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

// Individual MCQ option item entrance
export const optionCardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy,
  },
};

// Staggered entrance for MockTestGreet cards
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: springSmooth },
};
