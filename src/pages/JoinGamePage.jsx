import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { socket } from "../api/socket";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  gameCode: z.string().regex(/^\d{6}$/, {
    message:
      "Game code is a six digit number. You can find it on your host's screen",
  }),
  username: z
    .string()
    .min(2, {
      message: "Your name has to consist from at least 2 characters",
    })
    .max(20, {
      message: "The player name is restricted to 20 characters only",
    })
    .refine((val) => val.toLowerCase() !== "host", {
      message: "Sorry, you can't use this name",
    }),
});

const JoinGameForm = (props) => {
  const { isPlayer, setIsPlayer } = props;
  const [gameStarted, setGameStarted] = useState(false);
  const [canRejoin, setCanRejoin] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameCode: "",
      username: "",
    },
  });
  const handleRejoin = () => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit(
      "re_join_game",
      localStorage.getItem("socketID"),
      localStorage.getItem("gameCode"),
      (response) => {
        if (response.success === true) {
          localStorage.removeItem("socketID");
          localStorage.setItem("socketID", socket.id);
          setGameStarted(true);
          setIsPlayer(true);
          navigate("/playerscreen", { replace: true });
        } else {
          form.setError("gameCode", {
            type: "manual",
            message: response.error,
          });
          localStorage.removeItem("gameID");
          localStorage.removeItem("socketID");
          setCanRejoin(false);
        }
      }
    );
  };

  const onSubmit = (values) => {
    if (!socket.connected) {
      socket.connect();
    }
    console.log("Wysyłanie:", values);
    socket.emit("join_game", values.gameCode, values.username, (response) => {
      if (response.success === false) {
        form.setError("gameCode", {
          type: "manual",
          message: response.error,
        });
      }
      setIsPlayer(response.success);
      if (response.success) {
        localStorage.setItem("socketID", socket.id);
        localStorage.setItem("gameCode", values.gameCode);
      }
    });
  };

  useEffect(() => {
    const savedGameCode = localStorage.getItem("gameCode");
    const savedID = localStorage.getItem("socketID");

    if (savedGameCode && savedID) {
      setCanRejoin(true);
    }
  }, []);

  useEffect(() => {
    if (!isPlayer) {
      return;
    }

    const handleGameStarted = (data) => {
      setGameStarted(data);
    };
    socket.on("game_started", handleGameStarted);

    return () => {
      socket.off("game_started", handleGameStarted);
    };
  }, [isPlayer]);

  useEffect(() => {
    if (gameStarted) {
      navigate("/playerscreen", { replace: true });
    }
  }, [gameStarted, navigate]);

  if (isPlayer) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>You're in!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Wait for the host to start the game
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Join the game</CardTitle>
          <CardDescription className="text-center">
            Enter the six-digit game code to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="gameCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Code</FormLabel>
                    <FormControl>
                      <Input placeholder="000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player name</FormLabel>
                    <FormControl>
                      <Input placeholder="Type your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Join the game
              </Button>
            </form>
          </Form>
        </CardContent>
        {canRejoin ? (
          <CardFooter>
            <Button
              onClick={handleRejoin}
              className="w-full bg-green-400 text-white"
            >
              Re-join the game
            </Button>
          </CardFooter>
        ) : (
          ""
        )}
      </Card>
    </div>
  );
};

export default JoinGameForm;
