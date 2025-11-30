import SpotifyAuth from "../components/SpotifyAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const LoginView = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Alert className="w-full max-w-lg">
        <AlertCircleIcon />
        <AlertTitle>Warning!</AlertTitle>
        <AlertDescription>
          Due to recent changes in Spotify's API policies (restricted access to
          extended API features), logging into the Vercel-hosted instance is
          currently restricted to whitelisted users. If you wish to test the
          application without running it locally, please contact me so I can add
          your email to the allowlist in the Spotify Developer Dashboard.
        </AlertDescription>
      </Alert>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center">
            Use your Spotify account to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <SpotifyAuth />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginView;
