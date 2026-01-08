/**
 * Plantilla de email especializada para solicitudes RECHAZADAS
 * Incluye: razón del rechazo, detalles de la solicitud, información de contacto
 */

interface SolicitudRechazadaTemplateInput {
  nombreSolicitante: string;
  numeroReferencia: string;
  tipoAlimento: string;
  cantidad: number;
  unidad: string;
  fechaRechazo: string;
  motivoRechazo?: string;
  comentarioAdmin?: string;
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

export function buildSolicitudRechazadaEmailTemplate(
  input: SolicitudRechazadaTemplateInput
) {
  const {
    nombreSolicitante,
    numeroReferencia,
    tipoAlimento,
    cantidad,
    unidad,
    fechaRechazo,
    motivoRechazo,
    comentarioAdmin,
    correoContacto,
    telefonoContacto,
  } = input;

  const safeNombre = escapeHtml(nombreSolicitante);
  const safeAlimento = escapeHtml(tipoAlimento);
  const safeMotivo = escapeHtml(motivoRechazo || comentarioAdmin);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud No Aprobada - Banco de Alimentos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="background-color: #f3f4f6; padding: 24px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚠ Solicitud No Aprobada</h1>
            <p style="margin: 8px 0 0 0; color: #fef3c7; font-size: 14px;">Revisión de su solicitud de alimentos</p>
          </div>

          <div style="padding: 32px 24px;">
            
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
              Estimado/a <strong>${safeNombre}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Lamentamos informarle que su solicitud de <strong>${safeAlimento}</strong> no ha podido ser aprobada en este momento. 
              A continuación encontrará los detalles de su solicitud y la información sobre los próximos pasos.
            </p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                  Número de Referencia
                </p>
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #d97706; font-family: 'Courier New', monospace;">
                  ${escapeHtml(numeroReferencia)}
                </p>
              </div>
              <p style="margin: 0; font-size: 12px; color: #78350f;">
                Fecha de Revisión: ${escapeHtml(fechaRechazo)}
              </p>
            </div>

            <h2 style="margin: 24px 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
              Detalles de su Solicitud
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280; width: 40%;">Tipo de Alimento:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeAlimento}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cantidad Solicitada:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${cantidad} ${escapeHtml(unidad)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Estado:</td>
                <td style="padding: 12px 0; font-size: 14px;">
                  <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-weight: 600;">NO APROBADA</span>
                </td>
              </tr>
            </table>

            ${
              safeMotivo
                ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 600;">
                Motivo del Rechazo
              </p>
              <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">
                ${safeMotivo}
              </p>
            </div>
                `
                : ''
            }

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600;">
                Próximos Pasos
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e3a8a; line-height: 1.8;">
                <li>Puede presentar una nueva solicitud en cualquier momento</li>
                <li>Revise los requisitos para solicitar alimentos</li>
                <li>Contáctenos si tiene dudas sobre el proceso</li>
              </ul>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 600;">
                ¿Necesita Ayuda?
              </p>
              <p style="margin: 0; font-size: 14px; color: #064e3b; line-height: 1.6;">
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

            <p style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bancoalimentos.app'}/user/solicitudes" 
                 style="display: inline-block; padding: 12px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                Ver Mis Solicitudes
              </a>
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                Este es un mensaje oficial del sistema Banco de Alimentos. 
                Estamos comprometidos en ayudarle y puede presentar una nueva solicitud cuando lo necesite.
              </p>
            </div>
          </div>

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

  const textLines = [
    '='.repeat(60),
    'SOLICITUD NO APROBADA',
    '='.repeat(60),
    '',
    `Estimado/a ${nombreSolicitante},`,
    '',
    `Su solicitud de ${tipoAlimento} no ha sido aprobada en este momento.`,
    '',
    '-'.repeat(60),
    'DETALLES DE SU SOLICITUD',
    '-'.repeat(60),
    '',
    `Número de Referencia: ${numeroReferencia}`,
    `Fecha de Revisión: ${fechaRechazo}`,
    `Tipo de Alimento: ${tipoAlimento}`,
    `Cantidad Solicitada: ${cantidad} ${unidad}`,
    `Estado: NO APROBADA`,
    '',
    ...(motivoRechazo || comentarioAdmin
      ? ['-'.repeat(60), 'MOTIVO DEL RECHAZO', '-'.repeat(60), '', motivoRechazo || comentarioAdmin, '']
      : []),
    '-'.repeat(60),
    'PRÓXIMOS PASOS',
    '-'.repeat(60),
    '',
    '- Puede presentar una nueva solicitud en cualquier momento',
    '- Revise los requisitos para solicitar alimentos',
    '- Contáctenos si tiene dudas sobre el proceso',
    '',
    ...(correoContacto || telefonoContacto
      ? ['-'.repeat(60), '¿NECESITA AYUDA?', '-'.repeat(60), '']
      : []),
    ...(correoContacto ? [`Correo: ${correoContacto}`] : []),
    ...(telefonoContacto ? [`Teléfono: ${telefonoContacto}`] : []),
    '',
    'Banco de Alimentos',
    'Este mensaje fue generado automáticamente.',
  ];

  const text = textLines.join('\n');
  const subject = `Solicitud No Aprobada - ${tipoAlimento} (Ref: ${numeroReferencia})`;

  return { subject, html, text };
}
