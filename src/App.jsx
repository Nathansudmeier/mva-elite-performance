import { Toaster } from "@/components/ui/toaster"
import WebsiteLayout from '@/components/website/WebsiteLayout';
import WebsiteHome from '@/pages/website/WebsiteHome';
import WebsiteSelecties from '@/pages/website/WebsiteSelecties';
import WebsiteMO17 from '@/pages/website/WebsiteMO17';
import WebsiteMO20 from '@/pages/website/WebsiteMO20';
import WebsiteVrouwen1 from '@/pages/website/WebsiteVrouwen1';
import WebsiteWedstrijden from '@/pages/website/WebsiteWedstrijden';
import WebsiteDeClub from '@/pages/website/WebsiteDeClub';
import WebsiteProeftraining from '@/pages/website/WebsiteProeftraining';
import WebsiteContact from '@/pages/website/WebsiteContact';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import PlayerRatingForm from './pages/PlayerRatingForm';
import PlayerDetail from './pages/PlayerDetail.jsx';
import PlayerDashboard from './pages/PlayerDashboard.jsx';
import AccountBeheer from './pages/AccountBeheer.jsx';
import LiveMatch from './pages/LiveMatch.jsx';
import Spelprincipes from './pages/Spelprincipes.jsx';
import MijnReflecties from './pages/MijnReflecties.jsx';
import Agenda from './pages/Agenda.jsx';
import Staff from './pages/Staff.jsx';
import TrainerDetail from './pages/TrainerDetail.jsx';
import Speelminuten from './pages/Speelminuten.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import MatchEdit from './pages/MatchEdit.jsx';
import Messages from './pages/Messages.jsx';
import Chat from './pages/Chat.jsx';
import Planning from './pages/Planning.jsx';
import PlanningTrainingDetail from './pages/PlanningTrainingDetail.jsx';
import PlanningWedstrijdDetail from './pages/PlanningWedstrijdDetail.jsx';
import PlanningToernooiDetail from './pages/PlanningToernooiDetail.jsx';
import DashboardRouter from './pages/DashboardRouter.jsx';
import LiveTracker from './pages/LiveTracker.jsx';
import ImportTrainingAttendance from './pages/ImportTrainingAttendance.jsx';
import Trainingsvormen from './pages/Trainingsvormen.jsx';
import TrainingsvormDetail from './pages/TrainingsvormDetail.jsx';
import TrainingsvormForm from './pages/TrainingsvormForm.jsx';
import MatchResults from './pages/MatchResults.jsx';
import MatchEditEvents from './pages/MatchEditEvents.jsx';
import Photowall from './pages/Photowall.jsx';
import OuderDashboard from './pages/OuderDashboard';
import LiveMatchViewer from './pages/LiveMatchViewer.jsx';
import PendingAccess from './pages/PendingAccess';
import EmviFeedback from './pages/EmviFeedback';
import FeedbackOverview from './pages/FeedbackOverview';
import YoYoTestLive from './pages/YoYoTestLive';
import Prikbord from './pages/Prikbord';
import WedstrijdReflecties from './pages/WedstrijdReflecties.jsx';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SplashScreen from '@/components/SplashScreen';

const { Pages, Layout } = pagesConfig;

// Domein check — één regel beslist alles
const isWebsite = window.location.hostname === 'mv-artemis.nl';

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthGuard = ({ children }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return children;
};

