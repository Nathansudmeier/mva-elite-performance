import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { attendanceData } = await req.json();

    // attendanceData format: { playerName: { dateTime: 1/0, ... } }
    const players = await base44.asServiceRole.entities.Player.list();
    const agendaItems = await base44.asServiceRole.entities.AgendaItem.list();
    const agendaAttendance = await base44.asServiceRole.entities.AgendaAttendance.list();

    let created = 0;
    let skipped = 0;

    for (const [playerName, trainingSessions] of Object.entries(attendanceData)) {
      // Find player by name (case-insensitive match)
      const player = players.find(p => 
        p.name.toLowerCase() === playerName.toLowerCase()
      );

      if (!player) {
        console.log(`Player not found: ${playerName}`);
        continue;
      }

      for (const [dateTimeStr, status] of Object.entries(trainingSessions)) {
        // Skip if not 0 or 1
        if (status !== 0 && status !== 1) continue;

        // Parse datetime
        const [dateStr, timeStr] = dateTimeStr.split(' ');
        
        // Find matching agenda item (Training type, same date and time)
        const agendaItem = agendaItems.find(ai => 
          ai.type === 'Training' && 
          ai.date === dateStr && 
          ai.start_time === timeStr
        );

        if (!agendaItem) {
          console.log(`Agenda item not found for ${playerName} on ${dateTimeStr}`);
          continue;
        }

        // Check if attendance record already exists
        const existingRecord = agendaAttendance.find(aa => 
          aa.player_id === player.id && 
          aa.agenda_item_id === agendaItem.id
        );

        if (existingRecord) {
          skipped++;
          continue; // Skip if already exists
        }

        // Create new attendance record
        await base44.asServiceRole.entities.AgendaAttendance.create({
          player_id: player.id,
          agenda_item_id: agendaItem.id,
          status: status === 1 ? 'aanwezig' : 'afwezig'
        });

        created++;
      }
    }

    return Response.json({ 
      success: true, 
      created, 
      skipped,
      message: `Created ${created} attendance records, skipped ${skipped} existing records`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});