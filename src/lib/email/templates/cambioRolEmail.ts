/**
 * Plantilla para notificar cambio de rol de usuario
 */

interface CambioRolTemplateInput {
  nombreUsuario: string;
  rolAnterior: string;
  rolNuevo: string;
  fechaCambio: string;
}

function escapeHtml(value: string | undefined): string {
  if (!value) return '';
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getRolNombre(rol: string): string {
  const roles: Record<string, string> = {
    'ADMINISTRADOR': 'Administrador',
    'OPERADOR': 'Operador',
    'DONANTE': 'Donante',
    'SOLICITANTE': 'Beneficiario'
  };
  return roles[rol.toUpperCase()] || rol;
}

export function buildCambioRolEmailTemplate(input: CambioRolTemplateInput) {
  const { nombreUsuario, rolAnterior, rolNuevo, fechaCambio } = input;
  const safeNombre = escapeHtml(nombreUsuario);
  const nombreRolAnterior = getRolNombre(rolAnterior);
  const nombreRolNuevo = getRolNombre(rolNuevo);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔑 Cambio de Rol</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
            Estimado/a <strong>${safeNombre}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">
            Le informamos que su rol en la plataforma ha sido actualizado.
          </p>
          <div style="background-color: #f5f3ff; padding: 20px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <table style="width: 100%;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Rol Anterior:</td><td style="font-weight: 600;">${escapeHtml(nombreRolAnterior)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Rol Nuevo:</td><td style="font-weight: 600; color: #8b5cf6;">${escapeHtml(nombreRolNuevo)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Fecha:</td><td style="font-weight: 600;">${escapeHtml(fechaCambio)}</td></tr>
            </table>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}" 
               style="display: inline-block; padding: 12px 32px; background-color: #8b5cf6; color: #ffffff; text-decoration: none; border-radius: 8px;">
              Acceder a la Plataforma
            </a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Banco de Alimentos</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `CAMBIO DE ROL\n\nEstimado/a ${nombreUsuario},\n\nSu rol ha sido actualizado:\nRol Anterior: ${nombreRolAnterior}\nRol Nuevo: ${nombreRolNuevo}\nFecha: ${fechaCambio}\n\nBanco de Alimentos`;

  return { subject: `Cambio de Rol - Banco de Alimentos`, html, text };
}
