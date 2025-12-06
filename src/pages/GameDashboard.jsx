import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getTracksFromPlaylist } from "../api/spotifyApi";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestNewGame, discardGame } from "../api/gameApi";
import { useNavigate } from "react-router-dom";
import TracksItems from "../components/TracksItems";
const GameDashboard = (props) => {
  const {
    selectedPlaylist,
    playerCount = 1,
    setPlayerCount,
    gameLength = "short",
    setGameLength,
    gameSettings,
    gameSession,
    gameSessionLoading,
    setGameMode,
  } = props;
  const queryClient = useQueryClient();
  const lengthOptions = [
    { label: "Short game", value: "short", minTracks: 8 },
    { label: "Mid game", value: "mid", minTracks: 15 },
    { label: "Long game", value: "long", minTracks: 30 },
  ];

  const getTracks = async () => {
    if (selectedPlaylist) {
      const data = await getTracksFromPlaylist(selectedPlaylist);
      console.log(data);
      return data;
    } else {
      console.log("returning null");
      return null;
    }
  };

  const {
    data: tracks,
    error: tracksError,
    isLoading: tracksIsLoading,
  } = useQuery({
    queryKey: ["tracks", selectedPlaylist],
    queryFn: getTracks,
  });

  const navigate = useNavigate();

  const trackCount = tracks?.items?.length ?? 0;

  if (gameSessionLoading || gameSession?.gameSession) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>The game has already started</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await discardGame();
                  queryClient.setQueryData(["session"], undefined);
                  await queryClient.invalidateQueries({
                    queryKey: ["session"],
                  });
                } catch (error) {
                  console.error("Failed to discard game", error);
                }
              }}
            >
              Discard game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedPlaylist) {
    return (
      <div className="w-full min-h-screen p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:gap-10">
          <section className="order-2 flex w-full flex-col gap-4 md:order-1 md:w-1/2">
            <div>
              <h2 className="text-xl font-semibold">{selectedPlaylist.name}</h2>
              <p className="text-sm text-muted-foreground">
                Tracks included in this round
              </p>
            </div>
            <ScrollArea className="h-[60vh] w-full rounded-xl border bg-card/40 md:h-[80vh]">
              <TracksItems tracks={tracks} tracksIsLoading={tracksIsLoading} />
            </ScrollArea>
          </section>

          <section className="order-1 flex w-full items-center justify-center md:order-2 md:w-1/2">
            <Card className="w-full max-w-lg shadow-lg">
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>
                  Tune how you want to play with this playlist
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Number of players</p>
                    <p className="text-xs text-muted-foreground">
                      Choose how many people are guessing (1-6).
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {playerCount} {playerCount === 1 ? "player" : "players"}
                  </Badge>
                </div>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Slider
                      aria-label="Number of players"
                      value={[playerCount]}
                      min={1}
                      max={20}
                      step={1}
                      onValueChange={(value) =>
                        setPlayerCount?.(value?.[0] ?? 1)
                      }
                      className={cn("w-full")}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" sideOffset={12}>
                    {playerCount} {playerCount === 1 ? "player" : "players"}
                  </TooltipContent>
                </Tooltip>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Game length</p>
                  <div className="flex flex-wrap gap-2">
                    {lengthOptions.map((option) => {
                      const disabled =
                        trackCount === 0 || trackCount < option.minTracks;
                      return (
                        <Button
                          key={option.value}
                          variant={
                            gameLength === option.value ? "default" : "outline"
                          }
                          disabled={disabled}
                          onClick={() => {
                            if (!disabled) {
                              setGameLength(option.value);
                            }
                          }}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {(() => {
                      const messages = [];
                      if (!trackCount) {
                        messages.push(
                          "Load playlist tracks to choose a game length."
                        );
                      } else if (trackCount < 8) {
                        messages.push(
                          "Need at least 8 tracks to enable Short game."
                        );
                      } else if (trackCount < 15) {
                        messages.push(
                          "Need at least 15 tracks to enable Mid game."
                        );
                      } else if (trackCount < 30) {
                        messages.push(
                          "Need at least 30 tracks to enable Long game."
                        );
                      }
                      return messages.map((message) => (
                        <p key={message}>{message}</p>
                      ));
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Game Mode</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={
                        gameSettings?.gameMode === "title"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setGameMode("title")}
                    >
                      Guess Title
                    </Button>
                    <Button
                      variant={
                        gameSettings?.gameMode === "artist"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setGameMode("artist")}
                    >
                      Guess Artist
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose what players need to guess.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  disabled={trackCount < 8}
                  onClick={async () => {
                    try {
                      const data = await requestNewGame(gameSettings);
                      if (data.created) {
                        await queryClient.invalidateQueries({
                          queryKey: ["session"],
                        });
                        navigate("/lobby", { replace: true });
                      }
                    } catch (error) {
                      console.error("Failed to start game", error);
                    }
                  }}
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  Start Game
                </Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Select a playlist to start</CardTitle>
          <CardDescription>
            Pick something from the sidebar and tracks will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you choose a playlist, you will see its songs on the left and
            the game configuration panel on the right.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameDashboard;
