import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Text } from "sonahang-ui";
import {
  DownloadIcon,
  GitHubIcon,
  InfoIcon,
  LockIcon,
  MoonIcon,
  MusicIcon,
  OfflineIcon,
  PhoneIcon,
  ServerIcon,
} from "./components/icons";
import { ThemeMenu } from "./components/layout/ThemeMenu";
import { LinkButton } from "./components/LinkButton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import packageJson from "@/package.json";

const GITHUB_URL = "https://github.com/sonangrai/sonmic";

// Read from package.json so the page always shows the version that was built.
const VERSION = packageJson.version;
import "./home.css";

// The root layout's title template doesn't apply to its own segment, so this is the full title.
export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

// "Start" enters the app; /player's gate then routes to setup or login when needed.
const START_HREF = "/player";

const features: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <DownloadIcon />,
    title: "Save from YouTube",
    body: "Paste a YouTube link and sonmic saves just the audio. No video, no ads.",
  },
  {
    icon: <OfflineIcon />,
    title: "Listen offline",
    body: "Saved tracks live on your device, so they play on a plane, underground or with your data off.",
  },
  {
    icon: <PhoneIcon />,
    title: "Install it like an app",
    body: "Add sonmic to your phone's home screen or your computer's dock. It opens full screen, like any app.",
  },
  {
    icon: <ServerIcon />,
    title: "Runs on your own computer",
    body: "Downloads go through a small server you run at home, not someone else's service.",
  },
  {
    icon: <LockIcon />,
    title: "Family accounts",
    body: "Everyone gets their own login, and only people you've added can download.",
  },
  {
    icon: <MoonIcon />,
    title: "Light or dark",
    body: "Follows your device's setting, or pick the look you like.",
  },
];

const disclaimers: ReactNode[] = [
  "sonmic is an independent personal project. It isn't affiliated with, endorsed by or connected to YouTube or Google.",
  <>
    YouTube&apos;s{" "}
    <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">
      Terms of Service
    </a>{" "}
    don&apos;t allow downloading content unless YouTube shows a download option for it, or you
    have permission from YouTube and the rights holder.
  </>,
  "Only save audio you have the right to keep, such as your own uploads, content licensed for reuse (like Creative Commons), or content you have permission for.",
  "Saved audio is for your own private listening. Don't share, upload, sell or publicly play it.",
  "You're responsible for how you use sonmic and for following YouTube's terms and copyright law where you live.",
];

const steps: { title: string; body: ReactNode }[] = [
  {
    title: "Set up the home computer",
    body: (
      <>
        Install the <a href="#requirements">requirements</a>, then add this site&apos;s address
        to <code>ALLOWED_ORIGINS</code> in <code>backend/.env</code>.
      </>
    ),
  },
  {
    title: "Create family accounts",
    body: (
      <>
        Run <code>pnpm user add &lt;name&gt;</code> for each person and choose their password.{" "}
        <code>pnpm user list</code> shows everyone, and <code>pnpm user remove &lt;name&gt;</code>{" "}
        takes someone off.
      </>
    ),
  },
  {
    title: "Start the backend",
    body: (
      <>
        Run <code>pnpm backend</code>. It prints an address to share with the family. The
        address changes each time it starts.
      </>
    ),
  },
  {
    title: "Connect and log in",
    body: "Tap Start, paste that address, and log in with the account made for you.",
  },
  {
    title: "Add music and play",
    body: "Paste a YouTube link to save the audio. It stays on your device to play any time.",
  },
];

