import { AuthProvider } from "@/components/auth/AuthProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import TrackRouter from "@/components/TrackRouter";

export default function Home() {
  return (
    <AuthProvider>
      <AuthGuard>
        <TrackRouter />
      </AuthGuard>
    </AuthProvider>
  );
}
