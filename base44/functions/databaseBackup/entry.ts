import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITIES = [
  "Player", "TrainingSession", "Attendance", "Match", "AgendaItem",
  "AgendaAttendance", "Nieuwsbericht", "Sponsor", "Prestatie", "Persoon",
  "ClubDocument", "ProeftrainingAanvraag", "ContactBericht", "Abonnee",
  "WebsiteInstellingen", "UitgelichtWedstrijd", "MatchdayAchtergrond",
  "ChatbotConversatie", "ExerciseTemplate", "TrainingPlan", "TacticalPlan",
  "VideoAnalysis", "YoYoTest", "PhysicalTest", "WellnessLog", "SelfReflection",
  "PlayerRating", "Spelprincipe", "Trainer", "WinningTeam", "Message",
  "MatchCheckIn", "TeamPhoto", "TrainerReflection", "Chat", "ChatMessage",
  "ChatMember", "Notification", "PlayerMatchTime", "PhotoWallPost", "Feedback",
  "DailyFeeling", "Mededeling", "MatchReflection"
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const backup = {
    created_at: new Date().toISOString(),
    created_by: user.email,
    entities: {}
  };

  for (const entityName of ENTITIES) {
    try {
      const records = await base44.asServiceRole.entities[entityName].list();
      backup.entities[entityName] = records || [];
    } catch {
      backup.entities[entityName] = [];
    }
  }

  return new Response(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="artemis-backup-${new Date().toISOString().split("T")[0]}.json"`
    }
  });
});