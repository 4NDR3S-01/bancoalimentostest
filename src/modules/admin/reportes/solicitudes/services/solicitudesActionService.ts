/**
 * @fileoverview Servicio con acciones de negocio para aprobación y gestión de solicitudes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProductoInventario,
  ResultadoInventario,
  ServiceResult,
  Solicitud,
  SolicitudActionResponse,
  InventarioDescontado,
  DescuentoProductoResult
} from '../types';
import { createSolicitudesDataService } from './solicitudesDataService';
import { sendNotification } from '@/modules/shared/services/notificationClient';

const logger = {
  info: (message: string, details?: unknown) => console.info(`[SolicitudesActionService] ${message}`, details),
  warn: (message: string, details?: unknown) => console.warn(`[SolicitudesActionService] ${message}`, details),
  error: (message: string, error?: unknown) => console.error(`[SolicitudesActionService] ${message}`, error)
};

export const createSolicitudesActionService = (supabaseClient: SupabaseClient) => {
  const dataService = createSolicitudesDataService(supabaseClient);

  const updateSolicitudEstado = async (
    solicitud: Solicitud,
    nuevoEstado: 'aprobada' | 'rechazada',
    comentarioAdmin?: string
  ): Promise<ServiceResult<SolicitudActionResponse>> => {
    try {
      logger.info(`Actualizando estado de solicitud ${solicitud.id} a ${nuevoEstado}`);

      const { error: updateError } = await supabaseClient
        .from('solicitudes')
        .update({
          estado: nuevoEstado,
          fecha_respuesta: new Date().toISOString(),
          comentario_admin: comentarioAdmin?.trim() ? comentarioAdmin.trim() : null
        })
        .eq('id', solicitud.id);

      if (updateError) {
        logger.error('Error actualizando estado de solicitud', updateError);
        return {
          success: false,
          error: 'No fue posible actualizar el estado de la solicitud',
          errorDetails: updateError
        };
      }

      if (nuevoEstado === 'aprobada' && solicitud.estado === 'pendiente') {
        const resultadoInventario = await descontarDelInventario(solicitud);
        await registrarMovimientoSolicitud(solicitud, resultadoInventario);

        const mensaje = buildResultadoMensaje(solicitud, resultadoInventario);
        await notificarCambioEstado(solicitud, nuevoEstado, mensaje, comentarioAdmin);
        return {
          success: true,
          data: {
            success: true,
            message: mensaje,
            warning: resultadoInventario.error || resultadoInventario.noStock || resultadoInventario.cantidadRestante > 0
          }
        };
      }

      await notificarCambioEstado(solicitud, nuevoEstado, undefined, comentarioAdmin);

      return {
        success: true,
        data: {
          success: true,
          message: `Solicitud ${nuevoEstado} exitosamente`,
          warning: false
        }
      };
    } catch (err) {
      logger.error('Excepción al actualizar estado de solicitud', err);
      return {
        success: false,
        error: 'Error inesperado al actualizar la solicitud',
        errorDetails: err
      };
    }
  };

  /**
   * Obtiene los movimientos de egreso relacionados con una solicitud aprobada.
   * Busca movimientos que coincidan con el solicitante y el tipo de alimento.
   * Solo incluye movimientos creados DESPUÉS de la última reversión (si existe).
   */
  const obtenerMovimientosEgresoSolicitud = async (solicitud: Solicitud): Promise<InventarioDescontado[]> => {
    try {
      // Determinar la fecha de referencia: fecha_respuesta si existe, sino created_at
      const fechaReferencia = solicitud.fecha_respuesta 
        ? new Date(solicitud.fecha_respuesta) 
        : new Date(solicitud.created_at);
      
      // Buscar la última reversión para esta solicitud (si existe)
      // Esto nos permite saber desde qué fecha buscar movimientos de egreso
      const { data: ultimaReversion, error: reversionError } = await supabaseClient
        .from('movimiento_inventario_cabecera')
        .select('id_movimiento, fecha_movimiento')
        .eq('id_solicitante', solicitud.usuario_id)
        .ilike('observaciones', `%Reversión de solicitud%${solicitud.tipo_alimento}%`)
        .eq('estado_movimiento', 'completado')
        .order('fecha_movimiento', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reversionError) {
        logger.warn('Error obteniendo última reversión (continuando de todas formas)', reversionError);
      }

      // Determinar la fecha mínima para buscar movimientos de egreso
      // Si hay una reversión, solo buscamos movimientos creados DESPUÉS de esa reversión
      // Si no hay reversión, buscamos movimientos cercanos a la fecha de respuesta
      let fechaMinima: Date;
      if (ultimaReversion) {
        // Buscar movimientos creados DESPUÉS de la última reversión
        fechaMinima = new Date(ultimaReversion.fecha_movimiento);
        logger.info(`Se encontró una reversión previa. Buscando movimientos de egreso después de ${fechaMinima.toISOString()}`);
      } else {
        // Buscar movimientos en un rango cercano a la fecha de respuesta
        fechaMinima = new Date(fechaReferencia);
        fechaMinima.setDate(fechaMinima.getDate() - 1);
        fechaMinima.setHours(0, 0, 0, 0);
        logger.info(`No se encontró reversión previa. Buscando movimientos de egreso desde ${fechaMinima.toISOString()}`);
      }

      // Fecha máxima: 1 día después de la fecha de referencia
      const fechaMaxima = new Date(fechaReferencia);
      fechaMaxima.setDate(fechaMaxima.getDate() + 1);
      fechaMaxima.setHours(23, 59, 59, 999);

      // Convertir a formato ISO sin timezone
      const fechaMinimaStr = fechaMinima.toISOString().replace('Z', '');
      const fechaMaximaStr = fechaMaxima.toISOString().replace('Z', '');

      // Buscar cabeceras de movimientos de egreso (solicitudes aprobadas)
      // Solo movimientos creados DESPUÉS de la última reversión (si existe)
      const { data: cabecerasEgreso, error: cabecerasError } = await supabaseClient
        .from('movimiento_inventario_cabecera')
        .select('id_movimiento, fecha_movimiento, observaciones')
        .eq('id_solicitante', solicitud.usuario_id)
        .ilike('observaciones', `%Solicitud aprobada%${solicitud.tipo_alimento}%`)
        .eq('estado_movimiento', 'completado')
        .gte('fecha_movimiento', fechaMinimaStr)
        .lte('fecha_movimiento', fechaMaximaStr)
        .order('fecha_movimiento', { ascending: false });

      if (cabecerasError || !cabecerasEgreso || cabecerasEgreso.length === 0) {
        logger.warn('No se encontraron cabeceras de movimiento de egreso para la solicitud', cabecerasError);
        return [];
      }

      // Obtener los detalles de egreso de las cabeceras encontradas
      const idsMovimiento = cabecerasEgreso.map(c => c.id_movimiento);
      const { data: detalles, error: detallesError } = await supabaseClient
        .from('movimiento_inventario_detalle')
        .select('id_movimiento, id_producto, cantidad, tipo_transaccion, unidad_id, observacion_detalle')
        .in('id_movimiento', idsMovimiento)
        .eq('tipo_transaccion', 'egreso')
        .ilike('observacion_detalle', `%Entrega por solicitud aprobada%${solicitud.tipo_alimento}%`);

      if (detallesError || !detalles || detalles.length === 0) {
        logger.warn('No se encontraron detalles de egreso para la solicitud', detallesError);
        return [];
      }

      // Agrupar por producto y sumar cantidades
      const productosAgrupados = new Map<string, { cantidad: number; detalle: typeof detalles[0] }>();
      
      for (const detalle of detalles) {
        const productoId = detalle.id_producto;
        const cantidad = Number(detalle.cantidad);
        
        if (productosAgrupados.has(productoId)) {
          productosAgrupados.get(productoId)!.cantidad += cantidad;
        } else {
          productosAgrupados.set(productoId, { cantidad, detalle });
        }
      }

      // Obtener información de los productos
      const idsProducto = [...productosAgrupados.keys()];
      const { data: productos, error: productosError } = await supabaseClient
        .from('productos_donados')
        .select('id_producto, nombre_producto, unidad_id')
        .in('id_producto', idsProducto);

      if (productosError || !productos) {
        logger.error('Error obteniendo productos para los movimientos', productosError);
        return [];
      }

      // Mapear detalles a InventarioDescontado
      const movimientos: InventarioDescontado[] = [];
      for (const [productoId, info] of productosAgrupados.entries()) {
        const producto = productos.find(p => p.id_producto === productoId);
        if (!producto) continue;

        movimientos.push({
          producto: {
            id_producto: producto.id_producto,
            nombre_producto: producto.nombre_producto,
            unidad_id: producto.unidad_id ?? undefined
          },
          cantidadEntregada: info.cantidad
        });
      }

      logger.info(`Se encontraron ${movimientos.length} productos para restaurar`);
      return movimientos;
    } catch (error) {
      logger.error('Error obteniendo movimientos de egreso de la solicitud', error);
      return [];
    }
  };

  /**
   * Restaura el inventario sumando las cantidades que fueron descontadas.
   */
  const restaurarInventario = async (
    movimientos: InventarioDescontado[]
  ): Promise<ServiceResult<{ productosActualizados: number }>> => {
    try {
      let productosActualizados = 0;

      for (const movimiento of movimientos) {
        // Buscar registros de inventario para este producto
        const { data: inventarioItems, error: inventarioError } = await supabaseClient
          .from('inventario')
          .select('id_inventario, cantidad_disponible, id_deposito, id_producto')
          .eq('id_producto', movimiento.producto.id_producto)
          .order('fecha_actualizacion', { ascending: false });

        if (inventarioError) {
          logger.error(`Error obteniendo inventario para producto ${movimiento.producto.nombre_producto}`, inventarioError);
          continue;
        }

        // Si hay registros de inventario, actualizar el primero (más reciente)
        // Si no hay registros, crear uno nuevo (necesitamos un depósito por defecto)
        if (inventarioItems && inventarioItems.length > 0) {
          const item = inventarioItems[0];
          const nuevaCantidad = (item.cantidad_disponible ?? 0) + movimiento.cantidadEntregada;

          const { error: updateError } = await supabaseClient
            .from('inventario')
            .update({
              cantidad_disponible: nuevaCantidad,
              fecha_actualizacion: new Date().toISOString()
            })
            .eq('id_inventario', item.id_inventario);

          if (updateError) {
            logger.error(`Error restaurando inventario para producto ${movimiento.producto.nombre_producto}`, updateError);
            continue;
          }

          productosActualizados++;
          logger.info(`Restauradas ${movimiento.cantidadEntregada} unidades de ${movimiento.producto.nombre_producto} (nuevo stock: ${nuevaCantidad})`);
        } else {
          // No hay inventario existente, necesitamos crear uno nuevo
          // Primero obtener un depósito por defecto
          const { data: depositos, error: depositosError } = await supabaseClient
            .from('depositos')
            .select('id_deposito')
            .limit(1)
            .single();

          if (depositosError || !depositos) {
            logger.error(`No se pudo obtener un depósito para crear inventario de ${movimiento.producto.nombre_producto}`, depositosError);
            continue;
          }

          const { error: insertError } = await supabaseClient
            .from('inventario')
            .insert({
              id_producto: movimiento.producto.id_producto,
              id_deposito: depositos.id_deposito,
              cantidad_disponible: movimiento.cantidadEntregada,
              fecha_actualizacion: new Date().toISOString()
            });

          if (insertError) {
            logger.error(`Error creando inventario para producto ${movimiento.producto.nombre_producto}`, insertError);
            continue;
          }

          productosActualizados++;
          logger.info(`Creado nuevo registro de inventario con ${movimiento.cantidadEntregada} unidades de ${movimiento.producto.nombre_producto}`);
        }
      }

      return {
        success: true,
        data: { productosActualizados }
      };
    } catch (error) {
      logger.error('Error restaurando inventario', error);
      return {
        success: false,
        error: 'Error inesperado al restaurar el inventario',
        errorDetails: error
      };
    }
  };

  /**
   * Registra un movimiento de ingreso cuando se revierte una solicitud aprobada.
   */
  const registrarMovimientoReversion = async (
    solicitud: Solicitud,
    movimientos: InventarioDescontado[]
  ): Promise<void> => {
    try {
      if (movimientos.length === 0) {
        logger.warn('No se registró movimiento de reversión porque no hay productos para restaurar');
        return;
      }

      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData?.user) {
        logger.warn('No se encontró usuario autenticado para registrar movimiento de reversión', authError);
        return;
      }

      // Crear cabecera del movimiento
      const { data: cabecera, error: cabeceraError } = await supabaseClient
        .from('movimiento_inventario_cabecera')
        .insert({
          fecha_movimiento: new Date().toISOString(),
          id_donante: authData.user.id,
          id_solicitante: solicitud.usuario_id,
          estado_movimiento: 'completado',
          observaciones: `Reversión de solicitud - ${solicitud.tipo_alimento} (${solicitud.cantidad} unidades)`
        })
        .select('id_movimiento')
        .single();

      if (cabeceraError || !cabecera) {
        logger.error('Error creando cabecera de movimiento de reversión', cabeceraError);
        return;
      }

      // Crear detalles del movimiento (ingresos)
      for (const movimiento of movimientos) {
        const { error: detalleError } = await supabaseClient
          .from('movimiento_inventario_detalle')
          .insert({
            id_movimiento: cabecera.id_movimiento,
            id_producto: movimiento.producto.id_producto,
            cantidad: movimiento.cantidadEntregada,
            tipo_transaccion: 'ingreso',
            rol_usuario: 'beneficiario',
            observacion_detalle: `Reversión de solicitud aprobada - ${solicitud.tipo_alimento}`,
            unidad_id: movimiento.producto.unidad_id ?? null
          });

        if (detalleError) {
          logger.error('Error creando detalle de movimiento de reversión', detalleError);
        }
      }

      logger.info('Movimiento de reversión registrado exitosamente');
    } catch (error) {
      logger.error('Error registrando movimiento de reversión', error);
    }
  };

  const revertirSolicitud = async (solicitudId: string): Promise<ServiceResult<SolicitudActionResponse>> => {
    try {
      logger.info(`Iniciando reversión de solicitud ${solicitudId}`);

      // Obtener la solicitud completa
      const { data: solicitudData, error: fetchError } = await supabaseClient
        .from('solicitudes')
        .select(`
          id,
          usuario_id,
          tipo_alimento,
          cantidad,
          comentarios,
          estado,
          created_at,
          latitud,
          longitud,
          fecha_respuesta,
          comentario_admin,
          unidad_id,
          unidades:unidad_id (
            id,
            nombre,
            simbolo,
            tipo_magnitud_id,
            es_base
          ),
          usuarios:usuario_id (
            nombre,
            cedula,
            telefono,
            email,
            direccion,
            tipo_persona
          )
        `)
        .eq('id', solicitudId)
        .single();

      if (fetchError || !solicitudData) {
        logger.error('Error obteniendo solicitud para revertir', fetchError);
        return {
          success: false,
          error: 'No fue posible obtener la información de la solicitud',
          errorDetails: fetchError
        };
      }

      // Función auxiliar para normalizar relaciones (pueden venir como array o objeto)
      const normalizeRelation = <T>(value: T | T[] | null | undefined): T | null => {
        if (Array.isArray(value)) {
          return (value[0] ?? null) as T | null;
        }
        return (value ?? null) as T | null;
      };

      // Normalizar relaciones
      const unidadesNormalizadas = normalizeRelation(solicitudData.unidades);
      const usuariosNormalizados = normalizeRelation(solicitudData.usuarios);

      // Mapear la solicitud al formato de dominio
      const solicitud: Solicitud = {
        id: solicitudData.id,
        usuario_id: solicitudData.usuario_id,
        tipo_alimento: solicitudData.tipo_alimento ?? 'Producto desconocido',
        cantidad: solicitudData.cantidad ?? 0,
        comentarios: solicitudData.comentarios ?? undefined,
        estado: solicitudData.estado as Solicitud['estado'],
        created_at: solicitudData.created_at,
        latitud: solicitudData.latitud ?? undefined,
        longitud: solicitudData.longitud ?? undefined,
        fecha_respuesta: solicitudData.fecha_respuesta ?? undefined,
        comentario_admin: solicitudData.comentario_admin ?? undefined,
        unidad_id: solicitudData.unidad_id ?? undefined,
        unidades: unidadesNormalizadas ? {
          id: unidadesNormalizadas.id,
          nombre: unidadesNormalizadas.nombre,
          simbolo: unidadesNormalizadas.simbolo,
          tipo_magnitud_id: unidadesNormalizadas.tipo_magnitud_id,
          es_base: unidadesNormalizadas.es_base ?? false
        } : null,
        usuarios: usuariosNormalizados ? {
          nombre: usuariosNormalizados.nombre ?? 'N/A',
          cedula: usuariosNormalizados.cedula ?? 'N/A',
          telefono: usuariosNormalizados.telefono ?? 'N/A',
          email: usuariosNormalizados.email ?? undefined,
          direccion: usuariosNormalizados.direccion ?? undefined,
          tipo_persona: usuariosNormalizados.tipo_persona ?? undefined
        } : null
      };

      // Verificar que la solicitud esté en estado 'aprobada'
      if (solicitud.estado !== 'aprobada') {
        logger.warn(`Intento de revertir solicitud que no está aprobada. Estado actual: ${solicitud.estado}`);
        return {
          success: false,
          error: 'Solo se pueden revertir solicitudes que estén en estado aprobada'
        };
      }

      // Buscar movimientos de egreso relacionados con esta solicitud
      const movimientosEgreso = await obtenerMovimientosEgresoSolicitud(solicitud);

      // Si hay movimientos, restaurar inventario y registrar ingreso
      if (movimientosEgreso.length > 0) {
        logger.info(`Se encontraron ${movimientosEgreso.length} movimientos de egreso para restaurar`);

        // Restaurar el inventario
        const resultadoRestauracion = await restaurarInventario(movimientosEgreso);
        
        if (resultadoRestauracion.error) {
          logger.error('Error restaurando inventario', resultadoRestauracion.error);
          return {
            success: false,
            error: `No fue posible restaurar el inventario: ${resultadoRestauracion.error}`,
            errorDetails: resultadoRestauracion.errorDetails
          };
        }

        // Registrar movimiento de ingreso
        await registrarMovimientoReversion(solicitud, movimientosEgreso);

        logger.info('Inventario restaurado y movimiento de ingreso registrado exitosamente');
      } else {
        logger.warn('No se encontraron movimientos de egreso relacionados con la solicitud. Continuando con la reversión del estado únicamente.');
      }

      // Actualizar el estado de la solicitud a 'pendiente'
      const { error: updateError } = await supabaseClient
        .from('solicitudes')
        .update({
          estado: 'pendiente',
          fecha_respuesta: null
        })
        .eq('id', solicitudId);

      if (updateError) {
        logger.error('Error al revertir solicitud', updateError);
        return {
          success: false,
          error: 'No fue posible revertir la solicitud',
          errorDetails: updateError
        };
      }

      const mensaje = movimientosEgreso.length > 0
        ? 'Solicitud revertida a pendiente exitosamente. El inventario ha sido restaurado.'
        : 'Solicitud revertida a pendiente exitosamente. No se encontraron movimientos de egreso para restaurar.';

      return {
        success: true,
        data: {
          success: true,
          message: mensaje,
          warning: movimientosEgreso.length === 0
        }
      };
    } catch (err) {
      logger.error('Excepción al revertir solicitud', err);
      return {
        success: false,
        error: 'Error inesperado al revertir la solicitud',
        errorDetails: err
      };
    }
  };

  const descontarDelInventario = async (solicitud: Solicitud): Promise<ResultadoInventario> => {
    try {
      const productosCoincidentes = await buscarProductosCoincidentes(solicitud.tipo_alimento);

      if (!productosCoincidentes || productosCoincidentes.length === 0) {
        logger.warn(`No se encontraron productos coincidentes para ${solicitud.tipo_alimento}`);
        return {
          cantidadRestante: solicitud.cantidad,
          productosActualizados: 0,
          noStock: true,
          detalleEntregado: []
        };
      }

      return procesarDescuentoInventario(productosCoincidentes, solicitud);
    } catch (error) {
      logger.error('Error descontando inventario', error);
      return {
        cantidadRestante: solicitud.cantidad,
        productosActualizados: 0,
        error: true,
        detalleEntregado: []
      };
    }
  };

  const notificarCambioEstado = async (
    solicitud: Solicitud,
    nuevoEstado: 'aprobada' | 'rechazada',
    mensajeInventario?: string,
    comentarioAdmin?: string
  ) => {
    const titulo =
      nuevoEstado === 'aprobada'
        ? 'Tu solicitud ha sido aprobada'
        : 'Tu solicitud ha sido rechazada';

    const mensaje = (() => {
      if (nuevoEstado === 'aprobada') {
        if (mensajeInventario) return mensajeInventario;
        return `Tu solicitud de ${solicitud.cantidad} ${solicitud.unidades?.simbolo ?? ''} de ${solicitud.tipo_alimento} ha sido aprobada.`;
      }

      if (comentarioAdmin && comentarioAdmin.trim().length > 0) {
        return `Tu solicitud fue rechazada. Comentario del administrador: ${comentarioAdmin.trim()}`;
      }

      return `Tu solicitud de ${solicitud.tipo_alimento} fue rechazada.`;
    })();

    // Preparar datos contextuales para plantilla especializada
    const numeroReferencia = `SOL-${new Date().getFullYear()}-${String(solicitud.id).padStart(6, '0')}`;
    const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const templateData = nuevoEstado === 'aprobada' ? {
      nombreSolicitante: solicitud.usuarios?.nombre ?? 'Solicitante',
      numeroReferencia,
      tipoAlimento: solicitud.tipo_alimento,
      cantidad: solicitud.cantidad,
      unidad: solicitud.unidades?.simbolo ?? 'unidades',
      cedulaSolicitante: solicitud.usuarios?.cedula,
      direccionEntrega: solicitud.usuarios?.direccion ?? 'Por confirmar',
      fechaAprobacion: fechaActual,
      fechaEstimadaEntrega: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      comentarioAdmin: comentarioAdmin && comentarioAdmin.trim() ? comentarioAdmin.trim() : undefined,
      nombreOperador: 'Sistema Banco de Alimentos',
      correoContacto: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@bancoalimentos.app',
      telefonoContacto: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '(+593) 2 xxxxx',
    } : {
      nombreSolicitante: solicitud.usuarios?.nombre ?? 'Solicitante',
      numeroReferencia,
      tipoAlimento: solicitud.tipo_alimento,
      cantidad: solicitud.cantidad,
      unidad: solicitud.unidades?.simbolo ?? 'unidades',
      fechaRechazo: fechaActual,
      motivoRechazo: comentarioAdmin && comentarioAdmin.trim() ? comentarioAdmin.trim() : 'No especificado',
      comentarioAdmin: comentarioAdmin && comentarioAdmin.trim() ? comentarioAdmin.trim() : undefined,
      correoContacto: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@bancoalimentos.app',
      telefonoContacto: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '(+593) 2 xxxxx',
    };

    await sendNotification({
      titulo,
      mensaje,
      categoria: nuevoEstado === 'aprobada' ? 'solicitud_aprobada' : 'solicitud_rechazada',
      tipo: nuevoEstado === 'aprobada' ? 'success' : 'warning',
      destinatarioId: solicitud.usuario_id,
      urlAccion: '/user/solicitudes',
      templateData,
      metadatos: {
        solicitudId: solicitud.id,
        nuevoEstado,
      },
    });
  };

  const buscarProductosCoincidentes = async (tipoAlimento: string): Promise<ProductoInventario[]> => {
    const { data, error } = await supabaseClient
      .from('productos_donados')
      .select('id_producto, nombre_producto, unidad_id')
      .ilike('nombre_producto', `%${tipoAlimento}%`);

    if (error) {
      throw error;
    }

    return (data as ProductoInventario[] | null | undefined) ?? [];
  };

  /**
   * Obtiene el factor de conversión entre dos unidades.
   * Si ambas son de la misma magnitud, busca en la tabla de conversiones.
   * @returns Factor de conversión (cantidad_origen * factor = cantidad_destino) o null si no hay conversión
   */
  const obtenerFactorConversion = async (
    unidadOrigenId: number,
    unidadDestinoId: number
  ): Promise<number | null> => {
    // Si son la misma unidad, no hay conversión necesaria
    if (unidadOrigenId === unidadDestinoId) {
      return 1;
    }

    try {
      // Obtener información de ambas unidades
      const { data: unidades, error: unidadesError } = await supabaseClient
        .from('unidades')
        .select('id, tipo_magnitud_id, es_base')
        .in('id', [unidadOrigenId, unidadDestinoId]);

      if (unidadesError || !unidades || unidades.length !== 2) {
        logger.warn('No se pudieron obtener las unidades para conversión', unidadesError);
        return null;
      }

      const unidadOrigen = unidades.find(u => u.id === unidadOrigenId);
      const unidadDestino = unidades.find(u => u.id === unidadDestinoId);

      // Verificar que sean de la misma magnitud
      if (!unidadOrigen || !unidadDestino || unidadOrigen.tipo_magnitud_id !== unidadDestino.tipo_magnitud_id) {
        logger.warn('Las unidades no son de la misma magnitud', { unidadOrigen, unidadDestino });
        return null;
      }

      // Buscar conversión directa
      const { data: conversionDirecta, error: convError1 } = await supabaseClient
        .from('conversiones')
        .select('factor_conversion')
        .eq('unidad_origen_id', unidadOrigenId)
        .eq('unidad_destino_id', unidadDestinoId)
        .maybeSingle();

      if (!convError1 && conversionDirecta) {
        return Number(conversionDirecta.factor_conversion);
      }

      // Buscar conversión inversa
      const { data: conversionInversa, error: convError2 } = await supabaseClient
        .from('conversiones')
        .select('factor_conversion')
        .eq('unidad_origen_id', unidadDestinoId)
        .eq('unidad_destino_id', unidadOrigenId)
        .maybeSingle();

      if (!convError2 && conversionInversa) {
        return 1 / Number(conversionInversa.factor_conversion);
      }

      logger.warn('No se encontró conversión entre las unidades', { unidadOrigenId, unidadDestinoId });
      return null;
    } catch (error) {
      logger.error('Error al obtener factor de conversión', error);
      return null;
    }
  };

  const procesarDescuentoInventario = async (productos: ProductoInventario[], solicitud: Solicitud): Promise<ResultadoInventario> => {
    let cantidadRestante = solicitud.cantidad;
    let productosActualizados = 0;
    const detalleEntregado: InventarioDescontado[] = [];

    for (const producto of productos) {
      if (cantidadRestante <= 0) break;
      const resultadoProducto = await descontarDeProducto(producto, cantidadRestante, solicitud);

      cantidadRestante = resultadoProducto.cantidadRestante;
      productosActualizados += resultadoProducto.productosActualizados;

      if (resultadoProducto.cantidadEntregada > 0) {
        detalleEntregado.push({
          producto,
          cantidadEntregada: resultadoProducto.cantidadEntregada
        });
      }
    }

    const noStock = detalleEntregado.length === 0;

    return {
      cantidadRestante,
      productosActualizados,
      detalleEntregado,
      noStock
    };
  };

  const descontarDeProducto = async (
    producto: ProductoInventario,
    cantidadNecesaria: number,
    solicitud: Solicitud
  ): Promise<DescuentoProductoResult> => {
    const { data, error } = await supabaseClient
      .from('inventario')
      .select('id_inventario, cantidad_disponible, id_deposito')
      .eq('id_producto', producto.id_producto)
      .gt('cantidad_disponible', 0)
      .order('fecha_actualizacion', { ascending: true });

    if (error || !data || data.length === 0) {
      logger.info(`Sin stock disponible para ${producto.nombre_producto}`);
      return {
        cantidadRestante: cantidadNecesaria,
        productosActualizados: 0,
        cantidadEntregada: 0
      };
    }

    // Aplicar conversión de unidades si es necesario
    let cantidadNecesariaEnUnidadInventario = cantidadNecesaria;
    
    // Log de diagnóstico
    logger.info(`Verificando conversión: solicitud.unidad_id=${solicitud.unidad_id}, producto.unidad_id=${producto.unidad_id}, producto=${producto.nombre_producto}`);
    
    if (!producto.unidad_id) {
      logger.warn(`⚠️ El producto "${producto.nombre_producto}" no tiene unidad_id definida. No se puede aplicar conversión. Usando cantidad directa: ${cantidadNecesaria}`);
    } else if (!solicitud.unidad_id) {
      logger.warn(`⚠️ La solicitud no tiene unidad_id definida. No se puede aplicar conversión. Usando cantidad directa: ${cantidadNecesaria}`);
    } else if (solicitud.unidad_id !== producto.unidad_id) {
      logger.info(`🔄 Iniciando conversión de unidad ${solicitud.unidad_id} a unidad ${producto.unidad_id}`);
      const factorConversion = await obtenerFactorConversion(solicitud.unidad_id, producto.unidad_id);
      
      if (factorConversion === null) {
        logger.warn(`❌ No se encontró conversión entre unidad ${solicitud.unidad_id} y ${producto.unidad_id}. Se usará la cantidad sin conversión: ${cantidadNecesaria}`);
      } else {
        cantidadNecesariaEnUnidadInventario = cantidadNecesaria * factorConversion;
        logger.info(`✅ Conversión aplicada: ${cantidadNecesaria} (unidad ${solicitud.unidad_id}) × ${factorConversion} = ${cantidadNecesariaEnUnidadInventario} (unidad ${producto.unidad_id})`);
      }
    } else {
      logger.info(`✓ Unidades coinciden (${solicitud.unidad_id}). No se requiere conversión.`);
    }

    let cantidadRestante = cantidadNecesariaEnUnidadInventario;
    let productosActualizados = 0;
    let cantidadEntregada = 0;

    for (const item of data) {
      if (cantidadRestante <= 0) break;

      const cantidadADescontar = Math.min(cantidadRestante, item.cantidad_disponible);
      const nuevaCantidad = item.cantidad_disponible - cantidadADescontar;

      const { error: updateError } = await supabaseClient
        .from('inventario')
        .update({
          cantidad_disponible: nuevaCantidad,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id_inventario', item.id_inventario);

      if (updateError) {
        logger.error('Error descontando inventario', updateError);
        continue;
      }

      cantidadRestante -= cantidadADescontar;
      cantidadEntregada += cantidadADescontar;
      productosActualizados += 1;

      logger.info(`Descontadas ${cantidadADescontar} unidades de ${producto.nombre_producto} (restante en stock: ${nuevaCantidad})`);
    }

    // Convertir la cantidad restante de vuelta a la unidad de la solicitud
    let cantidadRestanteOriginal = cantidadRestante;
    if (solicitud.unidad_id && producto.unidad_id && solicitud.unidad_id !== producto.unidad_id) {
      const factorConversion = await obtenerFactorConversion(producto.unidad_id, solicitud.unidad_id);
      if (factorConversion !== null) {
        cantidadRestanteOriginal = cantidadRestante * factorConversion;
      }
    }

    return {
      cantidadRestante: cantidadRestanteOriginal,
      productosActualizados,
      cantidadEntregada
    };
  };

  const registrarMovimientoSolicitud = async (solicitud: Solicitud, resultado: ResultadoInventario) => {
    try {
      if (resultado.detalleEntregado.length === 0) {
        logger.warn('No se registró movimiento porque no hubo descuento en inventario', resultado);
        return;
      }

      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData?.user) {
        logger.warn('No se encontró usuario autenticado para registrar movimiento', authError);
        return;
      }

      const { data: cabecera, error: cabeceraError } = await supabaseClient
        .from('movimiento_inventario_cabecera')
        .insert({
          fecha_movimiento: new Date().toISOString(),
          id_donante: authData.user.id,
          id_solicitante: solicitud.usuario_id,
          estado_movimiento: 'completado',
          observaciones: `Solicitud aprobada - ${solicitud.tipo_alimento} (${solicitud.cantidad} unidades)`
        })
        .select('id_movimiento')
        .single();

      if (cabeceraError || !cabecera) {
        logger.error('Error creando cabecera de movimiento', cabeceraError);
        return;
      }

      for (const detalle of resultado.detalleEntregado) {
        const { error: detalleError } = await supabaseClient
          .from('movimiento_inventario_detalle')
          .insert({
            id_movimiento: cabecera.id_movimiento,
            id_producto: detalle.producto.id_producto,
            cantidad: detalle.cantidadEntregada,
            tipo_transaccion: 'egreso',
            rol_usuario: 'beneficiario',
            observacion_detalle: `Entrega por solicitud aprobada - ${solicitud.tipo_alimento}`,
            unidad_id: detalle.producto.unidad_id ?? null
          });

        if (detalleError) {
          logger.error('Error creando detalle de movimiento', detalleError);
        }
      }
    } catch (error) {
      logger.error('Error registrando movimiento de solicitud', error);
    }
  };

  const buildResultadoMensaje = (solicitud: Solicitud, resultado: ResultadoInventario) => {
    if (resultado.error) {
      return 'Solicitud aprobada, pero ocurrió un error al actualizar el inventario.';
    }

    if (resultado.noStock) {
      return `Solicitud aprobada, pero no hay inventario disponible para "${solicitud.tipo_alimento}".`;
    }

    if (resultado.cantidadRestante > 0) {
      const entregado = solicitud.cantidad - resultado.cantidadRestante;
      return `Solicitud aprobada parcialmente. Se entregaron ${entregado} de ${solicitud.cantidad} unidades.`;
    }

    return 'Solicitud aprobada y descontada del inventario exitosamente.';
  };

  return {
    ...dataService,
    updateSolicitudEstado,
    revertirSolicitud
  };
};
