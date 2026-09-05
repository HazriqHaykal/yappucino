import { useState } from "react";
import CharacterCustomization from "./components/CharacterCustomization";
import RoomScene from "./components/RoomScene";
import TaskInputModal from "./components/TaskInputModal";

type Screen = "room" | "character";

function getInitialScreen(): Screen {
  const screenParam = new URLSearchParams(window.location.search).get("screen");
  return screenParam === "character" ? "character" : "room";
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen);

  if (screen === "character") {
    return <CharacterCustomization onCreated={() => setScreen("room")} />;
  }

  return (
    <>
      <RoomScene onCustomize={() => setScreen("character")} />
      <TaskInputModal />
    </>
  );
}

export default App;
