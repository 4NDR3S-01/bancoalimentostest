/**
 * Plantilla de email especializada para donaciones CANCELADAS
 * Incluye: razón de cancelación, detalles de la donación, información de contacto
 */

interface DonacionCanceladaTemplateInput {
  nombreDonante: string;
  numeroReferencia: string;
  tipoProducto: string;
  cantidad: number;
  unidad: string;
  fechaCancelacion: string;
  motivoCancelacion?: string;
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

export function buildDonacionCanceladaEmailTemplate(
  input: DonacionCanceladaTemplateInput
) {
  const {
    nombreDonante,
    numeroReferencia,
    tipoProducto,
    cantidad,
    unidad,
    fechaCancelacion,
    motivoCancelacion,
    correoContacto,
    telefonoContacto,
  } = input;

  const safeNombre = escapeHtml(nombreDonante);
  const safeProducto = escapeHtml(tipoProducto);
  const safeMotivo = escapeHtml(motivoCancelacion);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Donación Cancelada - Banco de Alimentos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="background-color: #f3f4f6; padding: 24px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✗ Donación Cancelada</h1>
            <p style="margin: 8px 0 0 0; color: #fecaca; font-size: 14px;">Información sobre su donación</p>
          </div>

          <div style="padding: 32px 24px;">
            
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
              Estimado/a <strong>${safeNombre}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Le informamos que su donación de <strong>${safeProducto}</strong> ha sido cancelada. 
              Lamentamos cualquier inconveniente que esto pueda causar.
            </p>

            <div style="background-color: #fef2f2; border-left: 4px solid: #ef4444; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">
                  Número de Referencia
                </p>
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #dc2626; font-family: 'Courier New', monospace;">
                  ${escapeHtml(numeroReferencia)}
                </p>
              </div>
              <p style="margin: 0; font-size: 12px; color: #7f1d1d;">
                Fecha de Cancelación: ${escapeHtml(fechaCancelacion)}
              </p>
            </div>

            <h2 style="margin: 24px 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
              Detalles de la Donación
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280; width: 40%;">Tipo de Producto:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeProducto}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cantidad:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${cantidad} ${escapeHtml(unidad)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Estado:</td>
                <td style="padding: 12px 0; font-size: 14px;">
                  <span style="background-color: #fef2f2; color: #991b1b; padding: 4px 12px; border-radius: 4px; font-weight: 600;">CANCELADA</span>
                </td>
              </tr>
            </table>

            ${
              safeMotivo
                ? `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">
                Motivo de Cancelación
              </p>
              <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">
                ${safeMotivo}
              </p>
            </div>
                `
                : ''
            }

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 600;">
                ¿Desea Donar Nuevamente?
              </p>
              <p style="margin: 0; font-size: 14px; color: #064e3b; line-height: 1.6;">
                Puede registrar una nueva donación en cualquier momento. Su generosidad es muy valiosa para nuestra comunidad.
              </p>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600;">
                Contacto
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

            <p style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bancoalimentos.app'}/donante/donaciones" 
                 style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                Nueva Donación
              </a>
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                Gracias por su interés en apoyar a nuestra comunidad. 
                Esperamos contar con su colaboración en el futuro.
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
    'DONACIÓN CANCELADA',
    '='.repeat(60),
    '',
    `Estimado/a ${nombreDonante},`,
    '',
    `Su donación de ${tipoProducto} ha sido cancelada.`,
    '',
    '-'.repeat(60),
    'DETALLES DE LA DONACIÓN',
    '-'.repeat(60),
    '',
    `Número de Referencia: ${numeroReferencia}`,
    `Fecha de Cancelación: ${fechaCancelacion}`,
    `Tipo de Producto: ${tipoProducto}`,
    `Cantidad: ${cantidad} ${unidad}`,
    `Estado: CANCELADA`,
    '',
    ...(motivoCancelacion
      ? ['-'.repeat(60), 'MOTIVO DE CANCELACIÓN', '-'.repeat(60), '', motivoCancelacion, '']
      : []),
    'Puede registrar una nueva donación en cualquier momento.',
    '',
    ...(correoContacto || telefonoContacto
      ? ['-'.repeat(60), 'CONTACTO', '-'.repeat(60), '']
      : []),
    ...(correoContacto ? [`Correo: ${correoContacto}`] : []),
    ...(telefonoContacto ? [`Teléfono: ${telefonoContacto}`] : []),
    '',
    'Banco de Alimentos',
    'Gracias por su interés en apoyar a nuestra comunidad.',
  ];

  const text = textLines.join('\n');
  const subject = `Donación Cancelada - ${tipoProducto} (Ref: ${numeroReferencia})`;

  return { subject, html, text };
}
