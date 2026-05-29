import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Residents from "@/pages/residents";
import ResidentProfile from "@/pages/resident-profile";
import ResidentForm from "@/pages/resident-form";
import Medications from "@/pages/medications";
import Activities from "@/pages/activities";
import Appointments from "@/pages/appointments";
import Handover from "@/pages/handover";
import Alerts from "@/pages/alerts";
import Reports from "@/pages/reports";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      
      <Route path="/residents" component={() => <ProtectedRoute component={Residents} />} />
      <Route path="/residents/new" component={() => <ProtectedRoute component={ResidentForm} />} />
      <Route path="/residents/:id/edit" component={() => <ProtectedRoute component={ResidentForm} />} />
      <Route path="/residents/:id" component={() => <ProtectedRoute component={ResidentProfile} />} />
      
      <Route path="/medications" component={() => <ProtectedRoute component={Medications} />} />
      <Route path="/activities" component={() => <ProtectedRoute component={Activities} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={Appointments} />} />
      <Route path="/handover" component={() => <ProtectedRoute component={Handover} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={Alerts} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
