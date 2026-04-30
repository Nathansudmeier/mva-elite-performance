import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET");

  if (!cloudName || !uploadPreset) {
    return Response.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  // Geef de client de benodigde config terug zodat hij direct kan uploaden
  return Response.json({ cloudName, uploadPreset });
});