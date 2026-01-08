/**
 * Plantilla para alertas de inventario bajo
 */

interface InventarioBajoTemplateInput {
  nombreOperador: string;
  productos: Array<{
    nombre: string;
    cantidadActual: number;
    unidad: string;
    nivelMinimo: number;
  }>;
  fechaAlerta: string;
}

function escapeHtml(value: string | undefined): string {
  if (!value) return '';
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildInventarioBajoEmailTemplate(input: InventarioBajoTemplateInput) {
  const { nombreOperador, productos, fechaAlerta } = input;
  const safeNombre = escapeHtml(nombreOperador);

  const productosHtml = productos.map(p => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; font-size: 14px;">${escapeHtml(p.nombre)}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #dc2626; font-weight: 600;">${p.cantidadActual} ${escapeHtml(p.unidad)}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: center;">${p.nivelMinimo} ${escapeHtml(p.unidad)}</td>
    </tr>
  `).join('');

  const productosText = productos.map(p => `  - ${p.nombre}: ${p.cantidadActual} ${p.unidad} (Mínimo: ${p.nivelMinimo} ${p.unidad})`).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚠️ Alerta de Inventario</h1>
          <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px;">Stock bajo detectado</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
            Estimado/a <strong>${safeNombre}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
            Los siguientes productos tienen stock por debajo del nivel mínimo:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase;">Producto</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 13px; color: #6b7280; text-transform: uppercase;">Stock Actual</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 13px; color: #6b7280; text-transform: uppercase;">Nivel Mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${productosHtml}
            </tbody>
          </table>
          <div style="background-color: #fef2f2; padding: 16px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 14px; color: #7f1d1d; font-weight: 600;">
              Fecha de Alerta: ${escapeHtml(fechaAlerta)}
            </p>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/operador/inventario" 
               style="display: inline-block; padding: 12px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Ver Inventario
            </a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Banco de Alimentos - Sistema de Alertas</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `ALERTA DE INVENTARIO BAJO\n\nEstimado/a ${nombreOperador},\n\nLos siguientes productos tienen stock bajo:\n\n${productosText}\n\nFecha: ${fechaAlerta}\n\nBanco de Alimentos`;

  return { subject: `⚠️ Alerta: Inventario Bajo`, html, text };
}
