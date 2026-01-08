/**
 * Plantilla para confirmar recepción de nueva solicitud
 */

interface NuevaSolicitudTemplateInput {
  nombreSolicitante: string;
  numeroReferencia: string;
  tipoAlimento: string;
  cantidad: number;
  unidad: string;
  fechaSolicitud: string;
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

export function buildNuevaSolicitudEmailTemplate(input: NuevaSolicitudTemplateInput) {
  const { nombreSolicitante, numeroReferencia, tipoAlimento, cantidad, unidad, fechaSolicitud } = input;

  const safeNombre = escapeHtml(nombreSolicitante);
  const safeAlimento = escapeHtml(tipoAlimento);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✓ Solicitud Recibida</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
            Estimado/a <strong>${safeNombre}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
            Hemos recibido su solicitud de <strong>${safeAlimento}</strong> exitosamente. 
            Nuestro equipo la revisará pronto.
          </p>
          <div style="background-color: #eff6ff; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af;">Número de Referencia</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #2563eb; font-family: monospace;">
              ${escapeHtml(numeroReferencia)}
            </p>
          </div>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Alimento:</td><td style="font-weight: 600;">${safeAlimento}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Cantidad:</td><td style="font-weight: 600;">${cantidad} ${escapeHtml(unidad)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Fecha:</td><td style="font-weight: 600;">${escapeHtml(fechaSolicitud)}</td></tr>
          </table>
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/user/solicitudes" 
               style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px;">
              Ver Mis Solicitudes
            </a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Banco de Alimentos - Mensaje automático</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `SOLICITUD RECIBIDA\n\nEstimado/a ${nombreSolicitante},\n\nHemos recibido su solicitud de ${tipoAlimento} exitosamente.\n\nNúmero de Referencia: ${numeroReferencia}\nAlimento: ${tipoAlimento}\nCantidad: ${cantidad} ${unidad}\nFecha: ${fechaSolicitud}\n\nBanco de Alimentos`;

  return { subject: `Solicitud Recibida - ${tipoAlimento} (Ref: ${numeroReferencia})`, html, text };
}
