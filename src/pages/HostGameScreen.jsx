import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "../components/ui/card";
import CountdownTimer from "../components/CountdownTimer";
import { socket } from "../api/socket";

const ROUND_DURATION_MS = 30000;

const HostGameScreen = (props) => {
  const hasEmitted = useRef(false);
  const audioPlayer = useRef(new Audio());
  const [roundData, setRoundData] = useState(null);
  const [screenState, setScreenState] = useState("");

  const { gameSession } = props;
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_DURATION_MS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const resolvedGameID = gameSession?.gameSession?.gameID;

  useEffect(() => {
    if (!resolvedGameID || hasEmitted.current) {
      return;
    }
    socket.emit("host_ready", resolvedGameID);
    hasEmitted.current = true;
  }, [resolvedGameID]);

  useEffect(() => {
    socket.on("start_round", (data) => {
      setScreenState(data.screenState);
      setRoundData(data);
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
    });
    return () => {
      socket.off("start_round");
      audioPlayer.current.pause();
      audioPlayer.current.src = "";
      setIsTimerRunning(false);
    };
  }, []);

  const handleRoundEnd = () => {
    socket.emit("host_round_ended", {
      gameId: resolvedGameID,
      roundData: roundData,
    });
    setIsTimerRunning(false);
  };

  if (screenState === "") {
    return <p>The game will start in a second</p>;
  }
  if (screenState === "guessing") {
    return (
      <div>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-sm ">
            <CardHeader>
              <CardTitle className="text-2xl text-white font-bold text-center">
                Take your guess!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                <CountdownTimer
                  initialTimeInMs={timeLeftMs}
                  isRunning={isTimerRunning}
                  onTimerEnd={handleRoundEnd}
                />
              </CardDescription>
              Use Your phone to type the answer
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  if (screenState === "answers") {
    return (
      <div>
        <p>Answers ui, {roundData.track}</p>
      </div>
    );
  }
};

export default HostGameScreen;
