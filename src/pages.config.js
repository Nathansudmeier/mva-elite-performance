/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountBeheer from './pages/AccountBeheer';
import Attendance from './pages/Attendance';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import LiveMatch from './pages/LiveMatch';
import PhysicalMonitor from './pages/PhysicalMonitor';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerDetail from './pages/PlayerDetail';
import PlayerRatingForm from './pages/PlayerRatingForm';
import Players from './pages/Players';
import Reports from './pages/Reports';
import SelfReflection from './pages/SelfReflection';
import Speelminuten from './pages/Speelminuten';
import Spelprincipes from './pages/Spelprincipes';
import Staff from './pages/Staff';
import Tactics from './pages/Tactics';
import TrainerDetail from './pages/TrainerDetail';
import VideoHub from './pages/VideoHub';
import Trainingen from './pages/Trainingen';
import Wedstrijden from './pages/Wedstrijden';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountBeheer": AccountBeheer,
    "Attendance": Attendance,
    "Dashboard": Dashboard,
    "Leaderboard": Leaderboard,
    "LiveMatch": LiveMatch,
    "PhysicalMonitor": PhysicalMonitor,
    "PlayerDashboard": PlayerDashboard,
    "PlayerDetail": PlayerDetail,
    "PlayerRatingForm": PlayerRatingForm,
    "Players": Players,
    "Reports": Reports,
    "SelfReflection": SelfReflection,
    "Speelminuten": Speelminuten,
    "Spelprincipes": Spelprincipes,
    "Staff": Staff,
    "Tactics": Tactics,
    "Trainingen": Trainingen,
    "TrainerDetail": TrainerDetail,
    "VideoHub": VideoHub,
    "Wedstrijden": Wedstrijden,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};