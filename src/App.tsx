import CharacterCustomization from "./components/CharacterCustomization";
import RoomScene from "./components/RoomScene";
import TaskInputModal from "./components/TaskInputModal";

function App() {
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
      <RoomScene />
      <TaskInputModal />
    </>
  );
}

export default App;
