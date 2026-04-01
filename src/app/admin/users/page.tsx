"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Search, Shield, UserCog, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "user" | "manager" | "admin";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  createdAt: string;
}

interface FetchResponse {
  data: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<
  Role,
  { label: string; color: string; bg: string; icon: typeof Shield }
> = {
  user: {
    label: "Utilisateur",
    color: "text-inside-blue",
    bg: "bg-inside-blue/10",
    icon: User,
  },
  manager: {
    label: "Manager",
    color: "text-inside-purple",
    bg: "bg-inside-purple/10",
    icon: UserCog,
  },
  admin: {
    label: "Administrateur",
    color: "text-inside-pink",
    bg: "bg-inside-pink/10",
    icon: Shield,
  },
};

const LIMIT = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-inside-blue",
  "bg-inside-pink",
  "bg-inside-purple",
  "bg-inside-cyan",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Feedback component
// ---------------------------------------------------------------------------

interface Feedback {
  type: "success" | "error";
  message: string;
}

function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;

  return (
    <div
      className={`rounded-md px-4 py-2 text-sm font-medium transition-opacity ${
        feedback.type === "success"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {feedback.message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // -- Fetch users ----------------------------------------------------------

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=${p}&limit=${LIMIT}`
      );
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json: FetchResponse = await res.json();
      setUsers(json.data);
      setTotalPages(json.totalPages);
      setTotal(json.total);
      setPage(json.page);
    } catch {
      showFeedback("error", "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // -- Feedback helper ------------------------------------------------------

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }

  // -- Role change ----------------------------------------------------------

  async function handleRoleChange(user: UserRecord, newRole: Role) {
    if (newRole === user.role) return;

    // Confirmation for admin role changes
    const isAdminChange = user.role === "admin" || newRole === "admin";
    if (isAdminChange) {
      const action =
        newRole === "admin"
          ? `promouvoir ${user.name ?? user.email} en Administrateur`
          : `retirer les droits Administrateur de ${user.name ?? user.email}`;
      const confirmed = window.confirm(
        `Etes-vous sur de vouloir ${action} ?`
      );
      if (!confirmed) return;
    }

    setChangingRole(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Erreur serveur");
      }

      const json = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? json.data : u))
      );
      showFeedback(
        "success",
        `Role de ${user.name ?? user.email} mis a jour.`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la mise a jour.";
      showFeedback("error", message);
    } finally {
      setChangingRole(null);
    }
  }

  // -- Client-side search filter --------------------------------------------

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name?.toLowerCase().includes(q) ?? false) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // -- Render ---------------------------------------------------------------

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-3xl tracking-wider text-inside-blue"
          >
            Gestion des Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} utilisateur{total !== 1 ? "s" : ""} enregistré
            {total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Feedback */}
      <FeedbackBanner feedback={feedback} />

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-inside-blue" />
            <span className="ml-2 text-sm text-gray-500">
              Chargement...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <User className="mb-2 h-10 w-10" />
            <p className="text-sm">
              {search
                ? "Aucun utilisateur ne correspond à votre recherche."
                : "Aucun utilisateur enregistré."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="w-14" />
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const roleConf = ROLE_CONFIG[user.role];
                const RoleIcon = roleConf.icon;
                const isChanging = changingRole === user.id;

                return (
                  <TableRow key={user.id}>
                    {/* Avatar */}
                    <TableCell>
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name ?? "Avatar"}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(user.id)}`}
                        >
                          {getInitial(user.name)}
                        </div>
                      )}
                    </TableCell>

                    {/* Name */}
                    <TableCell className="font-semibold text-gray-900">
                      {user.name ?? "-"}
                    </TableCell>

                    {/* Email */}
                    <TableCell
                      className="max-w-[200px] truncate text-gray-500"
                      title={user.email}
                    >
                      {user.email}
                    </TableCell>

                    {/* Role selector */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(v) =>
                            handleRoleChange(user, v as Role)
                          }
                          disabled={isChanging}
                        >
                          <SelectTrigger className="h-8 w-[170px] text-xs">
                            <div className="flex items-center gap-1.5">
                              {isChanging ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RoleIcon className={`h-3.5 w-3.5 ${roleConf.color}`} />
                              )}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-inside-blue" />
                                Utilisateur
                              </span>
                            </SelectItem>
                            <SelectItem value="manager">
                              <span className="flex items-center gap-2">
                                <UserCog className="h-3.5 w-3.5 text-inside-purple" />
                                Manager
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-inside-pink" />
                                Administrateur
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Badge
                          className={`pointer-events-none text-[10px] ${roleConf.bg} ${roleConf.color} border-0`}
                        >
                          {roleConf.label}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Created date */}
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchUsers(page - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => fetchUsers(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
