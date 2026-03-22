"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { useMagnetic } from "@/hooks/useGsap";
import clsx from "clsx";

export type ButtonVariant = "primary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  outline: "btn-outline",
};

// Inner button that accepts the magnetic ref
const ButtonInner = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "magnetic">
>(function ButtonInner(
  {
    variant = "primary",
    size = "md",
    loading,
    children,
    className,
    style,
    ...htmlProps
  },
  ref,
) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      style={{ display: "inline-block" }}
    >
      <button
        ref={ref}
        className={clsx(
          "btn",
          SIZE_CLASS[size],
          VARIANT_CLASS[variant],
          className,
        )}
        disabled={loading === true || htmlProps.disabled === true}
        {...(style ? { style } : {})}
        {...htmlProps}
      >
        {loading ? (
          <span className="btn-spinner" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    </motion.div>
  );
});

export default function Button({
  magnetic = false,
  ...props
}: Readonly<ButtonProps>) {
  const magnetRef = useMagnetic<HTMLButtonElement>(0.4);

  if (magnetic) {
    return <ButtonInner ref={magnetRef} {...props} />;
  }

  return <ButtonInner {...props} />;
}
