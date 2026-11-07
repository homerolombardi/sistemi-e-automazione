"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import CustomVideoPlayer, {
  extractYouTubeId,
  parseYouTubeUrl,
} from "@/components/CustomVideoPlayer";
import ProtectedPdfReader from "@/components/ProtectedPdfReader";
import ProtectedPageViewer, {
  encodeSecureToken,
} from "@/components/ProtectedPageViewer";
import {
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  X,
  LogOut,
  LogIn,
  Users,
  Video,
  Layers,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Save,
  Upload,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Clock,
  Check,
  ListVideo,
  Tag,
  FileText,
  Lock,
} from "lucide-react";

type ActionType =
  | "internal_view"
  | "protected_pdf"
  | "protected_page"
  | "protected_download"
  | "download"
  | "external_course";
type Lang = "it" | "pt";

interface CardButton {
  action_type: ActionType;
  button_label: string;
  target_url: string;
}

interface Section {
  id: string;
  title: string;
  slug: string;
  display_order: number;
  language?: Lang;
}

interface CustomRole {
  slug: string;
  label: string;
}

interface CardItem {
  id: string;
  section_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge_text: string | null;
  cover_image_url: string;
  banner_image_url: string | null;
  action_type: ActionType;
  target_url: string | null;
  file_download_url: string | null;
  open_in_new_tab: boolean;
  button_label: string;
  buttons?: CardButton[] | null;
  allowed_permissions: string[];
  display_order: number;
  created_at?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_admin: boolean;
  permissions: string[];
  unlocked_cards: string[];
  blocked_cards: string[];
  pdf_study_data?: Record<string, any>;
}

const BASE_PERMISSION_SLUGS = [
  "visitante",
  "seguidor",
  "ex_cliente",
  "cliente_1",
  "cliente_2",
  "cliente_3",
  "cliente_4",
  "cliente_5",
  "cliente_6",
] as const;

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

const DICTIONARY = {
  it: {
    loading: "Caricamento del tuo QG...",
    brandSubtitle: "Gestione per l'Acquisizione di Clienti",
    vipArea: "Area Membri • Il Nostro Quartier Generale",
    viewLabel: "Vista:",
    adminAllCards: "Admin (Tutte le Schede)",
    manageRows: "Organizza Sezioni",
    manageUsers: "Clienti / Accessi",
    addCard: "Aggiungi Scheda",
    changePassword: "Cambia Password",
    logout: "Esci",
    loginRegister: "Accedi / Registrati",
    welcomeUser: "Benvenuto(a),",
    guestLabel: "Ospite",
    defaultHeroTitle: "Sistemi e Strategie",
    defaultHeroSubtitle:
      "Esplora contenuti esclusivi, linee guida e strumenti per il tuo business.",
    newsTitle: "Novità",
    newsSubtitle: "• Ultimi contenuti aggiunti",
    addInRow: "Aggiungi in questa sezione",
    emptyRow: "Nessuna scheda disponibile per questo livello in questa sezione.",
    defaultDescription: "Contenuto esclusivo selezionato per te.",
    watchHere: "Guarda il Video Qui",
    accessNow: "Accedi Ora",
    resetPassTitle: "Reimposta la Mia Password",
    newPassLabel: "Nuova Password (minimo 6 caratteri) *",
    newPassPlaceholder: "Inserisci la nuova password...",
    confirmPassLabel: "Conferma Nuova Password *",
    confirmPassPlaceholder: "Ripeti la nuova password...",
    cancel: "Annulla",
    saving: "Salvataggio...",
    updatePasswordBtn: "Aggiorna Password",
    passMinError: "La nuova password deve contenere almeno 6 caratteri.",
    passMismatchError: "La conferma della password non corrisponde.",
    passUpdateError: "Impossibile aggiornare la password:",
    passUpdateSuccess: "Password aggiornata con successo!",
    newRowPlaceholder: "Nome della nuova sezione...",
    createBtn: "Crea",
    editCardTitle: "Modifica Scheda",
    newCardTitle: "Nuova Scheda",
    rowSectionLabel: "Sezione / Riga",
    badgeLabel: "Badge (Es: Video, Playlist, E-book)",
    titleLabel: "Titolo *",
    subtitleLabel: "Sottotitolo",
    descLabel:
      "Descrizione (I link esterni sono cliccabili e i link YouTube si aprono nel Player Interno)",
    coverLabel: "Immagine di Copertina *",
    uploadCover: "Carica Copertina",
    cardButtonsLabel: "Pulsanti di Azione della Scheda",
    addButton: "Aggiungi Pulsante",
    buttonNumber: "Pulsante #",
    removeBtn: "Rimuovi",
    actionTypeLabel: "Tipo di Azione",
    actionInternal: "Guarda Video / Playlist nel Portale (YouTube)",
    actionProtectedPdf: "Lettore di PDF Protetto (Lettura Continua e Note)",
    actionProtectedPage: "Apri Pagina Protetta nel Portale (Nascondi URL)",
    actionProtectedDownload: "Download Protetto di File / APP (Nascondi Link)",
    actionExternal: "Reindirizza Corso / Link Esterno",
    buttonTextLabel: "Testo del Pulsante *",
    uploadFile: "Carica File",
    defaultPermissionsLabel: "Livelli di Accesso per questa scheda",
    saveCardBtn: "Salva Scheda",
    usersModalTitle: "Gestione Clienti e Accessi",
    newUserBtn: "Nuovo Utente",
    editingUserPrefix: "Modifica:",
    registerNewUser: "Registra Nuovo Cliente",
    closeEdit: "Chiudi Modifica",
    fullNameLabel: "Nome Completo *",
    emailLabel: "E-mail *",
    ddiLabel: "Prefisso",
    phoneLabel: "Cellulare",
    initialPassLabel: "Password Iniziale *",
    mainLevelLabel: "Livello Principale (Tag Globali)",
    newTagPlaceholder: "Es: Cliente 7...",
    addTagBtn: "+ Crea Livello",
    confirmDeleteTag: "Rimuovere questo livello di accesso dalla lista?",
    sectionLangHelp:
      "Ogni sezione viene mostrata solo quando il sito è nella lingua corrispondente (IT o PT).",
    adminCheckbox: "Amministratore",
    customAccessToggle: "Personalizza Accesso a Schede Specifiche (Opzionale)",
    customAccessHelp:
      "Configura eccezioni: forza lo sblocco o il blocco di una scheda per questo utente.",
    ruleDefault: "Regola del Livello",
    ruleUnlock: "Sblocca Accesso",
    ruleBlock: "Blocca Accesso",
    saveSettingsBtn: "Salva Impostazioni",
    manageBtn: "Gestisci",
    exceptionsCount: "eccezioni individuali configurate.",
    confirmDeleteCard:
      "Sei sicuro di voler eliminare definitivamente questa scheda?",
    confirmDeleteSection:
      "L'eliminazione di questa sezione eliminerà anche le schede al suo interno. Confermi?",
    roles: {
      visitante: "Ospite (Non Registrato)",
      seguidor: "Follower (Seguidor)",
      ex_cliente: "Ex-Clienti",
      cliente_1: "Cliente 1",
      cliente_2: "Cliente 2",
      cliente_3: "Cliente 3",
      cliente_4: "Cliente 4",
      cliente_5: "Cliente 5",
      cliente_6: "Cliente 6",
    } as Record<string, string>,
  },
  pt: {
    loading: "Carregando seu QG...",
    brandSubtitle: "Gestão para Aquisição de Clientes",
    vipArea: "Área de Membros • Nosso Quartel General",
    viewLabel: "Visão:",
    adminAllCards: "Admin (Todos os Cards)",
    manageRows: "Organizar Fileiras",
    manageUsers: "Clientes / Acessos",
    addCard: "Incluir Card",
    changePassword: "Alterar Senha",
    logout: "Sair",
    loginRegister: "Entrar / Cadastrar",
    welcomeUser: "Bem-vindo(a),",
    guestLabel: "Visitante",
    defaultHeroTitle: "Sistemas e Estratégias",
    defaultHeroSubtitle:
      "Explore conteúdos exclusivos, orientações e ferramentas para o seu negócio.",
    newsTitle: "Novidades",
    newsSubtitle: "• Últimos conteúdos adicionados",
    addInRow: "Adicionar nesta fileira",
    emptyRow: "Nenhum card cadastrado para este filtro nesta fileira.",
    defaultDescription: "Conteúdo exclusivo selecionado para você.",
    watchHere: "Assistir Vídeo Aqui",
    accessNow: "Acessar Agora",
    resetPassTitle: "Redefinir Minha Senha",
    newPassLabel: "Nova Senha (mínimo 6 caracteres) *",
    newPassPlaceholder: "Digite sua nova senha...",
    confirmPassLabel: "Confirmar Nova Senha *",
    confirmPassPlaceholder: "Repita a nova senha...",
    cancel: "Cancelar",
    saving: "Salvando...",
    updatePasswordBtn: "Atualizar Senha",
    passMinError: "A nova senha deve ter pelo menos 6 caracteres.",
    passMismatchError: "A confirmação de senha não confere.",
    passUpdateError: "Não foi possível alterar a senha:",
    passUpdateSuccess: "Sua senha foi atualizada com sucesso!",
    newRowPlaceholder: "Nome da nova fileira...",
    createBtn: "Criar",
    editCardTitle: "Editar Card",
    newCardTitle: "Novo Card",
    rowSectionLabel: "Fileira / Seção",
    badgeLabel: "Selo (Ex: Vídeo, Playlist, E-book)",
    titleLabel: "Título *",
    subtitleLabel: "Subtítulo",
    descLabel:
      "Descrição (Links externos ficam clicáveis e links do YouTube abrem no Player Interno)",
    coverLabel: "Imagem de Capa *",
    uploadCover: "Enviar Capa",
    cardButtonsLabel: "Botões de Ação do Card",
    addButton: "Adicionar Botão",
    buttonNumber: "Botão #",
    removeBtn: "Remover",
    actionTypeLabel: "Tipo de Ação",
    actionInternal: "Assistir Vídeo / Playlist no Portal (YouTube)",
    actionProtectedPdf: "Leitor de PDF Protegido (Leitura Contínua e Notas)",
    actionProtectedPage: "Abrir Página Protegida no Portal (Ocultar URL)",
    actionProtectedDownload: "Download Protegido de Arquivo / APP (Ocultar Link)",
    actionExternal: "Redirecionar Curso / Link Externo",
    buttonTextLabel: "Texto do Botão *",
    uploadFile: "Enviar Arquivo",
    defaultPermissionsLabel: "Permissões Padrão para ver este card",
    saveCardBtn: "Salvar Card",
    usersModalTitle: "Gestão de Clientes e Acessos",
    newUserBtn: "Novo Usuário",
    editingUserPrefix: "Editando:",
    registerNewUser: "Cadastrar Novo Cliente",
    closeEdit: "Fechar Edição",
    fullNameLabel: "Nome Completo *",
    emailLabel: "E-mail *",
    ddiLabel: "DDI",
    phoneLabel: "Celular",
    initialPassLabel: "Senha Inicial *",
    mainLevelLabel: "Nível Principal (Tags Globais)",
    newTagPlaceholder: "Ex: Cliente 7...",
    addTagBtn: "+ Criar Tag",
    confirmDeleteTag: "Deseja remover esta tag de acesso da lista?",
    sectionLangHelp:
      "Cada fileira só aparece quando o site está no respectivo idioma selecionado (IT ou PT).",
    adminCheckbox: "Administrador",
    customAccessToggle: "Personalizar Acessos a Cards Específicos (Opcional)",
    customAccessHelp:
      "Configure exceções: force a liberação ou o bloqueio de um card para este usuário.",
    ruleDefault: "Regra da Tag",
    ruleUnlock: "Liberar Acesso",
    ruleBlock: "Bloquear Acesso",
    saveSettingsBtn: "Salvar Configurações",
    manageBtn: "Gerenciar",
    exceptionsCount: "exceções individuais configuradas.",
    confirmDeleteCard:
      "Tem certeza que deseja excluir este card permanentemente?",
    confirmDeleteSection:
      "Excluir esta fileira também excluirá os cards dentro dela. Confirmar?",
    roles: {
      visitante: "Visitante (Não Cadastrado)",
      seguidor: "Seguidor",
      ex_cliente: "Ex-clientes",
      cliente_1: "Cliente 1",
      cliente_2: "Cliente 2",
      cliente_3: "Cliente 3",
      cliente_4: "Cliente 4",
      cliente_5: "Cliente 5",
      cliente_6: "Cliente 6",
    } as Record<string, string>,
  },
};

