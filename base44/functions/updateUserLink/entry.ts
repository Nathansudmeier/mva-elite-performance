import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId, player_id, trainer_id } = await req.json();

        const updated = await base44.asServiceRole.entities.User.update(userId, {
            player_id: player_id || "",
            trainer_id: trainer_id || "",
        });

        return Response.json(updated);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});