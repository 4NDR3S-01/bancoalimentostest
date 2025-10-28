import { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface ProfileUpdateData {
  tipo_persona?: string;
  cedula?: string | null;
  ruc?: string | null;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  representante?: string | null;
}

export function useProfileUpdate(supabase: SupabaseClient) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const checkDuplicateIdentification = async (
    tipo: 'Natural' | 'Juridica',
    value: string,
    currentUserId: string
  ): Promise<boolean> => {
    const field = tipo === 'Natural' ? 'cedula' : 'ruc';
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq(field, value)
      .neq('id', currentUserId)
      .maybeSingle();
    
    if (existente) {
      setError(`Ya existe un usuario con es${tipo === 'Natural' ? 'a cédula' : 'e RUC'}.`);
      return true;
    }
    return false;
  };

  const loadUserProfile = async (userId: string) => {
    setLoading(true);
    clearMessages();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('tipo_persona, cedula, ruc, nombre, direccion, telefono')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError('No se pudieron cargar los datos del perfil.');
        return null;
      }
      return data;
    } catch {
      setError('Error al cargar el perfil.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    userId: string,
    profileData: ProfileUpdateData
  ): Promise<boolean> => {
    setLoading(true);
    clearMessages();

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(profileData)
        .eq('id', userId);

      if (updateError) {
        setError('No se pudo actualizar el perfil. ' + updateError.message);
        return false;
      }

      setSuccess('¡Perfil actualizado correctamente!');
      return true;
    } catch {
      setError('Error al actualizar el perfil.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (
    userId: string,
    profileData: ProfileUpdateData
  ): Promise<boolean> => {
    setLoading(true);
    clearMessages();

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(profileData)
        .eq('id', userId);

      if (updateError) {
        setError('No se pudo guardar el perfil. ' + updateError.message);
        return false;
      }

      setSuccess('¡Perfil guardado correctamente!');
      return true;
    } catch {
      setError('Error al guardar el perfil.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    setError,
    setSuccess,
    clearMessages,
    checkDuplicateIdentification,
    loadUserProfile,
    updateProfile,
    saveProfile,
  };
}
