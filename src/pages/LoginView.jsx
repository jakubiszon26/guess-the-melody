import SpotifyAuth from "../components/SpotifyAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
const LoginView = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
      <Card className="w-full max-w-sm bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white font-bold text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center text-slate-300">
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
