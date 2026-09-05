import { useState } from "react";
import CharacterCustomization from "./components/CharacterCustomization";
import NavBar, { type Tab } from "./components/NavBar";
import TaskInputModal from "./components/TaskInputModal";
import RecoveryPage from "./pages/RecoveryPage";
import RoomPage from "./pages/RoomPage";
import TasksPage from "./pages/TasksPage";
import TherapyPage from "./pages/TherapyPage";

type Screen = "room" | "character";

function getInitialScreen(): Screen {
  const screenParam = new URLSearchParams(window.location.search).get("screen");
  return screenParam === "character" ? "character" : "room";
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen);
  const [activeTab, setActiveTab] = useState<Tab>("room");

  if (screen === "character") {
    return <CharacterCustomization onCreated={() => setScreen("room")} />;
  }

  return (
    <>
      <div className="pb-16 sm:pb-20">
        {activeTab === "room" && <RoomPage onCustomize={() => setScreen("character")} />}
        {activeTab === "tasks" && <TasksPage />}
        {activeTab === "recovery" && <RecoveryPage />}
        {activeTab === "therapy" && <TherapyPage />}
      </div>
      <NavBar active={activeTab} onChange={setActiveTab} />
      <TaskInputModal />
    </>
  );
}

export default App;
