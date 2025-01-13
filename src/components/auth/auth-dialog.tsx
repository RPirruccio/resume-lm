'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthProvider } from "./auth-context";

const gradientClasses = {
  base: "bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600",
  hover: "hover:from-violet-500 hover:via-blue-500 hover:to-violet-500",
  shadow: "shadow-lg shadow-violet-500/25",
  animation: "transition-all duration-500 animate-gradient-x",
};

interface TabButtonProps {
  value: "login" | "signup";
  children: React.ReactNode;
}

interface AuthDialogProps {
  children?: React.ReactNode;
}

function TabButton({ value, children }: TabButtonProps) {
  const colors = value === "login" 
    ? { active: "violet", hover: "violet" }
    : { active: "blue", hover: "blue" };

  return (
    <TabsTrigger 
      value={value}
      className={`
        relative overflow-hidden rounded-xl text-sm font-medium transition-all duration-500
        data-[state=inactive]:text-muted-foreground/70
        data-[state=active]:text-${colors.active}-600
        data-[state=active]:bg-gradient-to-br
        data-[state=active]:from-white/80
        data-[state=active]:to-white/60
        data-[state=active]:shadow-lg
        data-[state=active]:shadow-${colors.active}-500/10
        data-[state=active]:border
        data-[state=active]:border-${colors.active}-200/50
        data-[state=inactive]:hover:bg-white/50
        data-[state=inactive]:hover:text-${colors.hover}-600
        group
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${colors.active}-500/5 via-blue-500/5 to-${colors.active}-500/5 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10 flex items-center justify-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full bg-${colors.active}-500 opacity-0 group-data-[state=active]:opacity-100 transition-all duration-500 group-data-[state=active]:scale-100 scale-0`} />
        {children}
      </div>
    </TabsTrigger>
  );
}

export function AuthDialog({ children }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            size="lg" 
            className={`${gradientClasses.base} ${gradientClasses.hover} ${gradientClasses.shadow} px-8 ${gradientClasses.animation} group`}
            aria-label="Open authentication dialog"
          >
            Customize Now
            <ArrowRight className="ml-2.5 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent 
        className="sm:max-w-[425px] p-0 bg-white/95 border-white/40 shadow-2xl animate-in fade-in-0 zoom-in-95 relative z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
      >
        <AuthProvider>
          <DialogTitle className="px-8 pt-8 text-center relative">
            <div className="inline-flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
              <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                AI-Powered Resume Builder
              </span>
            </div>
            <Logo className="text-3xl mb-2" asLink={false} />
            <p className="text-muted-foreground text-sm">
              Please Sign In or Sign Up to start your journey towards landing your dream job. 
            </p>
          </DialogTitle>

          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "signup")} 
            className="w-full relative mt-6"
          >
            <TabsList className="w-full h-16 bg-gradient-to-r from-white/30 via-white/40 to-white/30 border-b border-white/40 p-2 grid grid-cols-2 gap-3">
              <TabButton value="login">Sign In</TabButton>
              <TabButton value="signup">Sign Up</TabButton>
            </TabsList>

            <div className="p-8 relative bg-white/50">
              <div 
                className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-violet-200/5 via-blue-200/5 to-violet-200/5 rounded-full blur-xl -z-10 animate-pulse duration-[4000ms]" 
                aria-hidden="true"
              />
              <div 
                className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-gradient-to-br from-blue-200/5 via-violet-200/5 to-blue-200/5 rounded-full blur-xl -z-10 animate-pulse duration-[5000ms]" 
                aria-hidden="true"
              />
              
              <TabsContent value="login" className="relative z-20">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="relative z-20">
                <SignupForm />
              </TabsContent>
            </div>
          </Tabs>
        </AuthProvider>
      </DialogContent>
    </Dialog>
  );
} 