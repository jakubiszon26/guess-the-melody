import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

const HostFinishScreen = (props) => {
  const { winner, sortedScores, handleExitToMenu } = props;

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
        Go back to menu
      </Button>
    </div>
  );
};

export default HostFinishScreen;
