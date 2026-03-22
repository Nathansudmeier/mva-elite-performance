import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "check_reminders";

    // ── ACTION: send_absentee_notification ──
    // Called when a player marks themselves absent
    if (action === "send_absentee_notification") {
      const { player_name, item_type, item_title, item_date, reason, sender_email } = body;

      // Get all trainers/admins
      const allUsers = await base44.asServiceRole.entities.User.list();
      const trainers = allUsers.filter(u => u.role === "trainer" || u.role === "admin");

      const dateStr = new Date(item_date + "T00:00:00").toLocaleDateString("nl-NL", {
        weekday: "long", day: "numeric", month: "long"
      });

      const firstName = player_name ? player_name.split(" ")[0] : player_name;
      const reasonText = reason ? reason : "Geen reden opgegeven";
      const subject = `${firstName} heeft zich afgemeld voor ${item_title}`;
      const bodyText = `${firstName} heeft zich afgemeld voor ${item_type}: ${item_title} op ${dateStr}.\n\nReden: ${reasonText}\n\nBekijk het overzicht in de app.`;

      for (const trainer of trainers) {
        if (trainer.email && trainer.email !== sender_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: trainer.email,
            subject,
            body: bodyText,
          });
        }
      }

      return Response.json({ ok: true, sent: trainers.length });
    }

    // ── ACTION: check_reminders (scheduled daily) ──
    if (action === "check_reminders") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const agendaItems = await base44.asServiceRole.entities.AgendaItem.list();
      const players = await base44.asServiceRole.entities.Player.filter({ active: true });
      const allAttendance = await base44.asServiceRole.entities.AgendaAttendance.list();

      let remindersSent = 0;

      for (const item of agendaItems) {
        if (!item.date) continue;
        const itemDate = new Date(item.date + "T00:00:00");
        if (itemDate <= today) continue; // past items

        const daysUntil = Math.round((itemDate - today) / (1000 * 60 * 60 * 24));

        const respondedIds = new Set(
          allAttendance.filter(a => a.agenda_item_id === item.id).map(a => a.player_id)
        );
        const notRespondedPlayers = players.filter(p => !respondedIds.has(p.id));

        const dateStr = itemDate.toLocaleDateString("nl-NL", {
          weekday: "long", day: "numeric", month: "long"
        });

        // Check reminder 1
        const r1Days = item.reminder_1_days ?? 3;
        if (r1Days > 0 && daysUntil === r1Days && !item.reminder_1_sent) {
          for (const player of notRespondedPlayers) {
            if (player.email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: player.email,
                subject: `Vergeet niet te reageren op ${item.title}`,
                body: `Vergeet niet te reageren op ${item.type}: ${item.title} op ${dateStr}. Je hebt nog ${daysUntil} dag(en).`,
              });
              remindersSent++;
            }
          }
          await base44.asServiceRole.entities.AgendaItem.update(item.id, { reminder_1_sent: true });
        }

        // Check reminder 2
        const r2Days = item.reminder_2_days ?? 1;
        if (r2Days > 0 && daysUntil === r2Days && !item.reminder_2_sent) {
          for (const player of notRespondedPlayers) {
            if (player.email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: player.email,
                subject: `Vergeet niet te reageren op ${item.title}`,
                body: `Vergeet niet te reageren op ${item.type}: ${item.title} op ${dateStr}. Je hebt nog ${daysUntil} dag(en).`,
              });
              remindersSent++;
            }
          }
          await base44.asServiceRole.entities.AgendaItem.update(item.id, { reminder_2_sent: true });
        }
      }

      return Response.json({ ok: true, remindersSent });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});