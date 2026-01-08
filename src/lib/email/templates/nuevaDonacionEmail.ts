/**
 * Plantilla para confirmar recepción de nueva donación
 */

interface NuevaDonacionTemplateInput {
  nombreDonante: string;
  numeroReferencia: string;
  tipoProducto: string;
  cantidad: number;
  unidad: string;
  fechaDonacion: string;
  impactoEstimado?: string;
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

export function buildNuevaDonacionEmailTemplate(input: NuevaDonacionTemplateInput) {
  const { nombreDonante, numeroReferencia, tipoProducto, cantidad, unidad, fechaDonacion, impactoEstimado } = input;

  const safeNombre = escapeHtml(nombreDonante);
  const safeProducto = escapeHtml(tipoProducto);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎁 Donación Recibida</h1>
          <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">¡Gracias por su generosidad!</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
            Estimado/a <strong>${safeNombre}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
            Hemos registrado su donación de <strong>${safeProducto}</strong>. 
            Nuestro equipo de logística se pondrá en contacto pronto para coordinar la recogida.
          </p>
          <div style="background-color: #f0fdf4; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #065f46;">Número de Referencia</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #10b981; font-family: monospace;">
              ${escapeHtml(numeroReferencia)}
            </p>
          </div>
          <table style="width: 100%; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Producto:</td><td style="font-weight: 600;">${safeProducto}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Cantidad:</td><td style="font-weight: 600;">${cantidad} ${escapeHtml(unidad)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Fecha:</td><td style="font-weight: 600;">${escapeHtml(fechaDonacion)}</td></tr>
          </table>
          ${
            impactoEstimado
              ? `<div style="background-color: #fef3c7; padding: 16px; margin: 16px 0; border-radius: 8px;">
                   <p style="margin: 0; color: #78350f; font-weight: 600;">💙 ${escapeHtml(impactoEstimado)}</p>
                 </div>`
              : ''
          }
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/donante/donaciones" 
               style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px;">
              Ver Mis Donaciones
            </a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Banco de Alimentos - Gracias por su solidaridad</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `DONACIÓN RECIBIDA\n\nEstimado/a ${nombreDonante},\n\nGracias por su donación de ${tipoProducto}.\n\nNúmero de Referencia: ${numeroReferencia}\nProducto: ${tipoProducto}\nCantidad: ${cantidad} ${unidad}\nFecha: ${fechaDonacion}\n\n${impactoEstimado || ''}\n\nBanco de Alimentos`;

  return { subject: `Donación Recibida - ${tipoProducto} (Ref: ${numeroReferencia})`, html, text };
}
