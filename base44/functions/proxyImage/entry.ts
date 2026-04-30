import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return Response.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") || "image/png";
  const arrayBuffer = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const dataUrl = `data:${contentType};base64,${base64}`;

  return Response.json({ dataUrl });
});