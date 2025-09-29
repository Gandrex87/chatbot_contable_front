// lib/user-config.ts
export type UserRole = 'admin' | 'contable' | 'usuario';

export interface UserConfig {
  fullName: string;
  role: string;
  style: string;
  avatar?: string;
}

export const USER_MAPPING: Record<UserRole, UserConfig> = {
  admin: {
    fullName: "Andrés",
    role: "Administrador",
    style: "estratégico",
  },
  contable: {
    fullName: "Allan",
    role: "Contable",
    style: "técnico-detallado",
  },
  usuario: {
    fullName: "Carlos",
    role: "Usuario",
    style: "normativo",
  },
};

export function getUserInfo(username: string): UserConfig {
  const userKey = username.toLowerCase() as UserRole;
  return USER_MAPPING[userKey] || {
    fullName: username.charAt(0).toUpperCase() + username.slice(1),
    role: "Usuario",
    style: "general",
  };
}