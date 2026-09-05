import { useState } from "react";
import CharacterCustomization from "./components/CharacterCustomization";
import NavBar, { type Tab } from "./components/NavBar";
import TaskInputModal from "./components/TaskInputModal";
import RecoveryPage from "./pages/RecoveryPage";
import RoomPage from "./pages/RoomPage";
import TasksPage from "./pages/TasksPage";

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
      <NavBar active={activeTab} onChange={setActiveTab} />
      {activeTab === "room" && <RoomPage onCustomize={() => setScreen("character")} />}
      {activeTab === "tasks" && <TasksPage />}
      {activeTab === "recovery" && <RecoveryPage />}
      <TaskInputModal />
    </>
  );
}

export default App;