const requirements: { title: string; items: ReactNode[] }[] = [
  {
    title: "Home computer (runs the backend)",
    items: [
      "A Mac that stays on and awake while downloading. The start script uses macOS tools.",
      <>
        Node.js 20.9 or newer and pnpm 10. yt-dlp also uses Node to read YouTube.
      </>,
      <>
        Python 3.10 or newer with the backend packages (FastAPI, Uvicorn, yt-dlp):{" "}
        <code>pip install -r backend/requirements.txt</code>
      </>,
      <>
        cloudflared, for the public address: <code>brew install cloudflared</code>
      </>,
      "An internet connection.",
    ],
  },
  {
    title: "Each family device",
    items: [
      "A recent browser: Chrome, Edge, Safari or Firefox.",
      "Free storage space for the audio you save.",
      "The backend address and an account from whoever runs the home computer.",
      "Optional: install sonmic from the browser (Add to Home Screen, or the install icon).",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="home">
      <nav className="home-nav" aria-label="Main">
        <Link href="/" className="home-brand">
          <span className="home-logo">
            <MusicIcon />
          </span>
          <Text as="span" variant="body-lg" weight="bold">
            sonmic
          </Text>
        </Link>
        <LinkButton
          href={GITHUB_URL}
          variant="icon"
          target="_blank"
          rel="noreferrer"
          aria-label="sonmic on GitHub"
        >
          <GitHubIcon size={20} />
        </LinkButton>
        <ThemeMenu />
        <LinkButton href={START_HREF} variant="secondary" size="sm">
          Start
        </LinkButton>
      </nav>

      <main>
        <section className="home-hero">
          <span className="home-hero-logo" aria-hidden>
            <MusicIcon />
          </span>
          <span className="home-version">Version {VERSION}</span>
          <h1 className="home-title">Your music, saved for offline.</h1>
          <Text variant="body-lg" color="subtle" className="home-lede">
            sonmic turns YouTube links into audio you keep on your own devices.
            Built for the family, running on your own computer.
          </Text>
          <div className="home-actions">
            <LinkButton href={START_HREF} size="lg">
              Start
            </LinkButton>
            <LinkButton href="#how-it-works" variant="ghost" size="lg">
              How it works
            </LinkButton>
          </div>
        </section>

        <section className="home-section" aria-labelledby="features-heading">
          <Text
            as="h2"
            id="features-heading"
            variant="heading-2"
            className="home-section-title"
          >
            What sonmic can do
          </Text>
          <ul className="home-features">
            {features.map((feature) => (
              <li key={feature.title} className="home-feature">
                <span className="home-feature-icon" aria-hidden>
                  {feature.icon}
                </span>
                <Text as="h3" variant="heading-4">
                  {feature.title}
                </Text>
                <Text variant="body-sm" color="subtle">
                  {feature.body}
                </Text>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="how-it-works"
          className="home-section"
          aria-labelledby="steps-heading"
        >
          <Text
            as="h2"
            id="steps-heading"
            variant="heading-2"
            className="home-section-title"
          >
            How it works
          </Text>
          <ol className="home-steps">
            {steps.map((step, i) => (
              <li key={step.title} className="home-step">
                <span className="home-step-number" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <Text as="h3" variant="heading-4">
                    {step.title}
                  </Text>
                  <Text variant="body-sm" color="subtle">
                    {step.body}
                  </Text>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="requirements"
          className="home-section"
          aria-labelledby="requirements-heading"
        >
          <Text
            as="h2"
            id="requirements-heading"
            variant="heading-2"
            className="home-section-title"
          >
            Requirements
          </Text>
          <div className="home-requirements">
            {requirements.map((group) => (
              <div key={group.title} className="home-feature">
                <Text as="h3" variant="heading-4">
                  {group.title}
                </Text>
                <ul className="home-requirement-list">
                  {group.items.map((item, i) => (
                    <li key={i}>
                      <Text as="span" variant="body-sm" color="subtle">
                        {item}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section" aria-labelledby="disclaimer-heading">
          <div className="home-disclaimer">
            <span className="home-disclaimer-icon" aria-hidden>
              <InfoIcon />
            </span>
            <div className="home-disclaimer-body">
              <Text as="h2" id="disclaimer-heading" variant="heading-4">
                Personal use only
              </Text>
              <ul>
                {disclaimers.map((item, i) => (
                  <li key={i}>
                    <Text as="span" variant="body-sm" color="subtle">
                      {item}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <Text as="h2" variant="heading-2">
            Ready to listen?
          </Text>
          <LinkButton href={START_HREF} size="lg">
            Start
          </LinkButton>
        </section>
      </main>

      <footer className="home-footer">
        <Text variant="caption" color="subtle">
          sonmic v{VERSION} · made for family listening · UI built with{" "}
          <a
            href="https://ui.sonahangrai.com.np"
            target="_blank"
            rel="noreferrer"
          >
            sonahang-ui
          </a>{" "}
          ·{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="home-footer-github">
            <GitHubIcon size={14} />
            GitHub
          </a>
        </Text>
      </footer>
    </div>
  );
}
