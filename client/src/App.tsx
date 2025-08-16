import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { Navigation } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import ExamTaking from "@/pages/ExamTaking";
import Results from "@/pages/Results";
import Settings from "@/pages/Settings";
import ExamManagement from "@/pages/ExamManagement";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor"]).default("student"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface User {
  id: string;
  username: string;
  role: string;
}

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", role: "student" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Username already exists or invalid data",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">AccessExam</CardTitle>
          <CardDescription className="text-lg">
            Accessible examination platform designed for screen reader users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md focus-visible:outline-2 focus-visible:outline-primary ${
                  isLogin
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsLogin(true)}
                data-testid="button-login-tab"
              >
                Login
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md focus-visible:outline-2 focus-visible:outline-primary ${
                  !isLogin
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsLogin(false)}
                data-testid="button-register-tab"
              >
                Register
              </button>
            </div>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="login-username" className="text-base font-medium">
                  Username
                </Label>
                <Input
                  id="login-username"
                  {...loginForm.register('username')}
                  className="mt-1 text-base focus:ring-2 focus:ring-primary"
                  data-testid="input-login-username"
                />
                {loginForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="login-password" className="text-base font-medium">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  {...loginForm.register('password')}
                  className="mt-1 text-base focus:ring-2 focus:ring-primary"
                  data-testid="input-login-password"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="register-username" className="text-base font-medium">
                  Username
                </Label>
                <Input
                  id="register-username"
                  {...registerForm.register('username')}
                  className="mt-1 text-base focus:ring-2 focus:ring-primary"
                  data-testid="input-register-username"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-password" className="text-base font-medium">
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  {...registerForm.register('password')}
                  className="mt-1 text-base focus:ring-2 focus:ring-primary"
                  data-testid="input-register-password"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-role" className="text-base font-medium">
                  Role
                </Label>
                <select
                  id="register-role"
                  {...registerForm.register('role')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 text-base"
                  data-testid="select-register-role"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Demo credentials: username "student" or "instructor", password "password123"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router({ currentUser }: { currentUser: User }) {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard currentUser={currentUser} />} />
      <Route path="/exam/:id" component={() => <ExamTaking currentUser={currentUser} />} />
      <Route path="/results/:id" component={() => <Results currentUser={currentUser} />} />
      <Route path="/settings" component={() => <Settings currentUser={currentUser} />} />
      {currentUser.role === 'instructor' && (
        <Route path="/exams" component={() => <ExamManagement currentUser={currentUser} />} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AuthForm />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessibilityProvider userId={currentUser.id}>
          <div className="min-h-screen bg-background text-foreground">
            {/* Skip Links */}
            <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
              <a href="#main-content" className="bg-primary text-white px-4 py-2 rounded focus-visible:outline-2 focus-visible:outline-white">
                Skip to main content
              </a>
              <a href="#navigation" className="bg-primary text-white px-4 py-2 rounded ml-2 focus-visible:outline-2 focus-visible:outline-white">
                Skip to navigation
              </a>
            </div>

            <Navigation currentUser={currentUser} onLogout={handleLogout} />
            <Router currentUser={currentUser} />

            {/* Footer */}
            <footer role="contentinfo" className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 mt-12">
              <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
                    <dl className="text-sm space-y-1">
                      <div><dt className="inline font-medium">Alt + R:</dt> <dd className="inline">Read page content</dd></div>
                      <div><dt className="inline font-medium">Alt + N:</dt> <dd className="inline">Next question</dd></div>
                      <div><dt className="inline font-medium">Alt + P:</dt> <dd className="inline">Previous question</dd></div>
                      <div><dt className="inline font-medium">Alt + F:</dt> <dd className="inline">Flag question</dd></div>
                      <div><dt className="inline font-medium">Alt + H:</dt> <dd className="inline">Help menu</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Support</h3>
                    <ul className="text-sm space-y-2">
                      <li><span className="text-gray-600 dark:text-gray-400">Technical Support</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">Accessibility Guide</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">Screen Reader Setup</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">Contact Us</span></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Information</h3>
                    <ul className="text-sm space-y-2">
                      <li><span className="text-gray-600 dark:text-gray-400">Privacy Policy</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">Terms of Service</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">WCAG Compliance</span></li>
                      <li><span className="text-gray-600 dark:text-gray-400">Version 2.1.0</span></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-6 mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>&copy; 2024 AccessExam. Designed for full accessibility compliance with WCAG 2.1 AA standards.</p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </AccessibilityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
