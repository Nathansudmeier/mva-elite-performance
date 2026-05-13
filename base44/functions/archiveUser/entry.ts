import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, action } = await req.json();

  if (!userId || !action) {
    return Response.json({ error: 'userId en action zijn verplicht' }, { status: 400 });
  }

  if (action === 'archive') {
    const targetUser = await base44.asServiceRole.entities.User.get(userId);
    // Save original role before overwriting
    await base44.asServiceRole.entities.User.update(userId, {
      archived: true,
      role_before_archive: targetUser.role || 'user',
      role: 'archived'
    });
    return Response.json({ success: true });
  }

  if (action === 'unarchive') {
    const targetUser = await base44.asServiceRole.entities.User.get(userId);
    const originalRole = targetUser.role_before_archive || 'user';
    await base44.asServiceRole.entities.User.update(userId, {
      archived: false,
      role: originalRole,
      role_before_archive: null
    });
    return Response.json({ success: true });
  }

  if (action === 'delete') {
    // Only allow deleting archived users
    const targetUser = await base44.asServiceRole.entities.User.get(userId);
    if (!targetUser?.archived) {
      return Response.json({ error: 'Alleen gearchiveerde accounts kunnen verwijderd worden' }, { status: 400 });
    }
    await base44.asServiceRole.entities.User.delete(userId);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
});