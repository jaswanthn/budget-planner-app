import { useState } from "react";
import { signIn, signUp } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Visuals (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-zinc-950 overflow-hidden items-center justify-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-12 max-w-2xl text-white animate-in slide-in-from-left duration-1000 zoom-in-95">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide">Secure & Encrypted</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Master your money. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
              Master your life.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
            Take control of your finances with our intuitive budget planner. 
            Track spending, set goals, and build the future you deserve.
          </p>
          
          {/* Glassmorphic floating card decoration */}
          <div className="mt-16 relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-blue-600 opacity-20 blur-lg" />
            <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
              <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-zinc-400">Monthly Savings Goal</div>
                <div className="text-2xl font-semibold text-white">+24% on track</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32">
        <div className="w-full max-w-[420px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Mobile Only Header Logo */}
          <div className="flex lg:hidden items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Enter your credentials to access your budget"
                : "Enter your details to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div className="space-y-4">
              <div className="space-y-2 relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/40 border-muted focus-visible:ring-primary/50 transition-all rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2 relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-muted/40 border-muted focus-visible:ring-primary/50 transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in zoom-in-95 duration-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all group"
            >
              {isLoading ? (
                "Processing..."
              ) : mode === "login" ? (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
            
            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center pt-4">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase pt-4">
                <span className="bg-background px-3 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-border/60 bg-transparent hover:bg-muted/30 transition-all"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground/60 pt-6">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
