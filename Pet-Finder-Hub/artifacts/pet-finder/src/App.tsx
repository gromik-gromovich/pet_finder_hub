import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initDb } from "@/lib/mock-db";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import PetDetails from "@/pages/PetDetails";
import MapPage from "@/pages/MapPage";
import CreateAd from "@/pages/CreateAd";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import VkCallback from "@/pages/VkCallback";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  }
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/card/:id" component={PetDetails} />
          <Route path="/map" component={MapPage} />
          <Route path="/create" component={CreateAd} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/login" component={Login} />
          <Route path="/auth/vk/callback" component={VkCallback} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    initDb();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;