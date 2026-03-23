import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active players
    const players = await base44.asServiceRole.entities.Player.filter({ active: true });
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Find agenda items within next 48 hours
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const in48hStr = in48h.toISOString().split("T")[0];

    const agendaItems = await base44.asServiceRole.entities.AgendaItem.list();
    const upcoming = agendaItems.filter(item => item.date >= todayStr && item.date <= in48hStr);

    if (upcoming.length === 0) {
      return Response.json({ message: "No upcoming items", notifications: 0 });
    }

    // Get all attendance records for these items
    const allAttendance = await base44.asServiceRole.entities.AgendaAttendance.list();

    let created = 0;

    for (const item of upcoming) {
      // Determine which players are relevant
      const relevantPlayers = item.team === "Beide"
        ? players
        : players.filter(p => {
            const user = allUsers.find(u => u.player_id === p.id || u.full_name === p.name);
            return true; // include all for simplicity, team filter by player team not available
          });

      for (const player of relevantPlayers) {
        const user = allUsers.find(u => u.full_name === player.name);
        if (!user?.email) continue;

        // Check if already responded
        const responded = allAttendance.find(a => a.agenda_item_id === item.id && a.player_id === player.id);
        if (responded) continue;

        // Check if reminder already sent today
        const todayStart = now.toISOString().split("T")[0];
        const existingReminder = await base44.asServiceRole.entities.Notification.filter({
          user_email: user.email,
          type: "herinnering",
          link: `/Planning?id=${item.id}`,
        });
        const sentToday = existingReminder.some(n => n.created_date?.startsWith(todayStart));
        if (sentToday) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          type: "herinnering",
          title: `Vergeet niet te reageren: ${item.title}`,
          body: `op ${item.date} om ${item.start_time}`,
          is_read: false,
          link: `/Planning?id=${item.id}`,
        });
        created++;
      }
    }

    return Response.json({ message: "Done", notifications: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});