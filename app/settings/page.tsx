import type { Metadata } from "next";
import { Text } from "sonahang-ui";
import { AccountSettings } from "../components/AccountSettings";
import { AuthGate } from "../components/AuthGate";
import { BackendSettings } from "../components/BackendSettings";
import { Header } from "../components/layout/Header";
import "./settings.css";

export const metadata: Metadata = {
  title: "Settings · sonmic",
};

export default function SettingsPage() {
  return (
    <AuthGate mode="app">
      <div className="settings-shell">
        <Header />

        <main className="settings-main">
          <div className="settings-content">
            <h1 className="settings-title">Settings</h1>

            <section
              className="settings-section"
              aria-labelledby="backend-heading"
            >
              <div className="settings-section-intro">
                <Text as="h2" id="backend-heading" variant="heading-4">
                  Backend server
                </Text>
                <Text variant="body-sm" color="subtle">
                  Where this device sends logins and downloads. Saved in this
                  browser only. Playing saved audio doesn&apos;t need it. Your
                  login stays valid when the address changes.
                </Text>
              </div>
              <BackendSettings />
            </section>

            <section
              className="settings-section"
              aria-labelledby="account-heading"
            >
              <Text as="h2" id="account-heading" variant="heading-4">
                Account
              </Text>
              <AccountSettings />
            </section>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
