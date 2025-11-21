import { useEffect, useState } from "react";
import { socket } from "../api/socket";
import { useForm } from "react-hook-form";
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
} from "@/components/ui/card";

const formSchema = z.object({
  playerAnswer: z.string().min(4, {
    message: "Type your answer here",
  }),
});

const PlayerGameScreen = () => {
  const [gameScreen, setGameScreen] = useState("");
  const [gameData, setGameData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerAnswer: "",
    },
  });

  const onSubmit = (values) => {
    socket.emit("player_answer", {
      playerAnswer: values.playerAnswer,
      gameID: gameData.gameID,
    });
  };

  useEffect(() => {
    const handlePlayerRoundStart = (data) => {
      console.log("Round has started");
      setGameScreen(data.screenState);
      setGameData(data);
    };

    const handleAnswers = () => {
      setGameScreen("answers");
    };

    socket.on("player_round_start", handlePlayerRoundStart);
    socket.on("answers", handleAnswers);

    return () => {
      socket.off("player_round_start", handlePlayerRoundStart);
      socket.off("answers", handleAnswers);
    };
  }, []);

  if (gameScreen === "guessing")
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Type your guess
            </CardTitle>
            <CardDescription className="text-center">
              The quicker you are the more points you earn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="playerAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your answer</FormLabel>
                      <FormControl>
                        <Input placeholder="Song title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Send your answer
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );

  if (gameScreen === "answers") {
    return (
      <div className="flex w-full min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>The next round will start in a moment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              How quick can you guess in the next one?
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <p>Game will start in a moment</p>;
};

export default PlayerGameScreen;
