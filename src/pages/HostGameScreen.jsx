import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CountdownTimer from "../components/CountdownTimer";
import { socket } from "../api/socket";

const ROUND_DURATION_MS = 30000;
const ANSWERS_DURATION_MS = 10000;

const HostGameScreen = (props) => {
  const hasEmitted = useRef(false);
  const audioPlayer = useRef(new Audio());
  const [roundData, setRoundData] = useState(null);
  const [screenState, setScreenState] = useState("");
  const [lastPlayed, setLastPlayed] = useState(null);
  const [scores, setScores] = useState(null);

  const { gameSession } = props;
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_DURATION_MS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [answersTimeLeftMs, setAnswersTimeLeftMs] = useState(0);
  const [isAnswersTimerRunning, setIsAnswersTimerRunning] = useState(false);
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
    socket.on("answers", (data) => {
      setScores(data.scores);
      setLastPlayed(data.lastPlayed);
      setScreenState("answers");
      setAnswersTimeLeftMs(ANSWERS_DURATION_MS);
      setIsAnswersTimerRunning(true);
    });
    return () => {
      socket.off("start_round");
      socket.off("answers");
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
    socket.emit("host_ready", resolvedGameID);
  };

  if (screenState === "") {
    return <p>The game will start in a second</p>;
  }
  if (screenState === "answers") {
    const sortedScores = Object.values(scores || {}).sort(
      (a, b) => b.score - a.score
    );

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-semibold text-muted-foreground">
            The song was:{" "}
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div>
              <h1 className="text-5xl font-bold text-primary">
                {lastPlayed?.title}
              </h1>
              <p className="text-2xl text-foreground mt-2">
                {lastPlayed?.artist}
              </p>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Ranking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <CountdownTimer
                initialTimeInMs={answersTimeLeftMs}
                isRunning={isAnswersTimerRunning}
                onTimerEnd={handleAnswersTimerEnd}
              />
            </div>
            {sortedScores.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  index === 0
                    ? "bg-primary/5 border-primary/40"
                    : "bg-muted border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono text-xl w-8 ${
                      index === 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback>{player.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xl font-medium text-foreground">
                    {player.name}
                  </span>
                </div>

                <div className="text-2xl font-bold text-primary">
                  {Math.round(player.score)} pkt
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
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
};

export default HostGameScreen;