const N8N_WEBHOOK_URL =
  "https://n8n.livia.psc.br/webhook/0f7f9f3a-f511-43f5-b692-991c91c298b7";

export default function MemberPortalPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("it");
  const t = DICTIONARY[lang];

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [newRoleName, setNewRoleName] = useState("");

  const [heroSettings, setHeroSettings] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_video_url:
      "https://clinicaliviadias.com.br/wp-content/uploads/2026/10/Apresent.mp4",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

  const [simulatedRole, setSimulatedRole] = useState<string>("todos");
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    title: string;
    subtitle?: string | null;
    coverUrl?: string;
  } | null>(null);

  const [activePdf, setActivePdf] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [activeProtectedPage, setActiveProtectedPage] = useState<{
    url: string;
    title: string;
    subtitle?: string | null;
  } | null>(null);

  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingButtonIdx, setUploadingButtonIdx] = useState<number | null>(
    null
  );

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionLang, setNewSectionLang] = useState<Lang>("it");
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showAdvancedAccess, setShowAdvancedAccess] = useState(false);

  const [userForm, setUserForm] = useState({
    nome: "",
    email: "",
    ddi: "+39",
    telefone: "",
    senha: "",
    is_admin: false,
    permissions: ["seguidor"] as string[],
    unlocked_cards: [] as string[],
    blocked_cards: [] as string[],
  });
  const [savingUser, setSavingUser] = useState(false);

  const [formData, setFormData] = useState({
    section_id: "",
    title: "",
    subtitle: "",
    description: "",
    badge_text: "Video",
    cover_image_url: "",
    open_in_new_tab: true,
    allowed_permissions: [] as string[],
    buttons: [
      {
        action_type: "internal_view" as ActionType,
        button_label: "Accedi Ora",
        target_url: "",
      },
    ] as CardButton[],
  });

  const allPermissionSlugs = [
    ...BASE_PERMISSION_SLUGS,
    ...customRoles
      .map((r) => r.slug)
      .filter((s) => !BASE_PERMISSION_SLUGS.includes(s as any)),
  ];

  const getRoleLabel = (slug: string): string => {
    if (t.roles[slug]) return t.roles[slug];
    const found = customRoles.find((r) => r.slug === slug);
    return found ? found.label : slug;
  };

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("portal_lang") as Lang | null;
      if (savedLang === "it" || savedLang === "pt") {
        setLang(savedLang);
        setNewSectionLang(savedLang);
      } else if (typeof navigator !== "undefined") {
        const browserLang = (
          navigator.language ||
          (navigator.languages && navigator.languages[0]) ||
          "it"
        ).toLowerCase();
        if (browserLang.startsWith("pt")) {
          setLang("pt");
          setNewSectionLang("pt");
        } else {
          setLang("it");
          setNewSectionLang("it");
        }
      }
    } catch {
      setLang("it");
    }

    loadPortalData();
  }, []);

  const switchLanguage = (newLang: Lang) => {
    setLang(newLang);
    setNewSectionLang(newLang);
    try {
      localStorage.setItem("portal_lang", newLang);
    } catch {}
  };

  async function loadPortalData() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userProfile) {
        setProfile({
          ...userProfile,
          unlocked_cards: userProfile.unlocked_cards || [],
          blocked_cards: userProfile.blocked_cards || [],
          pdf_study_data: userProfile.pdf_study_data || {},
        });
      }
    } else {
      setProfile(null);
    }

    const { data: settingsData } = await supabase
      .from("portal_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (settingsData) {
      setHeroSettings(settingsData);
      if (Array.isArray(settingsData.custom_roles)) {
        setCustomRoles(settingsData.custom_roles);
      }
    }

    const { data: sectionsData } = await supabase
      .from("sections")
      .select("*")
      .order("display_order", { ascending: true });
    const { data: cardsData } = await supabase
      .from("cards")
      .select("*")
      .order("display_order", { ascending: true });

    if (sectionsData) {
      setSections(sectionsData);
      if (sectionsData.length > 0 && !formData.section_id) {
        setFormData((prev) => ({ ...prev, section_id: sectionsData[0].id }));
      }
    }
    if (cardsData) setCards(cardsData);

    setLoading(false);
  }

  const handleAddCustomRole = async () => {
    const label = newRoleName.trim();
    if (!label) return;

    const slug = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (!slug || allPermissionSlugs.includes(slug)) {
      setNewRoleName("");
      return;
    }

    const updatedRoles = [...customRoles, { slug, label }];
    setCustomRoles(updatedRoles);
    setNewRoleName("");

    await supabase
      .from("portal_settings")
      .update({ custom_roles: updatedRoles })
      .eq("id", 1);
  };

  const handleDeleteCustomRole = async (slugToRemove: string) => {
    if (!confirm(t.confirmDeleteTag)) return;
    const updatedRoles = customRoles.filter((r) => r.slug !== slugToRemove);
    setCustomRoles(updatedRoles);

    await supabase
      .from("portal_settings")
      .update({ custom_roles: updatedRoles })
      .eq("id", 1);
  };

  const isPlayableVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const parsed = parseYouTubeUrl(url);
    if (
      parsed.videoId ||
      parsed.playlistId ||
      parsed.customVideoIds.length > 0
    ) {
      return true;
    }
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  const renderDescriptionWithLinks = (
    text: string | null,
    cardContext?: CardItem
  ) => {
    const content = text || t.defaultDescription;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const cleanUrl = part.replace(/[.,;!?)]+$/, "");
        const trailingPunct = part.slice(cleanUrl.length);
        const href = cleanUrl.toLowerCase().startsWith("http")
          ? cleanUrl
          : `https://${cleanUrl}`;

        if (extractYouTubeId(href)) {
          return (
            <React.Fragment key={index}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVideo({
                    url: href,
                    title: cardContext?.title || "Video",
                    subtitle: cardContext?.subtitle,
                    coverUrl: cardContext?.cover_image_url,
                  });
                }}
                className="inline-flex items-center gap-1 text-[#CBD5E1] hover:text-white underline underline-offset-2 font-semibold cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 inline" /> {t.watchHere}
              </button>
              {trailingPunct}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#CBD5E1] hover:text-white underline underline-offset-2 break-all font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {cleanUrl}
            </a>
            {trailingPunct}
          </React.Fragment>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const getCardButtons = (card: CardItem): CardButton[] => {
    if (
      card.buttons &&
      Array.isArray(card.buttons) &&
      card.buttons.length > 0
    ) {
      return card.buttons;
    }
    const legacyUrl =
      card.action_type === "download" ||
      card.action_type === "protected_download"
        ? card.file_download_url || card.target_url || "#"
        : card.target_url || "#";
    return [
      {
        action_type: card.action_type || "internal_view",
        button_label: card.button_label || t.accessNow,
        target_url: legacyUrl,
      },
    ];
  };

  const handleCardButtonAction = (card: CardItem, btn: CardButton) => {
    const url = (btn.target_url || "").trim();
    if (!url || url === "#") return;

    const fullTitle = `${card.title}${
      btn.button_label ? ` • ${btn.button_label}` : ""
    }`;

    if (btn.action_type === "protected_pdf") {
      setActivePdf({ url, title: fullTitle });
      return;
    }

    if (btn.action_type === "protected_page") {
      setActiveProtectedPage({
        url,
        title: fullTitle,
        subtitle: card.subtitle,
      });
      return;
    }

    if (
      btn.action_type === "protected_download" ||
      btn.action_type === "download" ||
      /\.(apk|zip|rar|pdf|docx?|xlsx?|pptx?|epub)(\?.*)?$/i.test(url)
    ) {
      const isLocalhost =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost";
      const isSupabaseUrl = url.includes("supabase.co");

      if (isLocalhost || isSupabaseUrl) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const safeName = card.title.replace(/[^a-zA-Z0-9._-]/g, "_");
      const token = encodeSecureToken(url);
      const proxyDownloadUrl = `/api/secure-proxy.php?m=download&name=${encodeURIComponent(
        safeName
      )}&k=${token}`;
      window.open(proxyDownloadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.action_type === "internal_view" || isPlayableVideoUrl(url)) {
      setActiveVideo({
        url,
        title: fullTitle,
        subtitle: card.subtitle,
        coverUrl: card.cover_image_url,
      });
      return;
    }

    if (card.open_in_new_tab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  };

  const isCardVisibleToUser = (card: CardItem) => {
    if (profile?.is_admin) {
      if (simulatedRole === "todos") return true;
      return card.allowed_permissions?.includes(simulatedRole);
    }

    if (!profile) {
      return card.allowed_permissions?.includes("visitante") || false;
    }

    const isBlocked = profile.blocked_cards?.includes(card.id);
    if (isBlocked) return false;

    const isUnlocked = profile.unlocked_cards?.includes(card.id);
    if (isUnlocked) return true;

    return card.allowed_permissions?.some((perm) =>
      profile.permissions?.includes(perm)
    );
  };

  const languageSections = sections.filter(
    (s) => (s.language || "it") === lang
  );
  const languageSectionIds = new Set(languageSections.map((s) => s.id));

  const getVisibleCardsForSection = (sectionId: string) => {
    return cards.filter(
      (card) => card.section_id === sectionId && isCardVisibleToUser(card)
    );
  };

  const allVisibleCardsInCurrentLang = cards.filter(
    (card) =>
      languageSectionIds.has(card.section_id) && isCardVisibleToUser(card)
  );

  const newestCardsList = [...allVisibleCardsInCurrentLang]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  const handleUpdateOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: t.passMinError,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: t.passMismatchError,
      });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSavingPassword(false);

    if (error) {
      setPasswordFeedback({
        type: "error",
        message: `${t.passUpdateError} ${error.message}`,
      });
      return;
    }

    setPasswordFeedback({
      type: "success",
      message: t.passUpdateSuccess,
    });
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordFeedback(null);
    }, 1800);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const fileExt = file.name.split(".").pop();
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(`_${fileExt}`, "");
    const filePath = `capas/${Date.now()}_${cleanFileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("portal_media")
      .upload(filePath, file);

    if (uploadError) {
      alert("Erro no upload da imagem.");
      setUploadingCover(false);
      return;
    }

    const { data } = supabase.storage
      .from("portal_media")
      .getPublicUrl(filePath);
    setFormData((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
    setUploadingCover(false);
  };

  const handleButtonFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    btnIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingButtonIdx(btnIndex);
    const fileExt = file.name.split(".").pop();
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(`_${fileExt}`, "");
    const filePath = `arquivos/${Date.now()}_${cleanFileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("portal_media")
      .upload(filePath, file);

    if (uploadError) {
      alert("Erro no upload do arquivo.");
      setUploadingButtonIdx(null);
      return;
    }

    const { data } = supabase.storage
      .from("portal_media")
      .getPublicUrl(filePath);

    setFormData((prev) => {
      const updatedButtons = [...prev.buttons];
      updatedButtons[btnIndex] = {
        ...updatedButtons[btnIndex],
        target_url: data.publicUrl,
      };
      return { ...prev, buttons: updatedButtons };
    });
    setUploadingButtonIdx(null);
  };

  const addButtonToForm = () => {
    setFormData((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          action_type: "internal_view",
          button_label: t.accessNow,
          target_url: "",
        },
      ],
    }));
  };

  const removeButtonFromForm = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  const updateButtonInForm = (
    index: number,
    field: keyof CardButton,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.buttons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, buttons: updated };
    });
  };

  const openNewCardModal = (sectionId?: string) => {
    setEditingCardId(null);
    const defaultSectionId =
      sectionId || languageSections[0]?.id || sections[0]?.id || "";
    setFormData({
      section_id: defaultSectionId,
      title: "",
      subtitle: "",
      description: "",
      badge_text: "Video",
      cover_image_url: "",
      open_in_new_tab: true,
      allowed_permissions: [],
      buttons: [
        {
          action_type: "internal_view",
          button_label: t.accessNow,
          target_url: "",
        },
      ],
    });
    setIsCardFormOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryBtn = formData.buttons[0] || {
      action_type: "internal_view" as ActionType,
      button_label: t.accessNow,
      target_url: "",
    };

    const payload = {
      section_id: formData.section_id,
      title: formData.title,
      subtitle: formData.subtitle,
      description: formData.description,
      badge_text: formData.badge_text,
      cover_image_url: formData.cover_image_url,
      open_in_new_tab: formData.open_in_new_tab,
      allowed_permissions: formData.allowed_permissions,
      action_type: primaryBtn.action_type,
      button_label: primaryBtn.button_label,
      target_url: primaryBtn.target_url,
      file_download_url:
        primaryBtn.action_type === "download" ||
        primaryBtn.action_type === "protected_download"
          ? primaryBtn.target_url
          : "",
      buttons: formData.buttons,
    };

    if (editingCardId) {
      await supabase.from("cards").update(payload).eq("id", editingCardId);
    } else {
      await supabase.from("cards").insert([payload]);
    }
    setIsCardFormOpen(false);
    setEditingCardId(null);
    loadPortalData();
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm(t.confirmDeleteCard)) return;
    await supabase.from("cards").delete().eq("id", id);
    setSelectedCard(null);
    loadPortalData();
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    const slug = newSectionTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");
    const nextOrder =
      sections.length > 0
        ? Math.max(...sections.map((s) => s.display_order || 0)) + 1
        : 1;
    await supabase.from("sections").insert([
      {
        title: newSectionTitle.trim(),
        slug: `${slug}-${Date.now().toString().slice(-3)}`,
        display_order: nextOrder,
        language: newSectionLang,
      },
    ]);
    setNewSectionTitle("");
    loadPortalData();
  };

  const handleUpdateSectionTitle = async (sec: Section) => {
    await supabase
      .from("sections")
      .update({ title: sec.title, language: sec.language || "it" })
      .eq("id", sec.id);
    setEditingSection(null);
    loadPortalData();
  };

  const handleToggleSectionLanguage = async (
    sec: Section,
    targetLang: Lang
  ) => {
    await supabase
      .from("sections")
      .update({ language: targetLang })
      .eq("id", sec.id);
    setSections((prev) =>
      prev.map((s) => (s.id === sec.id ? { ...s, language: targetLang } : s))
    );
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm(t.confirmDeleteSection)) return;
    await supabase.from("sections").delete().eq("id", id);
    loadPortalData();
  };

  const moveSectionOrder = async (
    sectionId: string,
    direction: "up" | "down"
  ) => {
    const currentList = sections.filter((s) => (s.language || "it") === lang);
    const index = currentList.findIndex((s) => s.id === sectionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= currentList.length)
      return;

    const updatedLangList = [...currentList];
    const temp = updatedLangList[index];
    updatedLangList[index] = updatedLangList[targetIndex];
    updatedLangList[targetIndex] = temp;

    for (let i = 0; i < updatedLangList.length; i++) {
      await supabase
        .from("sections")
        .update({ display_order: i + 1 })
        .eq("id", updatedLangList[i].id);
    }
    loadPortalData();
  };

  const openUsersManagement = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAllProfiles(data);
    setIsUsersModalOpen(true);
  };

  const openNewUserForm = () => {
    setEditingUser(null);
    setShowAdvancedAccess(false);
    setUserForm({
      nome: "",
      email: "",
      ddi: lang === "it" ? "+39" : "+55",
      telefone: "",
      senha: "",
      is_admin: false,
      permissions: ["seguidor"],
      unlocked_cards: [],
      blocked_cards: [],
    });
    setIsUserFormOpen(true);
  };

  const openEditUserForm = (u: Profile) => {
    setEditingUser(u);
    setShowAdvancedAccess(false);
    let extractedDdi = lang === "it" ? "+39" : "+55";
    let extractedPhone = u.phone || "";
    if (u.phone && u.phone.startsWith("+")) {
      const parts = u.phone.split(" ");
      if (parts.length > 1) {
        extractedDdi = parts[0];
        extractedPhone = parts.slice(1).join(" ");
      }
    }
    setUserForm({
      nome: u.full_name || "",
      email: u.email || "",
      ddi: extractedDdi,
      telefone: extractedPhone,
      senha: "",
      is_admin: u.is_admin || false,
      permissions: u.permissions || ["seguidor"],
      unlocked_cards: u.unlocked_cards || [],
      blocked_cards: u.blocked_cards || [],
    });
    setIsUserFormOpen(true);
  };

  const handleSaveManualUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    const cleanDdi = userForm.ddi.trim().startsWith("+")
      ? userForm.ddi.trim()
      : `+${userForm.ddi.trim()}`;
    const fullPhone = userForm.telefone.trim()
      ? `${cleanDdi} ${userForm.telefone.trim()}`
      : "";

    if (editingUser) {
      await supabase
        .from("profiles")
        .update({
          full_name: userForm.nome,
          phone: fullPhone,
          is_admin: userForm.is_admin,
          permissions: userForm.permissions,
          unlocked_cards: userForm.unlocked_cards,
          blocked_cards: userForm.blocked_cards,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id);
    } else {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: userForm.nome,
            email: userForm.email.trim().toLowerCase(),
            ddi: cleanDdi,
            telefone: fullPhone,
            senha: userForm.senha || "Mudar@123",
            permissao: userForm.permissions[0] || "seguidor",
          }),
        });
        await new Promise((r) => setTimeout(r, 1500));
        await supabase
          .from("profiles")
          .update({
            full_name: userForm.nome,
            phone: fullPhone,
            is_admin: userForm.is_admin,
            permissions: userForm.permissions,
            unlocked_cards: userForm.unlocked_cards,
            blocked_cards: userForm.blocked_cards,
          })
          .eq("email", userForm.email.trim().toLowerCase());
      } catch {
        alert("Verifique se o workflow do n8n está ativo.");
      }
    }
    setSavingUser(false);
    setIsUserFormOpen(false);
    openUsersManagement();
  };

  const toggleUserPermission = async (user: Profile, permSlug: string) => {
    const current = user.permissions || [];
    const updated = current.includes(permSlug)
      ? current.filter((p) => p !== permSlug)
      : [...current, permSlug];

    await supabase
      .from("profiles")
      .update({ permissions: updated })
      .eq("id", user.id);

    setAllProfiles((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, permissions: updated } : u))
    );
  };

  const renderCompactNewsItem = (card: CardItem) => {
    return (
      <div
        key={`news-${card.id}`}
        onClick={() => setSelectedCard(card)}
        className="group relative h-24 md:h-28 rounded-xl overflow-hidden bg-[#121316] border border-white/10 hover:border-[#CBD5E1] transition-all duration-300 hover:-translate-y-0.5 shadow-lg cursor-pointer flex items-center"
      >
        <img
          src={card.cover_image_url}
          alt={card.title}
          className="w-20 md:w-24 h-full object-cover shrink-0 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
          {card.badge_text && (
            <span className="inline-block w-fit mb-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold bg-white/10 text-[#E2E8F0] border border-[#CBD5E1]/30">
              {card.badge_text}
            </span>
          )}
          <h3 className="text-xs md:text-sm font-bold text-white leading-tight line-clamp-1">
            {card.title}
          </h3>
          {card.subtitle && (
            <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-1">
              {card.subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCardItem = (card: CardItem) => {
    return (
      <div
        key={card.id}
        onClick={() => setSelectedCard(card)}
        className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#121316] border border-white/10 hover:border-[#CBD5E1] transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer"
      >
        <img
          src={card.cover_image_url}
          alt={card.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {card.badge_text && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-black/80 text-[#E2E8F0] border border-[#CBD5E1]/40 backdrop-blur-md">
            {card.badge_text}
          </span>
        )}

        {profile?.is_admin && (
          <div
            className="absolute top-3 right-3 flex gap-1.5 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setEditingCardId(card.id);
                setFormData({
                  section_id: card.section_id,
                  title: card.title,
                  subtitle: card.subtitle || "",
                  description: card.description || "",
                  badge_text: card.badge_text || "",
                  cover_image_url: card.cover_image_url,
                  open_in_new_tab: card.open_in_new_tab,
                  allowed_permissions: card.allowed_permissions || [],
                  buttons: getCardButtons(card),
                });
                setIsCardFormOpen(true);
              }}
              className="p-1.5 rounded-lg bg-black/80 text-white hover:text-[#CBD5E1] cursor-pointer"
              title={t.editCardTitle}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteCard(card.id)}
              className="p-1.5 rounded-lg bg-black/80 text-red-400 hover:text-red-300 cursor-pointer"
              title={t.removeBtn}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-sm md:text-base font-bold text-white leading-snug line-clamp-2">
            {card.title}
          </h3>
          {card.subtitle && (
            <p className="text-xs text-[#CBD5E1] mt-1 line-clamp-1">
              {card.subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#CBD5E1] flex items-center justify-center">
        <div className="animate-pulse text-sm tracking-widest uppercase">
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F8FAFC] font-sans">
      <header className="fixed top-0 left-0 right-0 z-40 flex flex-wrap items-center justify-between gap-4 px-6 md:px-12 py-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <img
            src="https://clinicaliviadias.com.br/wp-content/uploads/2026/11/logo2.png"
            alt="Logo"
            className="h-11 w-auto object-contain"
          />
          <div>
            <span className="text-[11px] tracking-[0.22em] text-[#CBD5E1] uppercase block">
              {t.brandSubtitle}
            </span>
            <span className="text-lg font-serif font-bold tracking-wide text-white">
              {t.vipArea}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#121316] border border-[#CBD5E1]/30 rounded-lg p-1 text-xs gap-1">
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

          {profile?.is_admin && (
            <>
              <div className="flex items-center gap-2 bg-[#121316] border border-[#CBD5E1]/30 rounded-lg px-3 py-1.5 text-xs">
                <Eye className="w-4 h-4 text-[#CBD5E1]" />
                <span className="text-[#94A3B8] hidden sm:inline">
                  {t.viewLabel}
                </span>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="todos" className="bg-[#121316]">
                    {t.adminAllCards}
                  </option>
                  {allPermissionSlugs.map((slug) => (
                    <option key={slug} value={slug} className="bg-[#121316]">
                      {getRoleLabel(slug)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsSectionsModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#121316] hover:bg-white/10 border border-white/15 text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#CBD5E1]" /> {t.manageRows}
              </button>
              <button
                onClick={openUsersManagement}
                className="flex items-center gap-1.5 bg-[#121316] hover:bg-white/10 border border-white/15 text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#CBD5E1]" /> {t.manageUsers}
              </button>
              <button
                onClick={() => openNewCardModal()}
                className="flex items-center gap-1.5 bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-lg shadow-white/10"
              >
                <Plus className="w-4 h-4" /> {t.addCard}
              </button>
            </>
          )}

          {profile ? (
            <>
              <button
                onClick={() => {
                  setPasswordFeedback(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsPasswordModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-[#121316] hover:bg-white/10 border border-white/15 text-xs text-[#E2E8F0] hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#CBD5E1]" />
                <span className="hidden sm:inline">{t.changePassword}</span>
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setProfile(null);
                  router.push("/login");
                }}
                className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white px-2 py-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.loginRegister}</span>
            </button>
          )}
        </div>
      </header>

      <section className="relative w-full h-[68vh] min-h-[440px] flex items-end pb-14 px-6 md:px-12 overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={heroSettings.hero_video_url}
          autoPlay
          muted
          playsInline
          onEnded={() => {
            setIsVideoEnded(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoEnded ? "opacity-60" : "opacity-90"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-[#09090B]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-black/50" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#CBD5E1]/15 text-[#E2E8F0] border border-[#CBD5E1]/40">
            <Sparkles className="w-3.5 h-3.5" /> {t.welcomeUser}{" "}
            {profile?.full_name || t.guestLabel}
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
            {t.defaultHeroTitle}
          </h1>
          <p className="text-sm md:text-base text-[#CBD5E1] leading-relaxed">
            {t.defaultHeroSubtitle}
          </p>
        </div>
      </section>

      <main
        id="trilhas"
        className="relative z-20 -mt-4 pb-24 space-y-10 px-6 md:px-12"
      >
        {newestCardsList.length > 0 && (
          <div className="space-y-3 bg-[#121316]/80 border border-[#CBD5E1]/20 rounded-2xl p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#CBD5E1]" />
                <h2 className="text-sm md:text-base font-serif font-semibold text-white tracking-wide uppercase">
                  {t.newsTitle}
                </h2>
                <span className="text-xs text-[#94A3B8] hidden sm:inline">
                  {t.newsSubtitle}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {newestCardsList.map((card) => renderCompactNewsItem(card))}
            </div>
          </div>
        )}

        {languageSections.map((section, idx) => {
          const sectionCards = getVisibleCardsForSection(section.id);
          if (sectionCards.length === 0 && !profile?.is_admin) return null;

          return (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg md:text-xl font-serif font-semibold text-white tracking-wide">
                    {section.title}
                  </h2>
                  {profile?.is_admin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSectionOrder(section.id, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20 text-[#CBD5E1] cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSectionOrder(section.id, "down")}
                        disabled={idx === languageSections.length - 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20 text-[#CBD5E1] cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {profile?.is_admin && (
                  <button
                    onClick={() => openNewCardModal(section.id)}
                    className="text-xs text-[#CBD5E1] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t.addInRow}
                  </button>
                )}
              </div>

              {sectionCards.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#94A3B8]">
                  {t.emptyRow}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {sectionCards.map((card) => renderCardItem(card))}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {selectedCard && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#CBD5E1]/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:text-[#CBD5E1] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
              <img
                src={selectedCard.cover_image_url}
                alt={selectedCard.title}
                className="w-36 md:w-44 aspect-[2/3] object-cover rounded-xl border border-white/10 shrink-0 mx-auto md:mx-0 self-start"
              />
              <div className="space-y-4 flex-1">
                {selectedCard.badge_text && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-[#CBD5E1]/20 text-[#E2E8F0]">
                    {selectedCard.badge_text}
                  </span>
                )}
                <h2 className="text-2xl font-serif font-bold text-white">
                  {selectedCard.title}
                </h2>
                {selectedCard.subtitle && (
                  <p className="text-sm text-[#CBD5E1]">
                    {selectedCard.subtitle}
                  </p>
                )}
                <div className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                  {renderDescriptionWithLinks(
                    selectedCard.description,
                    selectedCard
                  )}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  {getCardButtons(selectedCard).map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCardButtonAction(selectedCard, btn)}
                      className="inline-flex items-center gap-2 bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-md shadow-white/10 cursor-pointer"
                    >
                      {btn.action_type === "protected_pdf" ? (
                        <FileText className="w-4 h-4" />
                      ) : btn.action_type === "protected_page" ? (
                        <Lock className="w-4 h-4" />
                      ) : btn.action_type === "protected_download" ||
                        btn.action_type === "download" ? (
                        <Download className="w-4 h-4" />
                      ) : btn.action_type === "external_course" ? (
                        <ExternalLink className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      {btn.button_label || t.accessNow}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER DE VÍDEO BLINDADO */}
      {activeVideo && (
        <CustomVideoPlayer
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          subtitle={activeVideo.subtitle}
          coverUrl={activeVideo.coverUrl}
          lang={lang}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* LEITOR DE PDF PROTEGIDO (LEITURA CONTÍNUA E NOTAS) */}
      {activePdf && (
        <ProtectedPdfReader
          pdfUrl={activePdf.url}
          title={activePdf.title}
          profileId={profile?.id}
          studyData={profile?.pdf_study_data}
          lang={lang}
          onClose={() => {
            setActivePdf(null);
            loadPortalData();
          }}
        />
      )}

      {/* PÁGINA PROTEGIDA NO PORTAL */}
      {activeProtectedPage && (
        <ProtectedPageViewer
          pageUrl={activeProtectedPage.url}
          title={activeProtectedPage.title}
          subtitle={activeProtectedPage.subtitle}
          userIdentifier={profile?.email || t.guestLabel}
          lang={lang}
          onClose={() => setActiveProtectedPage(null)}
        />
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateOwnPassword}
            className="bg-[#121316] border border-[#CBD5E1]/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#CBD5E1]" />
                <h3 className="text-lg font-serif font-bold text-white">
                  {t.resetPassTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordFeedback.type === "success"
                    ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-200"
                    : "bg-red-950/70 border border-red-500/40 text-red-200"
                }`}
              >
                {passwordFeedback.type === "success" && (
                  <Check className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.newPassLabel}
                </label>
                <input
                  type="password"
                  required
                  placeholder={t.newPassPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.confirmPassLabel}
                </label>
                <input
                  type="password"
                  required
                  placeholder={t.confirmPassPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl p-3 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-[#CBD5E1] hover:bg-[#F1F5F9] disabled:opacity-50 text-[#09090B] font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer"
              >
                {savingPassword ? t.saving : t.updatePasswordBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {isSectionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#CBD5E1]/30 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                {t.manageRows}
              </h3>
              <button
                onClick={() => setIsSectionsModalOpen(false)}
                className="text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#94A3B8]">{t.sectionLangHelp}</p>

            <form
              onSubmit={handleCreateSection}
              className="flex flex-wrap sm:flex-nowrap gap-2"
            >
              <div className="flex items-center bg-[#09090B] border border-white/15 rounded-xl p-1 text-xs gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewSectionLang("it")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    newSectionLang === "it"
                      ? "bg-[#CBD5E1] text-[#09090B]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <FlagIT /> IT
                </button>
                <button
                  type="button"
                  onClick={() => setNewSectionLang("pt")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    newSectionLang === "pt"
                      ? "bg-[#CBD5E1] text-[#09090B]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <FlagBR /> PT
                </button>
              </div>

              <input
                type="text"
                placeholder={t.newRowPlaceholder}
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="flex-1 bg-[#09090B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="submit"
                className="bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> {t.createBtn}
              </button>
            </form>

            <div className="overflow-y-auto space-y-2.5 pr-1">
              {sections.map((sec, idx) => {
                const secLang = sec.language || "it";
                return (
                  <div
                    key={sec.id}
                    className="p-3 rounded-xl bg-[#09090B] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex items-center bg-[#121316] border border-white/15 rounded-lg p-0.5 text-[10px] shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSectionLanguage(sec, "it")}
                          className={`inline-flex items-center gap-1 px-1.5 py-1 rounded font-semibold cursor-pointer ${
                            secLang === "it"
                              ? "bg-[#CBD5E1] text-[#09090B]"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <FlagIT className="w-3.5 h-2.5" /> IT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSectionLanguage(sec, "pt")}
                          className={`inline-flex items-center gap-1 px-1.5 py-1 rounded font-semibold cursor-pointer ${
                            secLang === "pt"
                              ? "bg-[#CBD5E1] text-[#09090B]"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          <FlagBR className="w-3.5 h-2.5" /> PT
                        </button>
                      </div>

                      {editingSection?.id === sec.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingSection.title}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                title: e.target.value,
                              })
                            }
                            className="flex-1 bg-[#121316] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <button
                            onClick={() =>
                              handleUpdateSectionTitle(editingSection)
                            }
                            className="p-1.5 rounded-lg bg-[#CBD5E1] text-[#09090B] cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-white truncate">
                          {idx + 1}. {sec.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingSection(sec)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/60 text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isCardFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveCard}
            className="bg-[#121316] border border-[#CBD5E1]/30 rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingCardId ? t.editCardTitle : t.newCardTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsCardFormOpen(false)}
                className="text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.rowSectionLabel}
                </label>
                <select
                  value={formData.section_id}
                  onChange={(e) =>
                    setFormData({ ...formData, section_id: e.target.value })
                  }
                  className="w-full bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{(s.language || "it").toUpperCase()}] {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.badgeLabel}
                </label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) =>
                    setFormData({ ...formData, badge_text: e.target.value })
                  }
                  className="w-full bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.titleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.subtitleLabel}
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[#CBD5E1] mb-1">{t.descLabel}</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] mb-1">
                  {t.coverLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={formData.cover_image_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cover_image_url: e.target.value,
                      })
                    }
                    className="flex-1 bg-[#09090B] border border-white/15 rounded-lg p-2.5 text-white"
                  />
                  <label className="bg-white/10 hover:bg-[#CBD5E1] hover:text-[#09090B] text-[#CBD5E1] px-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-white/15 shrink-0">
                    {uploadingCover ? (
                      "⏳..."
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1" /> {t.uploadCover}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
                  {t.cardButtonsLabel} ({formData.buttons.length})
                </label>
                <button
                  type="button"
                  onClick={addButtonToForm}
                  className="inline-flex items-center gap-1 text-xs bg-[#CBD5E1]/20 hover:bg-[#CBD5E1] text-[#E2E8F0] hover:text-[#09090B] border border-[#CBD5E1]/40 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {t.addButton}
                </button>
              </div>

              <div className="space-y-3">
                {formData.buttons.map((btn, idx) => {
                  const parsedYt = parseYouTubeUrl(btn.target_url);
                  const hasPlaylistDetected = Boolean(
                    parsedYt.playlistId || parsedYt.customVideoIds.length > 1
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#09090B] border border-white/10 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-semibold text-white/90">
                          {t.buttonNumber}
                          {idx + 1}
                        </span>
                        {formData.buttons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeButtonFromForm(idx)}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {t.removeBtn}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[#CBD5E1] mb-1">
                            {t.actionTypeLabel}
                          </label>
                          <select
                            value={btn.action_type}
                            onChange={(e) =>
                              updateButtonInForm(
                                idx,
                                "action_type",
                                e.target.value as ActionType
                              )
                            }
                            className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                          >
                            <option value="internal_view">
                              {t.actionInternal}
                            </option>
                            <option value="protected_pdf">
                              {t.actionProtectedPdf}
                            </option>
                            <option value="protected_page">
                              {t.actionProtectedPage}
                            </option>
                            <option value="protected_download">
                              {t.actionProtectedDownload}
                            </option>
                            <option value="external_course">
                              {t.actionExternal}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[#CBD5E1] mb-1">
                            {t.buttonTextLabel}
                          </label>
                          <input
                            type="text"
                            required
                            value={btn.button_label}
                            onChange={(e) =>
                              updateButtonInForm(
                                idx,
                                "button_label",
                                e.target.value
                              )
                            }
                            className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex gap-2">
                          {btn.action_type === "internal_view" ? (
                            <textarea
                              rows={2}
                              placeholder="https://youtube.com/..."
                              value={btn.target_url}
                              onChange={(e) =>
                                updateButtonInForm(
                                  idx,
                                  "target_url",
                                  e.target.value
                                )
                              }
                              className="flex-1 bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                            />
                          ) : (
                            <input
                              type="url"
                              placeholder="https://..."
                              value={btn.target_url}
                              onChange={(e) =>
                                updateButtonInForm(
                                  idx,
                                  "target_url",
                                  e.target.value
                                )
                              }
                              className="flex-1 bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                            />
                          )}

                          {(btn.action_type === "protected_pdf" ||
                            btn.action_type === "protected_download" ||
                            btn.action_type === "download") && (
                            <label className="bg-white/10 hover:bg-[#CBD5E1] hover:text-[#09090B] text-[#CBD5E1] px-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-white/15 shrink-0">
                              {uploadingButtonIdx === idx ? (
                                "⏳..."
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-1" />{" "}
                                  {t.uploadFile}
                                </>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.zip,.apk,.doc,.docx,.epub,.mp3"
                                className="hidden"
                                onChange={(e) => handleButtonFileUpload(e, idx)}
                              />
                            </label>
                          )}
                        </div>

                        {btn.action_type === "internal_view" &&
                          btn.target_url.trim() !== "" &&
                          hasPlaylistDetected && (
                            <div className="mt-2">
                              <p className="text-[11px] text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                                <ListVideo className="w-3.5 h-3.5 shrink-0" />
                                Playlist YouTube (
                                {parsedYt.customVideoIds.length ||
                                  parsedYt.playlistId}
                                )
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-xs space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-[#CBD5E1] font-medium">
                  {t.defaultPermissionsLabel}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder={t.newTagPlaceholder}
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="bg-[#09090B] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white w-36"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRole}
                    className="bg-[#CBD5E1]/20 hover:bg-[#CBD5E1] text-[#E2E8F0] hover:text-[#09090B] border border-[#CBD5E1]/40 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t.addTagBtn}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {allPermissionSlugs.map((slug) => {
                  const checked = formData.allowed_permissions.includes(slug);
                  const isCustom = !BASE_PERMISSION_SLUGS.includes(slug as any);
                  return (
                    <div key={slug} className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const next = checked
                            ? formData.allowed_permissions.filter(
                                (p) => p !== slug
                              )
                            : [...formData.allowed_permissions, slug];
                          setFormData({
                            ...formData,
                            allowed_permissions: next,
                          });
                        }}
                        className={`px-3 py-1.5 border text-xs cursor-pointer ${
                          isCustom ? "rounded-l-lg" : "rounded-lg"
                        } ${
                          checked
                            ? "bg-[#CBD5E1] text-[#09090B] border-[#CBD5E1] font-semibold"
                            : "bg-[#09090B] text-[#94A3B8] border-white/15"
                        }`}
                      >
                        {getRoleLabel(slug)}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomRole(slug)}
                          className="px-1.5 py-1.5 bg-[#09090B] hover:bg-red-950/70 text-red-400 border border-l-0 border-white/15 rounded-r-lg text-xs cursor-pointer"
                          title={t.removeBtn}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCardFormOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-6 py-2.5 rounded-lg cursor-pointer"
              >
                {t.saveCardBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {isUsersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#CBD5E1]/30 rounded-2xl max-w-4xl w-full p-6 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">
                  {t.usersModalTitle}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openNewUserForm}
                  className="flex items-center gap-1.5 bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> {t.newUserBtn}
                </button>
                <button
                  onClick={() => setIsUsersModalOpen(false)}
                  className="text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#09090B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2 text-[#CBD5E1] font-medium">
                <Tag className="w-4 h-4 text-[#CBD5E1]" />
                <span>{t.mainLevelLabel}:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t.newTagPlaceholder}
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="bg-[#121316] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  {t.addTagBtn}
                </button>
              </div>
            </div>

            {isUserFormOpen && (
              <div className="p-4 rounded-xl bg-[#09090B] border border-[#CBD5E1]/40 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-[#CBD5E1] uppercase tracking-wider">
                    {editingUser
                      ? `${t.editingUserPrefix} ${editingUser.full_name}`
                      : t.registerNewUser}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsUserFormOpen(false)}
                    className="text-[#94A3B8] hover:text-white text-xs cursor-pointer"
                  >
                    {t.closeEdit}
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 text-xs">
                    <div className="md:col-span-3">
                      <label className="block text-[#CBD5E1] mb-1">
                        {t.fullNameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.nome}
                        onChange={(e) =>
                          setUserForm({ ...userForm, nome: e.target.value })
                        }
                        className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[#CBD5E1] mb-1">
                        {t.emailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        disabled={!!editingUser}
                        value={userForm.email}
                        onChange={(e) =>
                          setUserForm({ ...userForm, email: e.target.value })
                        }
                        className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white disabled:opacity-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[#CBD5E1] mb-1">
                        {t.ddiLabel}
                      </label>
                      <input
                        type="text"
                        value={userForm.ddi}
                        onChange={(e) =>
                          setUserForm({ ...userForm, ddi: e.target.value })
                        }
                        className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white text-center"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[#CBD5E1] mb-1">
                        {t.phoneLabel}
                      </label>
                      <input
                        type="text"
                        value={userForm.telefone}
                        onChange={(e) =>
                          setUserForm({ ...userForm, telefone: e.target.value })
                        }
                        className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                      />
                    </div>
                    {!editingUser && (
                      <div className="md:col-span-4">
                        <label className="block text-[#CBD5E1] mb-1">
                          {t.initialPassLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={userForm.senha}
                          onChange={(e) =>
                            setUserForm({ ...userForm, senha: e.target.value })
                          }
                          className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="block text-[#CBD5E1] text-xs font-bold">
                      {t.mainLevelLabel}
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {allPermissionSlugs.map((slug) => {
                        const active = userForm.permissions.includes(slug);
                        const isCustom = !BASE_PERMISSION_SLUGS.includes(
                          slug as any
                        );
                        return (
                          <div key={slug} className="inline-flex items-center">
                            <button
                              type="button"
                              onClick={() => {
                                const next = active
                                  ? userForm.permissions.filter(
                                      (p) => p !== slug
                                    )
                                  : [...userForm.permissions, slug];
                                setUserForm({ ...userForm, permissions: next });
                              }}
                              className={`px-3 py-1.5 border cursor-pointer ${
                                isCustom ? "rounded-l-lg" : "rounded-lg"
                              } ${
                                active
                                  ? "bg-[#CBD5E1] text-[#09090B] border-[#CBD5E1] font-semibold"
                                  : "bg-transparent text-[#94A3B8] border-white/15"
                              }`}
                            >
                              {getRoleLabel(slug)}
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomRole(slug)}
                                className="px-1.5 py-1.5 bg-[#121316] hover:bg-red-950/70 text-red-400 border border-l-0 border-white/15 rounded-r-lg text-xs cursor-pointer"
                                title={t.removeBtn}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <label className="flex items-center gap-1.5 ml-2 text-[#E2E8F0] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userForm.is_admin}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              is_admin: e.target.checked,
                            })
                          }
                        />{" "}
                        {t.adminCheckbox}
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedAccess(!showAdvancedAccess)}
                      className="flex items-center gap-2 text-[#CBD5E1] text-xs font-bold w-full text-left cursor-pointer"
                    >
                      {showAdvancedAccess ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {t.customAccessToggle}
                    </button>

                    {showAdvancedAccess && (
                      <div className="mt-4 space-y-4 pl-2 border-l-2 border-[#CBD5E1]/30">
                        <p className="text-[11px] text-[#94A3B8]">
                          {t.customAccessHelp}
                        </p>
                        {sections.map((sec) => {
                          const secCards = cards.filter(
                            (c) => c.section_id === sec.id
                          );
                          if (secCards.length === 0) return null;
                          return (
                            <div key={sec.id} className="space-y-2">
                              <h4 className="text-xs font-semibold text-white bg-white/5 p-1.5 rounded flex items-center gap-1.5">
                                {sec.language === "pt" ? (
                                  <FlagBR className="w-3.5 h-2.5" />
                                ) : (
                                  <FlagIT className="w-3.5 h-2.5" />
                                )}
                                <span>{sec.title}</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                                {secCards.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between bg-[#121316] p-2 rounded-lg border border-white/5 text-[11px]"
                                  >
                                    <span className="truncate pr-2 text-white/80">
                                      {c.title}
                                    </span>
                                    <select
                                      value={
                                        userForm.blocked_cards.includes(c.id)
                                          ? "blocked"
                                          : userForm.unlocked_cards.includes(
                                              c.id
                                            )
                                          ? "unlocked"
                                          : "default"
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const newUnlocked =
                                          userForm.unlocked_cards.filter(
                                            (id) => id !== c.id
                                          );
                                        const newBlocked =
                                          userForm.blocked_cards.filter(
                                            (id) => id !== c.id
                                          );
                                        if (val === "unlocked")
                                          newUnlocked.push(c.id);
                                        if (val === "blocked")
                                          newBlocked.push(c.id);
                                        setUserForm({
                                          ...userForm,
                                          unlocked_cards: newUnlocked,
                                          blocked_cards: newBlocked,
                                        });
                                      }}
                                      className="bg-[#09090B] border border-white/15 rounded px-2 py-1 text-[#CBD5E1] focus:outline-none"
                                    >
                                      <option value="default">
                                        {t.ruleDefault}
                                      </option>
                                      <option value="unlocked">
                                        {t.ruleUnlock}
                                      </option>
                                      <option value="blocked">
                                        {t.ruleBlock}
                                      </option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveManualUser}
                    disabled={savingUser}
                    className="bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-6 py-2.5 rounded-lg cursor-pointer"
                  >
                    {savingUser ? t.saving : t.saveSettingsBtn}
                  </button>
                </div>
              </div>
            )}

            {!isUserFormOpen && (
              <div className="overflow-y-auto pr-1 flex-1 min-h-[300px]">
                <div className="space-y-3">
                  {allProfiles.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-[#09090B] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            {user.full_name} {user.is_admin && "⭐ (Admin)"}
                          </p>
                          <button
                            onClick={() => openEditUserForm(user)}
                            className="text-xs text-[#CBD5E1] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> {t.manageBtn}
                          </button>
                        </div>
                        <p className="text-xs text-[#94A3B8]">
                          {user.email} {user.phone ? `• ${user.phone}` : ""}
                        </p>
                        {((user.unlocked_cards?.length || 0) > 0 ||
                          (user.blocked_cards?.length || 0) > 0) && (
                          <p className="text-[10px] text-[#E2E8F0] mt-1 italic">
                            {(user.unlocked_cards?.length || 0) +
                              (user.blocked_cards?.length || 0)}{" "}
                            {t.exceptionsCount}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {allPermissionSlugs.map((slug) => {
                          const active = user.permissions?.includes(slug);
                          return (
                            <button
                              key={slug}
                              onClick={() => toggleUserPermission(user, slug)}
                              className={`px-2.5 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
                                active
                                  ? "bg-[#CBD5E1] text-[#09090B] border-[#CBD5E1] font-semibold"
                                  : "bg-transparent text-[#94A3B8] border-white/15"
                              }`}
                            >
                              {getRoleLabel(slug)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}