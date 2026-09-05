import { useState } from "react";
import CharacterCustomization from "./components/CharacterCustomization";
import NavBar, { type Tab } from "./components/NavBar";
import TaskInputModal from "./components/TaskInputModal";
import RecoveryPage from "./pages/RecoveryPage";
import RoomPage from "./pages/RoomPage";
import TasksPage from "./pages/TasksPage";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("room");

  const screenParam = new URLSearchParams(window.location.search).get(
    "screen",
  );
  // Preview-only entry point until the Google Auth feature's onboarding
  // flow can gate this on "has this user made a buddy yet". Visit with
  // ?screen=character.
  if (screenParam === "character") {
    return <CharacterCustomization />;
  }

  return (
    <>
      <NavBar active={activeTab} onChange={setActiveTab} />
      {activeTab === "room" && <RoomPage />}
      {activeTab === "tasks" && <TasksPage />}
      {activeTab === "recovery" && <RecoveryPage />}
      <TaskInputModal />
    </>
  );
}

export default App;
