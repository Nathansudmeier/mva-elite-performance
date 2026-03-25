import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all agenda attendance records with null status
    const allRecords = await base44.entities.AgendaAttendance.list();
    const nullStatusRecords = allRecords.filter(r => r.status === null);

    if (nullStatusRecords.length === 0) {
      return Response.json({ message: 'No null status records found', count: 0 });
    }

    // Update each record to 'afwezig'
    let updated = 0;
    for (const record of nullStatusRecords) {
      await base44.entities.AgendaAttendance.update(record.id, { status: 'afwezig' });
      updated++;
    }

    return Response.json({ 
      message: `Successfully converted ${updated} null status records to afwezig`,
      count: updated 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});