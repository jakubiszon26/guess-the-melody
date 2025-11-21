import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CountdownTimer from "@/components/CountdownTimer";

const HostAnswersScreen = (props) => {
  const {
    lastPlayed,
    answersTimeLeftMs,
    handleAnswersTimerEnd,
    isAnswersTimerRunning,
    sortedScores,
  } = props;
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
};

export default HostAnswersScreen;
