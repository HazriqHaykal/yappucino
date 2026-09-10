import { useState } from "react";
import CharacterCustomization from "./components/CharacterCustomization";
import NavBar, { type Tab } from "./components/NavBar";
import TaskInputModal from "./components/TaskInputModal";
import CommunityPage from "./pages/CommunityPage";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";
import SupportPage from "./pages/SupportPage";
import TasksPage from "./pages/TasksPage";

type Screen = "landing" | "room" | "character";

function getInitialScreen(): Screen {
  const screenParam = new URLSearchParams(window.location.search).get("screen");
  if (screenParam === "character") return "character";
  if (screenParam === "room") return "room";
  return "landing";
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen);
  const [activeTab, setActiveTab] = useState<Tab>("room");

  if (screen === "landing") {
    return (
      <LandingPage
        onGetStarted={() => setScreen("character")}
        onSkip={() => setScreen("room")}
      />
    );
  }

  if (screen === "character") {
    return <CharacterCustomization onCreated={() => setScreen("room")} />;
  }

  return (
    <>
      <div className="pb-24 sm:pb-28">
        {activeTab === "room" && <RoomPage onCustomize={() => setScreen("character")} />}
        {activeTab === "tasks" && <TasksPage />}
        {activeTab === "community" && <CommunityPage />}
        {activeTab === "support" && <SupportPage onNavigate={setActiveTab} />}
      </div>
      <NavBar active={activeTab} onChange={setActiveTab} />
      <TaskInputModal />
    </>
  );
}

export default App;
