import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import CountdownTimer from "@/components/CountdownTimer";

const HostGuessingScreen = (props) => {
  const { timeLeftMs, isTimerRunning, handleRoundEnd } = props;
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
};

export default HostGuessingScreen;