function App() {

  // ── PUBLIEKE WEBSITE (mv-artemis.nl) ──
  if (isWebsite) {
    return (
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<WebsiteLayout><WebsiteHome /></WebsiteLayout>} />
            <Route path="/selecties" element={<WebsiteLayout><WebsiteSelecties /></WebsiteLayout>} />
            <Route path="/mo17" element={<WebsiteLayout><WebsiteMO17 /></WebsiteLayout>} />
            <Route path="/mo20" element={<WebsiteLayout><WebsiteMO20 /></WebsiteLayout>} />
            <Route path="/vrouwen-1" element={<WebsiteLayout><WebsiteVrouwen1 /></WebsiteLayout>} />
            <Route path="/wedstrijden" element={<WebsiteLayout><WebsiteWedstrijden /></WebsiteLayout>} />
            <Route path="/de-club" element={<WebsiteLayout><WebsiteDeClub /></WebsiteLayout>} />
            <Route path="/proeftraining" element={<WebsiteLayout><WebsiteProeftraining /></WebsiteLayout>} />
            <Route path="/contact" element={<WebsiteLayout><WebsiteContact /></WebsiteLayout>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // ── INTERNE APP (mva-elite.com / mva-elite.base44.app) ──
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen />
        <Router>
          <Routes>
            <Route path="/LiveMatch" element={<AuthGuard><LayoutWrapper currentPageName="Wedstrijden"><LiveMatch /></LayoutWrapper></AuthGuard>} />
            <Route path="/live/:matchId" element={<AuthGuard><LiveMatchViewer /></AuthGuard>} />
            <Route path="/live" element={<AuthGuard><LiveTracker /></AuthGuard>} />
            <Route path="/Dashboard" element={<AuthGuard><LayoutWrapper currentPageName="Dashboard"><DashboardRouter /></LayoutWrapper></AuthGuard>} />
            {Object.entries(Pages).map(([path, Page]) => (
              <Route key={path} path={`/${path}`} element={
                <AuthGuard><LayoutWrapper currentPageName={path}><Page /></LayoutWrapper></AuthGuard>
              } />
            ))}
            <Route path="/PlayerRatingForm" element={<AuthGuard><LayoutWrapper currentPageName="PlayerRatingForm"><PlayerRatingForm /></LayoutWrapper></AuthGuard>} />
            <Route path="/PlayerDetail" element={<AuthGuard><LayoutWrapper currentPageName="PlayerDetail"><PlayerDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/PlayerDashboard" element={<AuthGuard><LayoutWrapper currentPageName="Dashboard"><PlayerDashboard /></LayoutWrapper></AuthGuard>} />
            <Route path="/AccountBeheer" element={<AuthGuard><LayoutWrapper currentPageName="AccountBeheer"><AccountBeheer /></LayoutWrapper></AuthGuard>} />
            <Route path="/Leaderboard" element={<AuthGuard><LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper></AuthGuard>} />
            <Route path="/Spelprincipes" element={<AuthGuard><LayoutWrapper currentPageName="Spelprincipes"><Spelprincipes /></LayoutWrapper></AuthGuard>} />
            <Route path="/Staff" element={<AuthGuard><LayoutWrapper currentPageName="Staff"><Staff /></LayoutWrapper></AuthGuard>} />
            <Route path="/TrainerDetail" element={<AuthGuard><LayoutWrapper currentPageName="Staff"><TrainerDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/Speelminuten" element={<AuthGuard><LayoutWrapper currentPageName="Speelminuten"><Speelminuten /></LayoutWrapper></AuthGuard>} />
            <Route path="/MijnReflecties" element={<AuthGuard><LayoutWrapper currentPageName="MijnReflecties"><MijnReflecties /></LayoutWrapper></AuthGuard>} />
            <Route path="/Agenda" element={<AuthGuard><LayoutWrapper currentPageName="Agenda"><Agenda /></LayoutWrapper></AuthGuard>} />
            <Route path="/Planning" element={<AuthGuard><LayoutWrapper currentPageName="Planning"><Planning /></LayoutWrapper></AuthGuard>} />
            <Route path="/PlanningTrainingDetail" element={<AuthGuard><LayoutWrapper currentPageName="Planning"><PlanningTrainingDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/PlanningWedstrijdDetail" element={<AuthGuard><LayoutWrapper currentPageName="Planning"><PlanningWedstrijdDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/PlanningToernooiDetail" element={<AuthGuard><LayoutWrapper currentPageName="Planning"><PlanningToernooiDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/MatchEdit" element={<AuthGuard><MatchEdit /></AuthGuard>} />
            <Route path="/Messages" element={<AuthGuard><LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper></AuthGuard>} />
            <Route path="/Chat" element={<AuthGuard><LayoutWrapper currentPageName="Messages"><Chat /></LayoutWrapper></AuthGuard>} />
            <Route path="/ImportTrainingAttendance" element={<AuthGuard><LayoutWrapper currentPageName="ImportTrainingAttendance"><ImportTrainingAttendance /></LayoutWrapper></AuthGuard>} />
            <Route path="/Trainingsvormen" element={<AuthGuard><LayoutWrapper currentPageName="Trainingsvormen"><Trainingsvormen /></LayoutWrapper></AuthGuard>} />
            <Route path="/TrainingsvormDetail" element={<AuthGuard><LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormDetail /></LayoutWrapper></AuthGuard>} />
            <Route path="/TrainingsvormForm" element={<AuthGuard><LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormForm /></LayoutWrapper></AuthGuard>} />
            <Route path="/MatchResults" element={<AuthGuard><LayoutWrapper currentPageName="Dashboard"><MatchResults /></LayoutWrapper></AuthGuard>} />
            <Route path="/MatchEditEvents" element={<AuthGuard><MatchEditEvents /></AuthGuard>} />
            <Route path="/Photowall" element={<AuthGuard><LayoutWrapper currentPageName="Photowall"><Photowall /></LayoutWrapper></AuthGuard>} />
            <Route path="/OuderDashboard" element={<AuthGuard><LayoutWrapper currentPageName="Dashboard"><OuderDashboard /></LayoutWrapper></AuthGuard>} />
            <Route path="/PendingAccess" element={<AuthGuard><LayoutWrapper currentPageName="Dashboard"><PendingAccess /></LayoutWrapper></AuthGuard>} />
            <Route path="/EmviFeedback" element={<AuthGuard><LayoutWrapper currentPageName="EmviFeedback"><EmviFeedback /></LayoutWrapper></AuthGuard>} />
            <Route path="/FeedbackOverview" element={<AuthGuard><LayoutWrapper currentPageName="FeedbackOverview"><FeedbackOverview /></LayoutWrapper></AuthGuard>} />
            <Route path="/YoYoTestLive" element={<AuthGuard><LayoutWrapper currentPageName="YoYoTestLive"><YoYoTestLive /></LayoutWrapper></AuthGuard>} />
            <Route path="/Prikbord" element={<AuthGuard><LayoutWrapper currentPageName="Prikbord"><Prikbord /></LayoutWrapper></AuthGuard>} />
            <Route path="/WedstrijdReflecties" element={<AuthGuard><LayoutWrapper currentPageName="WedstrijdReflecties"><WedstrijdReflecties /></LayoutWrapper></AuthGuard>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
