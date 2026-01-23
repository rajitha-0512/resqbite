import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
  xl: "text-8xl",
};

const iconSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

export const Logo = ({ size = "md", animated = false }: LogoProps) => {
  if (animated) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className={`${iconSizes[size]} bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <span className={`${sizeClasses[size]} filter drop-shadow-md`}>🍽️</span>
        </motion.div>
        <motion.span
          className={`${sizeClasses[size]} font-bold text-gradient-primary`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          ResQBite
        </motion.span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${iconSizes[size]} bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg`}
      >
        <span className={`${sizeClasses[size]} filter drop-shadow-md`}>🍽️</span>
      </div>
      <span className={`${sizeClasses[size]} font-bold text-gradient-primary`}>
        ResQBite
      </span>
    </div>
  );
};
