import { motion } from "framer-motion";

interface LanguageToggleProps {
  language: "en" | "no";
  onToggle: () => void;
}

export const LanguageToggle = ({ language, onToggle }: LanguageToggleProps) => {
  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={onToggle}
        className="relative w-28 h-12 bg-card border-2 border-border rounded-full p-1 shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Toggle language"
      >
        <motion.div
          className="absolute top-1 h-9 w-12 bg-gradient-to-r from-primary to-primary-glow rounded-full shadow-md"
          animate={{
            left: language === "en" ? "4px" : "calc(100% - 52px)"
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
        <div className="relative flex items-center justify-between px-2 h-full text-sm font-semibold">
          <span className={language === "en" ? "text-white z-10" : "text-muted-foreground"}>
            EN
          </span>
          <span className={language === "no" ? "text-white z-10" : "text-muted-foreground"}>
            NO
          </span>
        </div>
      </button>
    </div>
  );
};
