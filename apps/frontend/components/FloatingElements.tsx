"use client";

import { useEffect, useState } from "react";

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 6,
  className = "",
}) => {
  const [elements, setElements] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      opacity: number;
    }>
  >([]);

  useEffect(() => {
    const newElements = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setElements(newElements);
  }, [count]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {elements.map((element) => {
        const gradients = [
          "bg-gradient-to-br from-primary/20 to-secondary/20",
          "bg-gradient-to-br from-secondary/25 to-primary/15",
          "bg-gradient-to-br from-[color:var(--color-accent-coral)]/20 to-[color:var(--color-accent-peach)]/15",
          "bg-gradient-to-br from-[color:var(--color-accent-rose)]/15 to-[color:var(--color-accent-lavender)]/20",
          "bg-gradient-to-br from-[color:var(--color-accent-sunset)]/20 to-secondary/15",
          "bg-gradient-to-br from-primary/15 to-[color:var(--color-accent-coral)]/20",
        ];

        return (
          <div
            key={element.id}
            className={`absolute rounded-full ${gradients[element.id % gradients.length]} animate-float shadow-lg`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              animationDelay: `${element.delay}s`,
              animationDuration: `${element.duration}s`,
              opacity: element.opacity,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingElements;
