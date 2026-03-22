import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if MVA Noord already exists
    const existingChats = await base44.asServiceRole.entities.Chat.filter({ name: "MVA Noord" });
    
    if (existingChats.length > 0) {
      return Response.json({ message: 'MVA Noord already exists' });
    }

    // Create permanent MVA Noord group chat
    const chat = await base44.asServiceRole.entities.Chat.create({
      name: "MVA Noord",
      is_group: true,
      is_permanent: true
    });

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Add all users to chat
    for (const chatUser of allUsers) {
      await base44.asServiceRole.entities.ChatMember.create({
        chat_id: chat.id,
        user_email: chatUser.email
      });
    }

    return Response.json({ success: true, chat_id: chat.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});