import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { Item, ItemContent, ItemActions } from "@/components/ui/item";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { getGameCode } from "../api/gameApi";
import { useQuery } from "@tanstack/react-query";
import { socket } from "../api/socket";
import { useNavigate } from "react-router-dom";

import QRCode from "react-qr-code";
const GameLobby = (props) => {
  const { setIsHost } = props;

  const qrurl =
    window.location.href.replace(window.location.pathname, "") + "/join";

  const {
    data: gameCode,
    error: gameCodeError,
    isLoading: gameCodeLoading,
  } = useQuery({
    queryKey: ["gamecode"],
    queryFn: getGameCode,
  });

  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const navigate = useNavigate();

  const startGame = () => {
    socket.emit("host_start_game", gameCode);
  };

  useEffect(() => {
    if (!gameCode) return;
    socket.connect();
    socket.emit("join_game", gameCode, "Host");
    socket.on("update_players", (updatedPlayersList) => {
      setPlayers(updatedPlayersList);
    });
    socket.on("game_started", (res) => {
      setGameStarted(res);
    });
    return () => {
      socket.off("update_players");
    };
  }, [gameCode]);

  useEffect(() => {
    if (gameStarted) {
      setIsHost(true);
      navigate("/gamescreen", { replace: true });
    }
  }, [gameStarted, setIsHost, navigate]);

  return (
    <div className="flex w-full min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Join the game</CardTitle>
          <CardDescription>
            Game code:{" "}
            <h1 className=" text-white scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
              {gameCode}
            </h1>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          <p className="text-md">Go to {qrurl}</p>
          <span className="text-muted-foreground">Or scan the QR code</span>
          <div className="bg-white p-3">
            <QRCode
              size={256}
              value={qrurl}
              viewBox={`0 0 256 256`}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-lg text-center ml-5">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent className="">
          <ScrollArea className="h-[60vh] w-full rounded-xl border bg-card/40 md:h-[40vh]">
            {players?.map((p) => {
              return (
                <Item key={p.id} variant="outline" className="m-0.5">
                  <ItemContent> {p.name}</ItemContent>
                </Item>
              );
            })}
          </ScrollArea>
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            onClick={() => startGame()}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            Start game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameLobby;
