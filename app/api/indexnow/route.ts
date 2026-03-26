// app/api/indexnow/route.ts
export async function POST(req: Request) {
  const { url } = await req.json();
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host:    "www.isaacpaha.com",
      key:     process.env.INDEXNOW_KEY,
      urlList: [url],
    }),
  });
  return Response.json({ ok: true });
}