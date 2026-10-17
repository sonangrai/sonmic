import { Text } from "sonahang-ui";
import { AudioDownloader } from "./components/AudioDownloader";

export default function Home() {
  return (
    <main className="page">
      <Text variant="display">sonmic</Text>
      <Text variant="body-lg" color="subtle">
        Paste a YouTube link to save its audio in your browser.
      </Text>
      <AudioDownloader />
    </main>
  );
}
