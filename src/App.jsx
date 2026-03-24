import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Wedstrijden from './pages/Wedstrijden';
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
import DashboardRouter from './pages/DashboardRouter.jsx';
import LiveTracker from './pages/LiveTracker.jsx';
import ImportTrainingAttendance from './pages/ImportTrainingAttendance.jsx';
import Trainingsvormen from './pages/Trainingsvormen.jsx';
import TrainingsvormDetail from './pages/TrainingsvormDetail.jsx';
import TrainingsvormForm from './pages/TrainingsvormForm.jsx';
import MatchResults from './pages/MatchResults.jsx';
import Photowall from './pages/Photowall.jsx';
import OuderDashboard from './pages/OuderDashboard';
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
      <Route path="/Wedstrijden" element={<LayoutWrapper currentPageName="Wedstrijden"><Wedstrijden /></LayoutWrapper>} />
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
      <Route path="/MatchEdit" element={<MatchEdit />} />
      <Route path="/Messages" element={<LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper>} />
      <Route path="/Chat" element={<LayoutWrapper currentPageName="Messages"><Chat /></LayoutWrapper>} />
      <Route path="/ImportTrainingAttendance" element={<LayoutWrapper currentPageName="ImportTrainingAttendance"><ImportTrainingAttendance /></LayoutWrapper>} />
      <Route path="/Trainingsvormen" element={<LayoutWrapper currentPageName="Trainingsvormen"><Trainingsvormen /></LayoutWrapper>} />
      <Route path="/TrainingsvormDetail" element={<LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormDetail /></LayoutWrapper>} />
      <Route path="/TrainingsvormForm" element={<LayoutWrapper currentPageName="Trainingsvormen"><TrainingsvormForm /></LayoutWrapper>} />
      <Route path="/MatchResults" element={<LayoutWrapper currentPageName="Dashboard"><MatchResults /></LayoutWrapper>} />
      <Route path="/Photowall" element={<LayoutWrapper currentPageName="Photowall"><Photowall /></LayoutWrapper>} />
      <Route path="/OuderDashboard" element={<LayoutWrapper currentPageName="Dashboard"><OuderDashboard /></LayoutWrapper>} />
      <Route path="/PendingAccess" element={<LayoutWrapper currentPageName="Dashboard"><PendingAccess /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

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