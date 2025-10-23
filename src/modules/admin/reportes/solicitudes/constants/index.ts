/**
 * @fileoverview Constantes para el módulo de reportes de solicitudes.
 */

import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { SolicitudEstado, SolicitudFilters } from '../types';

export const INITIAL_FILTERS: SolicitudFilters = {
  search: '',
  estados: {
    todos: true,
    pendiente: false,
    aprobada: false,
    rechazada: false
  }
};

export const ESTADO_BADGE_STYLES: Record<SolicitudEstado, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  aprobada: 'bg-green-100 text-green-800 border-green-200',
  rechazada: 'bg-red-100 text-red-800 border-red-200'
};

export const ESTADO_ICONS: Record<SolicitudEstado, React.ReactElement> = {
  pendiente: React.createElement(Clock, { className: 'w-4 h-4' }),
  aprobada: React.createElement(CheckCircle, { className: 'w-4 h-4' }),
  rechazada: React.createElement(XCircle, { className: 'w-4 h-4' })
};

export const ESTADO_LABELS: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada'
};

export const SYSTEM_MESSAGES = {
  noData: 'No hay solicitudes registradas',
  noFilteredData: 'No se encontraron solicitudes con los filtros aplicados',
  loadError: 'Error al cargar las solicitudes, intenta de nuevo.',
  actionError: 'Error al procesar la solicitud, intenta nuevamente.',
  revertSuccess: 'Solicitud revertida a pendiente exitosamente'
};
