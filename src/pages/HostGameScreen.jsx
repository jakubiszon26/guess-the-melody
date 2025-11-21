import { useEffect, useState, useRef } from "react";
import { socket } from "../api/socket";
import { useNavigate } from "react-router-dom";
import HostAnswersScreen from "../components/HostScreenStates/HostAnswersScreen";
import HostGuessingScreen from "../components/HostScreenStates/HostGuessingScreen";
import HostFinishScreen from "../components/HostScreenStates/HostFinishScreen";

const ROUND_DURATION_MS = 30000;
const ANSWERS_DURATION_MS = 10000;

const HostGameScreen = (props) => {
  const hasEmitted = useRef(false);
  const audioPlayer = useRef(new Audio());
  const [screenState, setScreenState] = useState("");
  const [lastPlayed, setLastPlayed] = useState(null);
  const [scores, setScores] = useState(null);
  const [isGameFinished, setIsGameFinished] = useState(false);

  const { gameSession } = props;
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_DURATION_MS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [answersTimeLeftMs, setAnswersTimeLeftMs] = useState(0);
  const [isAnswersTimerRunning, setIsAnswersTimerRunning] = useState(false);
  const resolvedGameID = gameSession?.gameSession?.gameID;
  const navigate = useNavigate();

  useEffect(() => {
    if (!resolvedGameID || hasEmitted.current) {
      return;
    }
    socket.emit("host_ready", resolvedGameID);
    hasEmitted.current = true;
  }, [resolvedGameID]);

  useEffect(() => {
    const handleStartRound = (data) => {
      setScreenState(data.screenState);
      setTimeLeftMs(data.roundDurationMs ?? ROUND_DURATION_MS);
      setIsTimerRunning(false);

      if (data.songPreview) {
        audioPlayer.current.pause();
        audioPlayer.current.src = data.songPreview;
        audioPlayer.current.currentTime = 0;
        audioPlayer.current.volume = 1;
        audioPlayer.current
          .play()
          .then(() => {
            setIsTimerRunning(true);
          })
          .catch((e) => {
            console.error("Audio play error:", e);
          });
      } else {
        setIsTimerRunning(true);
      }
    };

    const handleAnswers = (data) => {
      setScores(data.scores);
      setLastPlayed(data.lastPlayed);
      setScreenState("answers");
      setAnswersTimeLeftMs(ANSWERS_DURATION_MS);
      setIsAnswersTimerRunning(true);
    };

    const handleFinish = (data) => {
      setScores(data?.scores ?? null);
      setScreenState("finish");
      setLastPlayed(null);
      setIsTimerRunning(false);
      setIsAnswersTimerRunning(false);
      setAnswersTimeLeftMs(0);
      setIsGameFinished(true);
      audioPlayer.current.pause();
      audioPlayer.current.src = "";
    };

    socket.on("start_round", handleStartRound);
    socket.on("answers", handleAnswers);
    socket.on("finish", handleFinish);

    return () => {
      socket.off("start_round", handleStartRound);
      socket.off("answers", handleAnswers);
      socket.off("finish", handleFinish);
      audioPlayer.current.pause();
      audioPlayer.current.src = "";
      setIsTimerRunning(false);
      setIsAnswersTimerRunning(false);
    };
  }, []);

  const handleRoundEnd = () => {
    socket.emit("host_round_ended", resolvedGameID);

    setIsTimerRunning(false);
  };

  const handleAnswersTimerEnd = () => {
    setIsAnswersTimerRunning(false);
    if (!isGameFinished) {
      socket.emit("host_ready", resolvedGameID);
    }
  };

  const handleExitToMenu = () => {
    audioPlayer.current.pause();
    audioPlayer.current.src = "";
    setIsTimerRunning(false);
    setIsAnswersTimerRunning(false);
    navigate("/");
  };

  if (screenState === "") {
    return <p>The game will start in a second</p>;
  }
  if (screenState === "answers") {
    const sortedScores = Object.values(scores || {}).sort(
      (a, b) => b.score - a.score
    );

    return (
      <HostAnswersScreen
        lastPlayed={lastPlayed}
        answersTimeLeftMs={answersTimeLeftMs}
        handleAnswersTimerEnd={handleAnswersTimerEnd}
        isAnswersTimerRunning={isAnswersTimerRunning}
        sortedScores={sortedScores}
      />
    );
  }

  if (screenState === "finish") {
    const sortedScores = Object.values(scores || {}).sort(
      (a, b) => b.score - a.score
    );
    const winner = sortedScores[0];

    return (
      <HostFinishScreen
        winner={winner}
        sortedScores={sortedScores}
        handleExitToMenu={handleExitToMenu}
      />
    );
  }

  if (screenState === "guessing") {
    return (
      <HostGuessingScreen
        timeLeftMs={timeLeftMs}
        isTimerRunning={isTimerRunning}
        handleRoundEnd={handleRoundEnd}
      />
    );
  }
};

export default HostGameScreen;
