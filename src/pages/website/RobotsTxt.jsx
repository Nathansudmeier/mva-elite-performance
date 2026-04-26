import { useEffect } from 'react';

export default function RobotsTxt() {
  useEffect(() => {
    document.title = 'robots.txt';
  }, []);

  const content = `User-agent: *
Allow: /

# Blokkeer interne app-routes
Disallow: /Dashboard
Disallow: /PlayerDashboard
Disallow: /PlayerDetail
Disallow: /PlayerRatingForm
Disallow: /AccountBeheer
Disallow: /LiveMatch
Disallow: /LiveTracker
Disallow: /Spelprincipes
Disallow: /MijnReflecties
Disallow: /Agenda
Disallow: /Staff
Disallow: /TrainerDetail
Disallow: /Speelminuten
Disallow: /Leaderboard
Disallow: /MatchEdit
Disallow: /MatchEditEvents
Disallow: /MatchResults
Disallow: /Messages
Disallow: /Chat
Disallow: /Planning
Disallow: /PlanningTrainingDetail
Disallow: /PlanningWedstrijdDetail
Disallow: /PlanningToernooiDetail
Disallow: /ImportTrainingAttendance
Disallow: /Trainingsvormen
Disallow: /TrainingsvormDetail
Disallow: /TrainingsvormForm
Disallow: /Photowall
Disallow: /OuderDashboard
Disallow: /PendingAccess
Disallow: /EmviFeedback
Disallow: /FeedbackOverview
Disallow: /YoYoTestLive
Disallow: /Prikbord
Disallow: /WedstrijdReflecties
Disallow: /website-beheer
Disallow: /live/
Disallow: /Players
Disallow: /Attendance
Disallow: /PhysicalMonitor
Disallow: /Reports
Disallow: /SelfReflection
Disallow: /Tactics
Disallow: /VideoHub

Sitemap: https://mv-artemis.nl/sitemap.xml`;

  return (
    <pre
      style={{
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        background: 'white',
        color: 'black',
        padding: '20px',
        margin: 0,
      }}
    >
      {content}
    </pre>
  );
}