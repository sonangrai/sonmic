"use client";

import { useState } from "react";
import { Button, Text } from "sonahang-ui";
import { logout } from "@/lib/api";
import { sessionSetting } from "@/lib/session";
import { useStoredSetting } from "@/lib/useStoredSetting";

export function AccountSettings() {
  const session = useStoredSetting(sessionSetting);
  const [pending, setPending] = useState(false);

  return (
    <>
      <Text variant="body-sm" color="subtle">
        Signed in as <strong>{session?.username}</strong>. Logging out doesn&apos;t remove audio
        saved on this device.
      </Text>
      <div className="settings-actions">
        {/* Clearing the session sends the app to /login on its own. */}
        <Button
          variant="secondary"
          loading={pending}
          onClick={() => {
            setPending(true);
            void logout();
          }}
        >
          Log out
        </Button>
      </div>
    </>
  );
}
