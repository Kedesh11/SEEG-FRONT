import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  listUsers, 
  getUserById, 
  updateMe, 
  deleteUser,
  getMyProfile,
  type UserDTO 
} from "@/integrations/api/users";
import { useAuth } from "./useAuth";

export interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  matricule?: number | null;
  date_of_birth?: string | null;
  created_at?: string;
  updated_at?: string;
}

function mapUser(dto: UserDTO): User {
  return {
    id: dto.id,
    email: dto.email,
    role: dto.role,
    first_name: dto.first_name,
    last_name: dto.last_name,
    phone: dto.phone,
    matricule: dto.matricule,
    date_of_birth: dto.date_of_birth,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

/**
 * Hook pour récupérer la liste des utilisateurs (avec pagination et filtres)
 */
export function useUsers(params?: {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const result = await listUsers(params);
      return {
        users: result.items.map(mapUser),
        total: result.total,
        page: result.page,
        size: result.size,
      };
    },
  });
}

/**
 * Hook pour récupérer un utilisateur par ID
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const user = await getUserById(userId);
      return user ? mapUser(user as UserDTO) : null;
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour récupérer le profil de l'utilisateur connecté
 */
export function useMyProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await getMyProfile();
    },
    enabled: !!user,
  });
}

/**
 * Hook pour mettre à jour le profil de l'utilisateur connecté
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<UserDTO>) => {
      const updated = await updateMe(data);
      return updated ? mapUser(updated as UserDTO) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
    },
  });
}

/**
 * Hook pour supprimer un utilisateur (admin uniquement)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook pour récupérer les utilisateurs par rôle
 */
export function useUsersByRole(role: 'candidat' | 'recruiter' | 'admin' | 'observer') {
  return useQuery({
    queryKey: ['usersByRole', role],
    queryFn: async () => {
      const result = await listUsers({ role });
      return result.items.map(mapUser);
    },
  });
}

