/**
 * Plantilla de email especializada para solicitudes de alimentos APROBADAS
 * Incluye: detalles de la solicitud, información de entrega, comprobante de aprobación
 */

interface SolicitudAprobadaTemplateInput {
  nombreSolicitante: string;
  numeroReferencia: string; // SOL-2026-00001
  tipoAlimento: string; // "Arroz"
  cantidad: number; // 50
  unidad: string; // "kg", "lb"
  cedulaSolicitante?: string;
  direccionEntrega: string;
  fechaAprobacion: string; // "7 de enero de 2026"
  fechaEstimadaEntrega?: string; // "10 de enero de 2026"
  comentarioAdmin?: string; // comentarios adicionales
  nombreOperador?: string; // "Juan Pérez" - quien aprobó
  correoContacto?: string;
  telefonoContacto?: string;
}

function escapeHtml(value: string | undefined): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildSolicitudAprobadaEmailTemplate(
  input: SolicitudAprobadaTemplateInput
) {
  const {
    nombreSolicitante,
    numeroReferencia,
    tipoAlimento,
    cantidad,
    unidad,
    cedulaSolicitante,
    direccionEntrega,
    fechaAprobacion,
    fechaEstimadaEntrega,
    comentarioAdmin,
    nombreOperador,
    correoContacto,
    telefonoContacto,
  } = input;

  const safeNombre = escapeHtml(nombreSolicitante);
  const safeAlimento = escapeHtml(tipoAlimento);
  const safeDireccion = escapeHtml(direccionEntrega);
  const safeOperador = escapeHtml(nombreOperador || 'Sistema Banco de Alimentos');
  const safeComentario = escapeHtml(comentarioAdmin);

  // Generar HTML con estilos inline profesionales
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud Aprobada - Banco de Alimentos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="background-color: #f3f4f6; padding: 24px 0;">
        <!-- Container Principal -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header con color de marca -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✓ Solicitud Aprobada</h1>
            <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px;">Tu solicitud de alimentos ha sido procesada exitosamente</p>
          </div>

          <!-- Contenido principal -->
          <div style="padding: 32px 24px;">
            
            <!-- Saludo personalizado -->
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
              Estimado/a <strong>${safeNombre}</strong>,
            </p>

            <!-- Párrafo introducción -->
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Nos complace informarle que su solicitud de ${safeAlimento} ha sido <strong style="color: #16a34a;">aprobada</strong> por nuestro equipo. 
              A continuación, encontrará los detalles completos de su aprobación y entrega.
            </p>

            <!-- Tarjeta de comprobante -->
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Número de Referencia
                  </p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #16a34a; font-family: 'Courier New', monospace;">
                    ${escapeHtml(numeroReferencia)}
                  </p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Fecha de Aprobación
                  </p>
                  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1f2937;">
                    ${escapeHtml(fechaAprobacion)}
                  </p>
                </div>
              </div>
            </div>

            <!-- Detalles de la solicitud -->
            <h2 style="margin: 24px 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
              Detalles de su Solicitud
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280; width: 40%;">Tipo de Alimento:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeAlimento}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cantidad Aprobada:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${cantidad} ${escapeHtml(unidad)}</td>
              </tr>
              ${
                cedulaSolicitante
                  ? `<tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cédula:</td>
                    <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(cedulaSolicitante)}</td>
                  </tr>`
                  : ''
              }
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Dirección de Entrega:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeDireccion}</td>
              </tr>
              ${
                fechaEstimadaEntrega
                  ? `<tr>
                    <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Fecha Estimada de Entrega:</td>
                    <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #dc2626;">${escapeHtml(fechaEstimadaEntrega)}</td>
                  </tr>`
                  : ''
              }
            </table>

            <!-- Comentarios del operador -->
            ${
              safeComentario
                ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">
                Notas Adicionales
              </p>
              <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">
                ${safeComentario}
              </p>
            </div>
                `
                : ''
            }

            <!-- Información de contacto -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600;">
                ¿Preguntas o Necesita Ayuda?
              </p>
              <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.6;">
                ${
                  correoContacto
                    ? `Correo: <strong>${escapeHtml(correoContacto)}</strong><br />`
                    : ''
                }
                ${
                  telefonoContacto
                    ? `Teléfono: <strong>${escapeHtml(telefonoContacto)}</strong>`
                    : ''
                }
              </p>
            </div>

            <!-- Call to Action -->
            <p style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bancoalimentos.app'}/user/solicitudes" 
                 style="display: inline-block; padding: 12px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                Ver Mi Solicitud
              </a>
            </p>

            <!-- Información de aprobación -->
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                <strong>Aprobado por:</strong> ${safeOperador}
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <strong>Estado:</strong> <span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-weight: 600;">APROBADO</span>
              </p>
            </div>

            <!-- Notas legales -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                Este es un comprobante oficial de aprobación de su solicitud en el sistema Banco de Alimentos. 
                Conserve este correo como referencia para futuras consultas. Si tiene dudas sobre su solicitud, 
                por favor comuníquese con nuestro equipo de soporte.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              <strong>Banco de Alimentos</strong>
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
              Este mensaje fue generado automáticamente. Por favor, no responda a este correo.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Generar versión en texto plano
  const textLines = [
    '='.repeat(60),
    'SOLICITUD DE ALIMENTOS APROBADA',
    '='.repeat(60),
    '',
    `Estimado/a ${nombreSolicitante},`,
    '',
    `Su solicitud de ${tipoAlimento} ha sido aprobada por nuestro equipo.`,
    '',
    '-'.repeat(60),
    'DETALLES DE SU SOLICITUD',
    '-'.repeat(60),
    '',
    `Número de Referencia: ${numeroReferencia}`,
    `Fecha de Aprobación: ${fechaAprobacion}`,
    `Tipo de Alimento: ${tipoAlimento}`,
    `Cantidad Aprobada: ${cantidad} ${unidad}`,
    ...(cedulaSolicitante ? [`Cédula: ${cedulaSolicitante}`] : []),
    `Dirección de Entrega: ${direccionEntrega}`,
    ...(fechaEstimadaEntrega
      ? [`Fecha Estimada de Entrega: ${fechaEstimadaEntrega}`]
      : []),
    '',
    ...(comentarioAdmin
      ? ['-'.repeat(60), 'NOTAS ADICIONALES', '-'.repeat(60), '', comentarioAdmin, '']
      : []),
    ...(correoContacto || telefonoContacto
      ? ['-'.repeat(60), '¿PREGUNTAS O NECESITA AYUDA?', '-'.repeat(60), '']
      : []),
    ...(correoContacto ? [`Correo: ${correoContacto}`] : []),
    ...(telefonoContacto ? [`Teléfono: ${telefonoContacto}`] : []),
    '',
    `-`.repeat(60),
    `Aprobado por: ${nombreOperador || 'Sistema Banco de Alimentos'}`,
    `Estado: APROBADO`,
    '-'.repeat(60),
    '',
    'Este es un comprobante oficial de aprobación de su solicitud.',
    'Por favor, conserve este correo como referencia.',
    '',
    'Banco de Alimentos',
    'Este mensaje fue generado automáticamente.',
  ];

  const text = textLines.join('\n');
  const subject = `Solicitud Aprobada - ${tipoAlimento} (Ref: ${numeroReferencia})`;

  return { subject, html, text };
}
