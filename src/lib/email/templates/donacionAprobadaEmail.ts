/**
 * Plantilla de email especializada para donaciones APROBADAS (estado: Recogida)
 * Incluye: detalles del donante, información del producto, detalles de logística
 */

interface DonacionAprobadaTemplateInput {
  nombreDonante: string;
  numeroReferencia: string; // DON-2026-00001
  tipoProducto: string; // "Arroz"
  cantidad: number; // 100
  unidad: string; // "kg", "lb"
  cedulaRuc?: string;
  direccionDonante: string;
  direccionEntrega: string;
  horarioPreferido?: string;
  fechaAprobacion: string; // "7 de enero de 2026"
  fechaEstimadaRecogida?: string; // "10 de enero de 2026"
  observaciones?: string;
  impactoEstimado?: string; // "Beneficiará a 50 personas"
  nombreLogistica?: string; // "Personal de Logística"
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

export function buildDonacionAprobadaEmailTemplate(
  input: DonacionAprobadaTemplateInput
) {
  const {
    nombreDonante,
    numeroReferencia,
    tipoProducto,
    cantidad,
    unidad,
    cedulaRuc,
    direccionDonante,
    direccionEntrega,
    horarioPreferido,
    fechaAprobacion,
    fechaEstimadaRecogida,
    observaciones,
    impactoEstimado,
    nombreLogistica,
    correoContacto,
    telefonoContacto,
  } = input;

  const safeNombre = escapeHtml(nombreDonante);
  const safeProducto = escapeHtml(tipoProducto);
  const safeDireccionDonante = escapeHtml(direccionDonante);
  const safeDireccionEntrega = escapeHtml(direccionEntrega);
  const safeLogistica = escapeHtml(nombreLogistica || 'Equipo de Logística');
  const safeObservaciones = escapeHtml(observaciones);
  const safeHorario = escapeHtml(horarioPreferido);

  // Generar HTML con estilos profesionales
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Donación Procesada - Banco de Alimentos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="background-color: #f3f4f6; padding: 24px 0;">
        <!-- Container Principal -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header con color de marca -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✓ Donación Procesada</h1>
            <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">Su donación ha sido aprobada y será recogida próximamente</p>
          </div>

          <!-- Contenido principal -->
          <div style="padding: 32px 24px;">
            
            <!-- Saludo personalizado -->
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
              Estimado/a <strong>${safeNombre}</strong>,
            </p>

            <!-- Párrafo introducción -->
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              Agradecemos sinceramente su generosa donación de <strong>${safeProducto}</strong>. 
              Su contribución ha sido <strong style="color: #10b981;">aprobada y registrada</strong> en nuestro sistema. 
              A continuación, encontrará los detalles de su donación y el cronograma de recogida.
            </p>

            <!-- Tarjeta de comprobante -->
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Número de Referencia
                  </p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #10b981; font-family: 'Courier New', monospace;">
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

            <!-- Detalles de la donación -->
            <h2 style="margin: 24px 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
              Detalles de su Donación
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280; width: 40%;">Tipo de Producto:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeProducto}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cantidad Donada:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${cantidad} ${escapeHtml(unidad)}</td>
              </tr>
              ${
                cedulaRuc
                  ? `<tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Cédula/RUC:</td>
                    <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(cedulaRuc)}</td>
                  </tr>`
                  : ''
              }
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Dirección Donante:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeDireccionDonante}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Dirección de Entrega:</td>
                <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeDireccionEntrega}</td>
              </tr>
              ${
                horarioPreferido
                  ? `<tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Horario Preferido:</td>
                    <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${safeHorario}</td>
                  </tr>`
                  : ''
              }
              ${
                fechaEstimadaRecogida
                  ? `<tr>
                    <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Fecha Estimada de Recogida:</td>
                    <td style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #10b981;">${escapeHtml(fechaEstimadaRecogida)}</td>
                  </tr>`
                  : ''
              }
            </table>

            <!-- Información de impacto -->
            ${
              impactoEstimado
                ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">
                Impacto Social
              </p>
              <p style="margin: 0; font-size: 14px; color: #78350f; font-weight: 600;">
                ${escapeHtml(impactoEstimado)}
              </p>
            </div>
                `
                : ''
            }

            <!-- Observaciones -->
            ${
              safeObservaciones
                ? `
            <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #374151; text-transform: uppercase; font-weight: 600;">
                Observaciones Adicionales
              </p>
              <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                ${safeObservaciones}
              </p>
            </div>
                `
                : ''
            }

            <!-- Información de contacto -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600;">
                Equipo de Logística
              </p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a;">
                <strong>${safeLogistica}</strong>
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bancoalimentos.app'}/donante/donaciones" 
                 style="display: inline-block; padding: 12px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                Ver Mi Donación
              </a>
            </p>

            <!-- Información de estado -->
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                <strong>Procesado por:</strong> ${safeLogistica}
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <strong>Estado:</strong> <span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-weight: 600;">APROBADO - EN LOGÍSTICA</span>
              </p>
            </div>

            <!-- Notas legales -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                Este es un comprobante oficial de aprobación de su donación en el sistema Banco de Alimentos. 
                Nuestro equipo de logística se comunicará próximamente para coordinar la recogida. 
                Conserve este correo como referencia.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              <strong>Banco de Alimentos</strong>
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
              Gracias por su generosidad. Este mensaje fue generado automáticamente.
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
    'DONACIÓN PROCESADA - BANCO DE ALIMENTOS',
    '='.repeat(60),
    '',
    `Estimado/a ${nombreDonante},`,
    '',
    `Agradecemos sinceramente su donación de ${tipoProducto}.`,
    `Su donación ha sido aprobada y será recogida próximamente.`,
    '',
    '-'.repeat(60),
    'DETALLES DE SU DONACIÓN',
    '-'.repeat(60),
    '',
    `Número de Referencia: ${numeroReferencia}`,
    `Fecha de Aprobación: ${fechaAprobacion}`,
    `Tipo de Producto: ${tipoProducto}`,
    `Cantidad Donada: ${cantidad} ${unidad}`,
    ...(cedulaRuc ? [`Cédula/RUC: ${cedulaRuc}`] : []),
    `Dirección Donante: ${direccionDonante}`,
    `Dirección de Entrega: ${direccionEntrega}`,
    ...(horarioPreferido ? [`Horario Preferido: ${horarioPreferido}`] : []),
    ...(fechaEstimadaRecogida
      ? [`Fecha Estimada de Recogida: ${fechaEstimadaRecogida}`]
      : []),
    '',
    ...(impactoEstimado
      ? ['-'.repeat(60), 'IMPACTO SOCIAL', '-'.repeat(60), '', impactoEstimado, '']
      : []),
    ...(observaciones
      ? ['-'.repeat(60), 'OBSERVACIONES ADICIONALES', '-'.repeat(60), '', observaciones, '']
      : []),
    '-'.repeat(60),
    'EQUIPO DE LOGÍSTICA',
    '-'.repeat(60),
    '',
    `Personal: ${nombreLogistica || 'Equipo de Logística'}`,
    ...(correoContacto ? [`Correo: ${correoContacto}`] : []),
    ...(telefonoContacto ? [`Teléfono: ${telefonoContacto}`] : []),
    '',
    `Estado: APROBADO - EN LOGÍSTICA`,
    '-'.repeat(60),
    '',
    'Este es un comprobante oficial de aprobación de su donación.',
    'Por favor, espere contacto de nuestro equipo de logística.',
    '',
    'Banco de Alimentos',
    'Gracias por su generosidad.',
  ];

  const text = textLines.join('\n');
  const subject = `Donación Aprobada - ${tipoProducto} (Ref: ${numeroReferencia})`;

  return { subject, html, text };
}
