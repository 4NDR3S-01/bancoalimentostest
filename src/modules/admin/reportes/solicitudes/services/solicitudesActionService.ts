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

  const revertirSolicitud = async (solicitudId: string): Promise<ServiceResult<SolicitudActionResponse>> => {
    try {
      const { error } = await supabaseClient
        .from('solicitudes')
        .update({
          estado: 'pendiente',
          fecha_respuesta: null
        })
        .eq('id', solicitudId);

      if (error) {
        logger.error('Error al revertir solicitud', error);
        return {
          success: false,
          error: 'No fue posible revertir la solicitud',
          errorDetails: error
        };
      }

      return {
        success: true,
        data: {
          success: true,
          message: 'Solicitud revertida a pendiente exitosamente'
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

    await sendNotification({
      titulo,
      mensaje,
      categoria: 'solicitud',
      tipo: nuevoEstado === 'aprobada' ? 'success' : 'warning',
      destinatarioId: solicitud.usuario_id,
      urlAccion: '/user/solicitudes',
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
