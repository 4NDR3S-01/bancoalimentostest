/**
 * Plantilla de email de bienvenida para nuevos usuarios
 */

interface BienvenidaTemplateInput {
  nombreUsuario: string;
  rol: string;
  email: string;
  urlPlataforma?: string;
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

function getRolDescripcion(rol: string): string {
  const roles: Record<string, string> = {
    'ADMINISTRADOR': 'Administrador del sistema',
    'OPERADOR': 'Operador',
    'DONANTE': 'Donante',
    'SOLICITANTE': 'Beneficiario'
  };
  return roles[rol.toUpperCase()] || rol;
}

export function buildBienvenidaEmailTemplate(input: BienvenidaTemplateInput) {
  const { nombreUsuario, rol, email, urlPlataforma } = input;

  const safeNombre = escapeHtml(nombreUsuario);
  const safeEmail = escapeHtml(email);
  const rolDescripcion = getRolDescripcion(rol);
  const url = urlPlataforma || process.env.NEXT_PUBLIC_APP_URL || 'https://bancoalimentos.app';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">¡Bienvenido!</h1>
          <p style="margin: 12px 0 0 0; color: #fecaca; font-size: 16px;">Banco de Alimentos</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">
            Estimado/a <strong>${safeNombre}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
            Es un placer darle la bienvenida a la plataforma del <strong>Banco de Alimentos</strong>. 
            Su cuenta ha sido creada exitosamente y ya puede comenzar a utilizar nuestros servicios.
          </p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #065f46; font-weight: 600;">
              Información de su cuenta
            </p>
            <table style="width: 100%;">
              <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Correo:</td><td style="font-weight: 600; font-size: 14px;">${safeEmail}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Rol:</td><td style="font-weight: 600; font-size: 14px;">${escapeHtml(rolDescripcion)}</td></tr>
            </table>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #1e40af; font-weight: 600;">
              Próximos pasos
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e3a8a; line-height: 1.8;">
              <li>Complete su perfil con toda la información necesaria</li>
              <li>Explore las funcionalidades disponibles para su rol</li>
              <li>Contacte con soporte si tiene alguna duda</li>
            </ul>
          </div>

          <p style="text-align: center; margin: 32px 0;">
            <a href="${url}" 
               style="display: inline-block; padding: 14px 40px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Acceder a la Plataforma
            </a>
          </p>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px;">
            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
              Si tiene alguna pregunta o necesita ayuda, no dude en contactarnos. 
              Estamos aquí para apoyarle en cada paso.
            </p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;"><strong>Banco de Alimentos</strong></p>
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Unidos por una comunidad sin hambre</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `¡BIENVENIDO A BANCO DE ALIMENTOS!\n\nEstimado/a ${nombreUsuario},\n\nSu cuenta ha sido creada exitosamente.\n\nInformación de su cuenta:\nCorreo: ${email}\nRol: ${rolDescripcion}\n\nPróximos pasos:\n- Complete su perfil\n- Explore las funcionalidades\n- Contacte con soporte si necesita ayuda\n\nAcceda a: ${url}\n\nBanco de Alimentos - Unidos por una comunidad sin hambre`;

  return { subject: `¡Bienvenido a Banco de Alimentos!`, html, text };
}
