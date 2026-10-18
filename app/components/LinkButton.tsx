"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassNames, type ButtonClassNameOptions } from "sonahang-ui";

// A link that looks like a Button. Client-only because sonahang-ui's helpers are,
// which keeps server-rendered pages (like the homepage) free to use it.
export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & Pick<ButtonClassNameOptions, "variant" | "size">) {
  return <Link className={buttonClassNames({ variant, size, className })} {...props} />;
}
