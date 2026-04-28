import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

// Website imports
import WebsiteHome from './pages/website/WebsiteHome';
import WebsiteSelecties from './pages/website/WebsiteSelecties';
import WebsiteMO17 from './pages/website/WebsiteMO17';
import WebsiteMO20 from './pages/website/WebsiteMO20';
import WebsiteVrouwen1 from './pages/website/WebsiteVrouwen1';
import WebsiteMO15 from './pages/website/WebsiteMO15';
import WebsiteWedstrijden from './pages/website/WebsiteWedstrijden';
import WebsiteWedstrijdDetail from './pages/website/WebsiteWedstrijdDetail';
import WebsiteDeClub from './pages/website/WebsiteDeClub';
import WebsiteProeftraining from './pages/website/WebsiteProeftraining';
import WebsiteContact from './pages/website/WebsiteContact';
import WebsitePrivacy from './pages/website/WebsitePrivacy';
import WebsiteNotFound from './pages/website/WebsiteNotFound';
import WebsiteLeden from './pages/website/WebsiteLeden';
import WebsiteNieuws from './pages/website/WebsiteNieuws';
import WebsiteNieuwsDetail from './pages/website/WebsiteNieuwsDetail';
import WebsiteBeheer from './pages/website/WebsiteBeheer';
import SitemapXml from './pages/website/SitemapXml';
import RobotsTxt from './pages/website/RobotsTxt';
import ScrollToTop from './components/website/ScrollToTop';
import WebsiteNieuwsbriefBevestig from './pages/website/WebsiteNieuwsbriefBevestig';
import WebsiteNieuwsbriefAfmelden from './pages/website/WebsiteNieuwsbriefAfmelden';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/LiveMatch" element={<LayoutWrapper currentPageName="Wedstrijden"><LiveMatch /></LayoutWrapper>} />
      <Route path="/live/:matchId" element={<LiveMatchViewer />} />
      <Route path="/live" element={<LiveTracker />} />
      <Route path="/" element={
        <LayoutWrapper currentPageName="Dashboard">
          <DashboardRouter />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/PlayerRatingForm" element={<LayoutWrapper currentPageName="PlayerRatingForm"><PlayerRatingForm /></LayoutWrapper>} />
      <Route path="/PlayerDetail" element={<LayoutWrapper currentPageName="PlayerDetail"><PlayerDetail /></LayoutWrapper>} />
      <Route path="/PlayerDashboard" element={<LayoutWrapper currentPageName="Dashboard"><PlayerDashboard /></LayoutWrapper>} />
      <Route path="/AccountBeheer" element={<LayoutWrapper currentPageName="AccountBeheer"><AccountBeheer /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/Spelprincipes" element={<LayoutWrapper currentPageName="Spelprincipes"><Spelprincipes /></LayoutWrapper>} />
      <Route path="/Staff" element={<LayoutWrapper currentPageName="Staff"><Staff /></LayoutWrapper>} />
      <Route path="/TrainerDetail" element={<LayoutWrapper currentPageName="Staff"><TrainerDetail /></LayoutWrapper>} />
      <Route path="/Speelminuten" element={<LayoutWrapper currentPageName="Speelminuten"><Speelminuten /></LayoutWrapper>} />
      <Route path="/MijnReflecties" element={<LayoutWrapper currentPageName="MijnReflecties"><MijnReflecties /></LayoutWrapper>} />
      <Route path="/Agenda" element={<LayoutWrapper currentPageName="Agenda"><Agenda /></LayoutWrapper>} />
      <Route path="/Planning" element={<LayoutWrapper currentPageName="Planning"><Planning /></LayoutWrapper>} />
      <Route path="/PlanningTrainingDetail" element={<LayoutWrapper currentPageName="Planning"><PlanningTrainingDetail /></LayoutWrapper>} />
      <Route path="/PlanningWedstrijdDetail" element={<LayoutWrapper currentPageName="Planning"><PlanningWedstrijdDetail /></LayoutWrapper>} />
      <Route path="/PlanningToernooiDetail" element={<LayoutWrapper currentPageName="Planning"><PlanningToernooiDetail /></LayoutWrapper>} />
      <Route path="/MatchEdit" element={<MatchEdit />} />
      <Route path="/Messages" element={<LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper>} />
      <Route path="/Chat" element={<LayoutWrapper currentPageName="Messages"><Chat /></LayoutWrapper>} />
      <Route path="/ImportTrainingAttendance" element={<LayoutWrapper currentPageName="ImportTrainingAttendance"><ImportTrainingAttendance /></LayoutWrapper>} />
      <Route path="/Trainingsvormen" element={<LayoutWrapper currentPageName="Trainingsvormen"><Trainingsvormen /></LayoutWrapper>} />
      <Route path="/TrainingsvormDetail" element={<LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormDetail /></LayoutWrapper>} />
      <Route path="/TrainingsvormForm" element={<LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormForm /></LayoutWrapper>} />
      <Route path="/MatchResults" element={<LayoutWrapper currentPageName="Dashboard"><MatchResults /></LayoutWrapper>} />
      <Route path="/MatchEditEvents" element={<MatchEditEvents />} />
      <Route path="/Photowall" element={<LayoutWrapper currentPageName="Photowall"><Photowall /></LayoutWrapper>} />
      <Route path="/OuderDashboard" element={<LayoutWrapper currentPageName="Dashboard"><OuderDashboard /></LayoutWrapper>} />
      <Route path="/PendingAccess" element={<LayoutWrapper currentPageName="Dashboard"><PendingAccess /></LayoutWrapper>} />
      <Route path="/EmviFeedback" element={<LayoutWrapper currentPageName="EmviFeedback"><EmviFeedback /></LayoutWrapper>} />
      <Route path="/FeedbackOverview" element={<LayoutWrapper currentPageName="FeedbackOverview"><FeedbackOverview /></LayoutWrapper>} />
      <Route path="/YoYoTestLive" element={<LayoutWrapper currentPageName="YoYoTestLive"><YoYoTestLive /></LayoutWrapper>} />
      <Route path="/Prikbord" element={<LayoutWrapper currentPageName="Prikbord"><Prikbord /></LayoutWrapper>} />
      <Route path="/WedstrijdReflecties" element={<LayoutWrapper currentPageName="WedstrijdReflecties"><WedstrijdReflecties /></LayoutWrapper>} />
      <Route path="/website-beheer" element={<LayoutWrapper currentPageName="WebsiteBeheer"><WebsiteBeheer /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


// Website App (geen auth nodig)
const WebsiteApp = () => (
  <QueryClientProvider client={queryClientInstance}>
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<WebsiteHome />} />
        <Route path="/selecties" element={<WebsiteSelecties />} />
        <Route path="/mo17" element={<WebsiteMO17 />} />
        <Route path="/mo20" element={<WebsiteMO20 />} />
        <Route path="/vrouwen-1" element={<WebsiteVrouwen1 />} />
        <Route path="/mo15" element={<WebsiteMO15 />} />
        <Route path="/wedstrijden" element={<WebsiteWedstrijden />} />
        <Route path="/wedstrijden/:id" element={<WebsiteWedstrijdDetail />} />
        <Route path="/nieuws" element={<WebsiteNieuws />} />
        <Route path="/nieuws/:slug" element={<WebsiteNieuwsDetail />} />
        <Route path="/sitemap.xml" element={<SitemapXml />} />
        <Route path="/robots.txt" element={<RobotsTxt />} />
        <Route path="/nieuwsbrief/bevestig" element={<WebsiteNieuwsbriefBevestig />} />
        <Route path="/nieuwsbrief/afmelden" element={<WebsiteNieuwsbriefAfmelden />} />
        <Route path="/de-club" element={<WebsiteDeClub />} />
        <Route path="/proeftraining" element={<WebsiteProeftraining />} />
        <Route path="/contact" element={<WebsiteContact />} />
        <Route path="/privacy" element={<WebsitePrivacy />} />
        <Route path="/live/:matchId" element={<LiveMatchViewer />} />
        <Route path="/leden" element={<WebsiteLeden />} />
        <Route path="*" element={<WebsiteNotFound />} />
      </Routes>
    </Router>
  </QueryClientProvider>
);

function App() {
  const isWebsite = window.location.hostname === 'mv-artemis.nl';

  if (isWebsite) {
    return <WebsiteApp />;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen />
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App