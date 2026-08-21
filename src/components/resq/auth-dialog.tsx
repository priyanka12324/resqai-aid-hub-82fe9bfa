import { useState } from "react";
import { LogIn, UserPlus, Shield, User, Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, type AppRole } from "@/lib/auth-context";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
}

export function AuthDialog({ open, onOpenChange, defaultTab = "login" }: AuthDialogProps) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("citizen");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPass);
    setLoading(false);
    if (error) {
      toast.error("Login failed", { description: error.message });
    } else {
      toast.success("Signed in successfully");
      onOpenChange(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPass) {
      toast.error("Please enter email and password");
      return;
    }
    if (signupPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPass, {
      fullName,
      phone,
      role,
    });
    setLoading(false);
    if (error) {
      toast.error("Sign up failed", { description: error.message });
    } else {
      toast.success("Account created successfully", {
        description: `Welcome to ResQAI, ${fullName || signupEmail}! Role: ${role.toUpperCase()}`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wider">
            ResQAI Access &amp; Identity
          </DialogTitle>
          <DialogDescription>
            Authenticate with Supabase to submit disaster reports, broadcast SOS signals, or access
            the responder command center.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" /> Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" /> Register
            </TabsTrigger>
          </TabsList>

          {/* SIGN IN TAB */}
          <TabsContent value="login" className="space-y-4 pt-3">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="operator@resqai.org or citizen@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="signup" className="space-y-4 pt-3">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Aarav Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@domain.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-pass">Password</Label>
                <Input
                  id="signup-pass"
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Select Account Role</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as AppRole)}
                  className="grid grid-cols-3 gap-2"
                >
                  <Label
                    htmlFor="role-citizen"
                    className={`flex flex-col items-center justify-between rounded-md border p-2.5 text-center cursor-pointer transition-colors ${
                      role === "citizen"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 hover:bg-surface"
                    }`}
                  >
                    <RadioGroupItem value="citizen" id="role-citizen" className="sr-only" />
                    <User className="h-4 w-4 mb-1" />
                    <span className="text-xs font-semibold">Citizen</span>
                  </Label>
                  <Label
                    htmlFor="role-responder"
                    className={`flex flex-col items-center justify-between rounded-md border p-2.5 text-center cursor-pointer transition-colors ${
                      role === "responder"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border/70 hover:bg-surface"
                    }`}
                  >
                    <RadioGroupItem value="responder" id="role-responder" className="sr-only" />
                    <Radio className="h-4 w-4 mb-1" />
                    <span className="text-xs font-semibold">Responder</span>
                  </Label>
                  <Label
                    htmlFor="role-admin"
                    className={`flex flex-col items-center justify-between rounded-md border p-2.5 text-center cursor-pointer transition-colors ${
                      role === "admin"
                        ? "border-critical bg-critical/10 text-critical"
                        : "border-border/70 hover:bg-surface"
                    }`}
                  >
                    <RadioGroupItem value="admin" id="role-admin" className="sr-only" />
                    <Shield className="h-4 w-4 mb-1" />
                    <span className="text-xs font-semibold">Admin</span>
                  </Label>
                </RadioGroup>
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2 mt-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
