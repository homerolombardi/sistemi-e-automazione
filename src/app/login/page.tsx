"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  User,
  Phone,
  ArrowLeft,
} from "lucide-react";

type Lang = "it" | "pt";
type Mode = "login" | "register" | "recover";

// Bandeira da Itália em SVG
const FlagIT = ({ className = "w-4 h-3" }: { className?: string }) => (
  <svg
    viewBox="0 0 3 2"
    className={`${className} rounded-[2px] shrink-0 shadow-sm`}
    aria-hidden="true"
  >
    <rect width="1" height="2" x="0" fill="#009246" />
    <rect width="1" height="2" x="1" fill="#ffffff" />
    <rect width="1" height="2" x="2" fill="#ce2b37" />
  </svg>
);

// Bandeira do Brasil em SVG
const FlagBR = ({ className = "w-4 h-3" }: { className?: string }) => (
  <svg
    viewBox="0 0 20 14"
    className={`${className} rounded-[2px] shrink-0 shadow-sm`}
    aria-hidden="true"
  >
    <rect width="20" height="14" fill="#009b3a" />
    <polygon points="10,1.5 18.2,7 10,12.5 1.8,7" fill="#fedf00" />
    <circle cx="10" cy="7" r="3.2" fill="#002776" />
  </svg>
);

