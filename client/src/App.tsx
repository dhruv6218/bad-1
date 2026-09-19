import type { ReactNode } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { Providers } from "./components/Providers";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./views/Home";
import { Pricing } from "./views/Pricing";
import { Login } from "./views/Login";
import { Signup } from "./views/Signup";
import { ForgotPassword } from "./views/ForgotPassword";
import { ResetPassword } from "./views/ResetPassword";
import { Contact } from "./views/Contact";
import { PrivacyPolicy } from "./views/legal/PrivacyPolicy";
import { TermsOfService } from "./views/legal/TermsOfService";
import { RefundPolicy } from "./views/legal/RefundPolicy";
import { AcceptInvitation } from "./views/AcceptInvitation";
import { Dashboard } from "./views/app/Dashboard";
import { Invoices } from "./views/app/Invoices";
import { ToneStudio } from "./views/app/ToneStudio";
import { Gateways } from "./views/app/Gateways";
import { Analytics } from "./views/app/Analytics";
import { Settings } from "./views/app/Settings";
import { AdminLogin } from "./views/admin/AdminLogin";
import { AdminRoute } from "./views/admin/AdminRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Step1Gateway } from "./views/onboarding/Step1Gateway";
import { Step2Tone } from "./views/onboarding/Step2Tone";
import { Step3Sync } from "./views/onboarding/Step3Sync";
import NotFound from "./views/NotFound";

function Router() {
  const Protected = ({ children }: { children: ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/refund" component={RefundPolicy} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      <Route path="/app"><Protected><Dashboard /></Protected></Route>
      <Route path="/app/invoices"><Protected><Invoices /></Protected></Route>
      <Route path="/app/tone"><Protected><ToneStudio /></Protected></Route>
      <Route path="/app/gateways"><Protected><Gateways /></Protected></Route>
      <Route path="/app/analytics"><Protected><Analytics /></Protected></Route>
      <Route path="/app/settings"><Protected><Settings /></Protected></Route>
      <Route path="/onboarding/step-1"><Protected><Step1Gateway /></Protected></Route>
      <Route path="/onboarding/step-2"><Protected><Step2Tone /></Protected></Route>
      <Route path="/onboarding/step-3"><Protected><Step3Sync /></Protected></Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/godview" component={AdminRoute} />
      <Route path="/godview/dashboard" component={AdminRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Providers>
            <Router />
          </Providers>
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
