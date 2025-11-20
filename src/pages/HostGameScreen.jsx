import { useEffect, useState, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "../components/ui/button";
import CountdownTimer from "../components/CountdownTimer";
import { socket } from "../api/socket";
import { useNavigate } from "react-router-dom";

const CONFETTI_COLORS = [
  "#F87171",
  "#34D399",
  "#60A5FA",
  "#FBBF24",
  "#F472B6",
  "#A78BFA",
];

const ConfettiBurst = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        offset: Math.random() * 140 - 70,
        delay: Math.random() * 900,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 h-12">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            "--offset": `${piece.offset}px`,
            "--delay": `${piece.delay}ms`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
};

const ROUND_DURATION_MS = 30000;
const ANSWERS_DURATION_MS = 10000;

const HostGameScreen = (props) => {
  const hasEmitted = useRef(false);
  const audioPlayer = useRef(new Audio());
  const [roundData, setRoundData] = useState(null);
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
      setRoundData(null);
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
                    <AvatarFallback>
                      {player.name?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
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

  if (screenState === "finish") {
    const sortedScores = Object.values(scores || {}).sort(
      (a, b) => b.score - a.score
    );
    const winner = sortedScores[0];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Game finished!</h1>
          <p className="text-lg text-muted-foreground">
            {winner
              ? `${winner.name} wins with score: ${Math.round(
                  winner.score || 0
                )} pkt`
              : "No score :("}
          </p>
        </div>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Final leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedScores.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No player scores
              </p>
            ) : (
              sortedScores.map((player, index) => (
                <div
                  key={player.id}
                  className={`relative flex items-center justify-between overflow-hidden rounded-xl border p-4 ${
                    index === 0
                      ? "bg-primary/10 border-primary/60"
                      : "bg-muted border-border"
                  }`}
                >
                  {index === 0 && <ConfettiBurst />}
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-xl w-8 ${
                        index === 0 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <Avatar>
                      <AvatarFallback>
                        {player.name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xl font-medium text-foreground">
                      {player.name}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(player.score || 0)} pkt
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button className="w-full max-w-xs" onClick={handleExitToMenu}>
          Wroc do menu
        </Button>
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
