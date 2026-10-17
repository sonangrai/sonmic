import Link from "next/link";
import { Button, Input, Text, buttonClassNames } from "sonahang-ui";
import { HomeIcon, MicIcon, SearchIcon } from "../icons";
import "./header.css";

type HeaderProps = {
  /** Shows the search box when given; the parent owns the query. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Shows the "Add audio" button when given. */
  onAdd?: () => void;
};

export function Header({ search, onAdd }: HeaderProps) {
  return (
    <header className="app-header">
      <Link href="/player" className="app-header-brand">
        <span className="app-header-logo">
          <MicIcon />
        </span>
        <Text as="span" variant="body-lg" weight="bold" className="app-header-name">
          sonmic
        </Text>
      </Link>

      <Link href="/player" className={buttonClassNames({ variant: "icon", className: "app-header-home" })}
        aria-label="Home">
        <HomeIcon />
      </Link>

      {search && (
        <Input
          className="app-header-search"
          type="search"
          aria-label="Search your library"
          placeholder={search.placeholder ?? "What do you want to play?"}
          icon={<SearchIcon />}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      )}

      {onAdd && (
        <Button variant="secondary" size="sm" className="app-header-add" onClick={onAdd}>
          Add audio
        </Button>
      )}
    </header>
  );
}
