// app/(dashboard)/admin/[userId]/youtube-studio/page.tsx
// Server component — unwraps the async params Promise, then hands
// userId down to the client shell. No hooks here.

import YoutubeStudioClient from "./_youtube-studio/youtube-studio-client";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function YoutubeStudioPage({ params }: Props) {
  const { userId } = await params;
  return <YoutubeStudioClient userId={userId} />;
}