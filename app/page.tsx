import { Button, Tag, Text } from "sonahang-ui";

export default function Home() {
  return (
    <main className="page">
      <Tag>Next.js + sonahang-ui</Tag>
      <Text variant="display">sonmic</Text>
      <Text variant="body-lg" color="subtle">
        Edit <code>app/page.tsx</code> to get started.
      </Text>
      <div className="actions">
        <Button>Get started</Button>
        <Button variant="secondary">Learn more</Button>
      </div>
    </main>
  );
}
