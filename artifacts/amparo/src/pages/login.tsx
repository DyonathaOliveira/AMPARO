import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import amparoLogo from "@assets/Captura_de_tela_2026-05-29_152616_1780079186016.png";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    setErrorMsg("");
    loginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          setAuthContext(response);
          setLocation("/dashboard");
        },
        onError: () => {
          setErrorMsg("E-mail ou senha inválidos. Verifique suas credenciais.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <img src={amparoLogo} alt="AMPARO Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Sistema de Gestão Clínica
          </h1>
        </div>

        <Card className="border-0 shadow-2xl rounded-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Insira suas credenciais para entrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="nome@amparo.com" type="email" autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium mt-6"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Autenticando..." : "Entrar"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                Ambiente de Demonstração
              </p>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="font-medium text-foreground">Gestor:</span>
                  <span>admin@amparo.com / 123456</span>
                  <span className="font-medium text-foreground">Enfermeiro:</span>
                  <span>enfermeiro@amparo.com / 123456</span>
                  <span className="font-medium text-foreground">Cuidador:</span>
                  <span>cuidador@amparo.com / 123456</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/50">
          © {new Date().getFullYear()} AMPARO Cuidado e Bem-Estar
        </p>
      </div>
    </div>
  );
}
