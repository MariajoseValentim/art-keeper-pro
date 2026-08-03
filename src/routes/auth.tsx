import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar na plataforma de curadoria | Curadoria" },
      {
        name: "description",
        content: "Aceda à sua coleção privada: inventário museológico, conservação, certificados e investigação.",
      },
      { property: "og:title", content: "Entrar na plataforma de curadoria" },
      { property: "og:description", content: "Acesso reservado a curadores e colecionadores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/painel", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome, apelido },
          },
        });
        if (error) throw error;
        if (!data.session) toast.info("Verifique o seu email para confirmar a conta.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setOcupado(false);
    }
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no acesso com Google.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <p className="label-caps">Acesso reservado</p>
        <h1 className="mt-2 text-4xl">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-3 text-muted-foreground">
          A sua coleção é privada: apenas vê e edita as peças do seu próprio inventário.
        </p>

        <form onSubmit={submeter} className="plate mt-8 space-y-4 p-6">
          {modo === "registar" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido</Label>
                <Input id="apelido" value={apelido} onChange={(e) => setApelido(e.target.value)} />
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={verPassword ? "text" : "password"}
                required
                minLength={6}
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-accent"
              >
                {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={ocupado} className="w-full">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
          <Button type="button" variant="outline" onClick={google} className="w-full">
            Continuar com Google
          </Button>
          <button
            type="button"
            onClick={() => setModo(modo === "entrar" ? "registar" : "entrar")}
            className="w-full text-sm text-muted-foreground hover:text-accent"
          >
            {modo === "entrar" ? "Ainda não tem conta? Registar" : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