const LOGIN_DICT = {
  it: {
    badge: "Area Membri • Il Nostro Quartier Generale",
    title: "Sistemi e Strategie",
    subtitle: "Gestione per l'Acquisizione di Clienti",
    tabLogin: "Accedi",
    tabRegister: "Registrati Gratis",
    emailLabel: "La tua E-mail",
    passLabel: "La tua Password",
    nameLabel: "Nome Completo *",
    ddiLabel: "Prefisso",
    phoneLabel: "Cellulare / WhatsApp *",
    genderLabel: "Genere",
    female: "Femminile",
    male: "Maschile",
    lgpdText:
      "Accetto i Termini di Uso e la Privacy Policy (GDPR/LGPD) e autorizzo l'invio di comunicazioni, novità e contenuti informativi o di marketing.",
    enterBtn: "ACCEDI AL QUARTIER GENERALE",
    entering: "Accesso in corso...",
    registerBtn: "CREA IL MIO ACCOUNT GRATUITO",
    registering: "Registrazione in corso...",
    recoverTitle: "Recupera la tua Password",
    recoverBtn: "INVIA LINK DI RECUPERO",
    recoverSuccess:
      "Abbiamo inviato un link di reimpostazione alla tua e-mail. Controlla la posta in arrivo.",
    forgotPass: "Hai dimenticato la password?",
    backToLogin: "Torna al Login",
    backToPublic: "Continua come Ospite",
    invalidCredentials: "E-mail o password non corretti. Verifica i tuoi dados.",
    lgpdError: "Devi accettare i termini di privacy per continuare.",
    registerSuccess:
      "Registrazione completata! Ora puoi accedere al tuo spazio.",
  },
  pt: {
    badge: "Área de Membros • Nosso Quartel General",
    title: "Sistemas e Estratégias",
    subtitle: "Gestão para Aquisição de Clientes",
    tabLogin: "Entrar",
    tabRegister: "Cadastrar Grátis",
    emailLabel: "Seu E-mail",
    passLabel: "Sua Senha",
    nameLabel: "Nome Completo *",
    ddiLabel: "DDI",
    phoneLabel: "Celular / WhatsApp *",
    genderLabel: "Sexo",
    female: "Feminino",
    male: "Masculino",
    lgpdText:
      "Concordo com os Termos de Uso e Política de Privacidade (LGPD/GDPR) e autorizo o uso dos meus dados para envio de informações, novidades e ações de marketing.",
    enterBtn: "ACESSAR QUARTEL GENERAL",
    entering: "Acessando...",
    registerBtn: "CRIAR MINHA CONTA GRATUITA",
    registering: "Cadastrando...",
    recoverTitle: "Recuperar Senha",
    recoverBtn: "ENVIAR LINK DE RECUPERAÇÃO",
    recoverSuccess:
      "Enviamos um link de redefinição para o seu e-mail. Verifique sua caixa de entrada.",
    forgotPass: "Esqueci minha senha",
    backToLogin: "Voltar para o Login",
    backToPublic: "Continuar como Visitante",
    invalidCredentials: "E-mail ou senha incorretos. Verifique seus dados.",
    lgpdError: "Você precisa concordar com os termos da LGPD para continuar.",
    registerSuccess: "Cadastro concluído! Você já pode acessar o portal.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("it");
  const t = LOGIN_DICT[lang];

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ddi, setDdi] = useState("+39");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("feminino");
  const [acceptLgpd, setAcceptLgpd] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("portal_lang") as Lang | null;
      if (savedLang === "it" || savedLang === "pt") {
        setLang(savedLang);
        setDdi(savedLang === "it" ? "+39" : "+55");
      } else if (typeof navigator !== "undefined") {
        const browserLang = (navigator.language || "it").toLowerCase();
        if (browserLang.startsWith("pt")) {
          setLang("pt");
          setDdi("+55");
        }
      }
    } catch {
      setLang("it");
    }
  }, []);

  const switchLanguage = (newLang: Lang) => {
    setLang(newLang);
    setDdi(newLang === "it" ? "+39" : "+55");
    try {
      localStorage.setItem("portal_lang", newLang);
    } catch {
      //
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMsg(t.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!acceptLgpd) {
      setErrorMsg(t.lgpdError);
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const fullPhone = `${ddi.trim()} ${phone.trim()}`;

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        email: cleanEmail,
        phone: fullPhone,
        gender,
        is_admin: false,
        permissions: ["seguidor"],
      });
    }

    setLoading(false);
    if (data.session) {
      router.push("/");
    } else {
      setSuccessMsg(t.registerSuccess);
      setMode("login");
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/`,
      }
    );

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuccessMsg(t.recoverSuccess);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F8FAFC] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#CBD5E1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#CBD5E1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#121316] border border-[#CBD5E1]/25 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToPublic}
          </button>

          {/* Seletor de Idioma com Bandeiras da Itália e do Brasil */}
          <div className="flex items-center bg-[#09090B] border border-[#CBD5E1]/30 rounded-lg p-1 text-xs gap-1">
            <button
              type="button"
              onClick={() => switchLanguage("it")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                lang === "it"
                  ? "bg-[#CBD5E1] text-[#09090B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <FlagIT />
              <span>IT</span>
            </button>
            <button
              type="button"
              onClick={() => switchLanguage("pt")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                lang === "pt"
                  ? "bg-[#CBD5E1] text-[#09090B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <FlagBR />
              <span>PT</span>
            </button>
          </div>
        </div>

        <div className="text-center space-y-2 mb-6">
          <img
            src="https://clinicaliviadias.com.br/wp-content/uploads/2026/11/logo2.png"
            alt="Logo"
            className="h-16 w-auto mx-auto object-contain mb-3"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#CBD5E1]/15 text-[#E2E8F0] border border-[#CBD5E1]/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> {t.badge}
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wide text-white">
            {t.title}
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8]">
            {t.subtitle}
          </p>
        </div>

        {mode !== "recover" && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#09090B] rounded-xl border border-white/10 mb-6 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
              }}
              className={`py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                mode === "login"
                  ? "bg-[#CBD5E1] text-[#09090B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {t.tabLogin}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
              }}
              className={`py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                mode === "register"
                  ? "bg-[#CBD5E1] text-[#09090B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {t.tabRegister}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs text-center">
            {successMsg}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                {t.passLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setMode("recover");
                  setErrorMsg("");
                }}
                className="text-xs text-[#CBD5E1] hover:underline cursor-pointer"
              >
                {t.forgotPass}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#CBD5E1] hover:bg-[#F1F5F9] disabled:opacity-50 text-[#09090B] font-semibold py-3.5 rounded-xl transition-all cursor-pointer shadow-lg"
            >
              {loading ? t.entering : t.enterBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#CBD5E1] mb-1">{t.nameLabel}</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#CBD5E1] mb-1">
                {t.emailLabel} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[#CBD5E1] mb-1">{t.ddiLabel}</label>
                <input
                  type="text"
                  value={ddi}
                  onChange={(e) => setDdi(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white text-center"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#CBD5E1] mb-1">
                  {t.phoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#09090B] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.genderLabel}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="feminino">{t.female}</option>
                  <option value="masculino">{t.male}</option>
                </select>
              </div>
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.passLabel} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 text-[11px] text-[#94A3B8] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptLgpd}
                onChange={(e) => setAcceptLgpd(e.target.checked)}
                className="mt-0.5"
              />
              <span>{t.lgpdText}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#CBD5E1] hover:bg-[#F1F5F9] disabled:opacity-50 text-[#09090B] font-semibold py-3.5 rounded-xl transition-all cursor-pointer"
            >
              {loading ? t.registering : t.registerBtn}
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form onSubmit={handleRecover} className="space-y-4">
            <h2 className="text-sm font-semibold text-white text-center">
              {t.recoverTitle}
            </h2>
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold py-3 rounded-xl text-xs cursor-pointer"
            >
              {t.recoverBtn}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-xs text-[#94A3B8] hover:text-white py-1 cursor-pointer"
            >
              {t.backToLogin}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}