"use client";

import { useLayoutEffect } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  buttonClassNames,
} from "sonahang-ui";
import { applyTheme, setTheme, themeSetting, type Theme } from "@/lib/theme";
import { useStoredSetting } from "@/lib/useStoredSetting";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "../icons";

const options = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
] satisfies { value: Theme; label: string; Icon: typeof SunIcon }[];

export function ThemeMenu() {
  const theme = useStoredSetting(themeSetting);
  const active = options.find((o) => o.value === theme)!;

  // Keeps <html> in sync with changes from other tabs, and re-applies after
  // React's dev-mode remount clears the attribute the inline script set.
  useLayoutEffect(() => applyTheme(theme), [theme]);

  return (
    <Dropdown align="end">
      <DropdownTrigger
        className={buttonClassNames({ variant: "icon" })}
        aria-label={`Theme: ${active.label}`}
      >
        <active.Icon size={20} />
      </DropdownTrigger>
      <DropdownMenu>
        {options.map(({ value, label, Icon }) => (
          <DropdownItem
            key={value}
            icon={<Icon size={18} />}
            aria-current={value === theme || undefined}
            onSelect={() => setTheme(value)}
          >
            <span className="theme-option">
              {label}
              {value === theme && <CheckIcon size={16} />}
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
