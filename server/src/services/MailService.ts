import nodemailer from 'nodemailer';

export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  async sendWelcomeEmail(user: any) {
    const mailOptions = {
      from: `"PRODE Liga Argentina" <${process.env.MAIL_USER}>`,
      to: user.mail,
      subject: '¡Bienvenido al PRODE Liga Argentina!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #74ACDF;">¡Hola, ${user.nombre}!</h2>
          <p>Te has registrado exitosamente en el <strong>PRODE Liga Argentina</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p><strong>Tus datos de acceso:</strong></p>
            <p><strong>Nickname:</strong> ${user.nickname}</p>
            <p><strong>Email:</strong> ${user.mail}</p>
          </div>
          <p>¡Mucha suerte con tus pronósticos!</p>
          <hr>
          <p style="font-size: 0.8em; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de bienvenida enviado a: ${user.mail}`);
    } catch (error) {
      console.error('Error enviando email:', error);
    }
  }

  async sendPredictionConfirmation(user: any, fixture: any, detalles: any[]) {
    // Generar Fecha y Hora en zona horaria de Buenos Aires
    const dateArg = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "long" });
    const timeArg = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", timeStyle: "medium" });

    // Colores del diseño de la imagen
    const greenBg = '#198725';
    const darkGreenBorder = '#115c19';
    
    let matchesHtml = `
      <table style="width: 100%; max-width: 650px; margin: auto; border-collapse: collapse; border: 2px solid ${darkGreenBorder}; font-family: Arial, sans-serif;">
        <!-- Cabecera Verde Principal -->
        <tr style="background-color: ${greenBg}; color: black;">
          <td colspan="5" style="padding: 15px 10px; border-bottom: 2px solid ${darkGreenBorder};">
            <h3 style="text-align: center; margin: 0 0 15px 0; font-size: 18px; letter-spacing: 1px;">${fixture.nombre.toUpperCase()}</h3>
            <table style="width: 100%; font-size: 13px; font-weight: bold; color: black; border: none;">
              <tr>
                <td style="text-align: left;">
                  NOMBRE DEL JUGADOR:<br>
                  <span style="font-weight: normal;">${user.nickname.toUpperCase()}</span>
                </td>
                <td style="text-align: right;">
                  CARGADO:<br>
                  <span style="font-weight: normal;">${dateArg} - ${timeArg}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Cabeceras L E V -->
        <tr style="background-color: ${greenBg}; color: black; font-size: 18px; font-weight: bold; text-align: center;">
          <td style="width: 10%; border: 1px solid ${darkGreenBorder}; padding: 5px;">L</td>
          <td style="width: 35%; border: 1px solid ${darkGreenBorder}; background-color: white;"></td>
          <td style="width: 10%; border: 1px solid ${darkGreenBorder}; padding: 5px;">E</td>
          <td style="width: 35%; border: 1px solid ${darkGreenBorder}; background-color: white;"></td>
          <td style="width: 10%; border: 1px solid ${darkGreenBorder}; padding: 5px;">V</td>
        </tr>
    `;
    
    detalles.forEach((d: any, index: number) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#eeeeee';
      
      const localName = d.match?.local?.nombre || 'Local';
      const visitName = d.match?.visitante?.nombre || 'Visitante';
      
      const isL = d.seleccion.includes('L') ? 'X' : '';
      const isE = d.seleccion.includes('E') ? 'X' : '';
      const isV = d.seleccion.includes('V') ? 'X' : '';

      matchesHtml += `
        <tr style="background-color: ${bgColor}; font-size: 15px; font-weight: 600; color: #333;">
          <!-- L -->
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isL}
          </td>
          <!-- Local Team -->
          <td style="border: 1px solid ${darkGreenBorder}; text-align: right; padding: 10px;">
            ${localName}
          </td>
          <!-- E -->
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isE}
          </td>
          <!-- Visitante Team -->
          <td style="border: 1px solid ${darkGreenBorder}; text-align: left; padding: 10px;">
            ${visitName}
          </td>
          <!-- V -->
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isV}
          </td>
        </tr>
      `;
    });
    matchesHtml += `</table>`;

    const mailOptions = {
      from: `"PRODE Liga Argentina" <${process.env.MAIL_USER}>`,
      to: user.mail,
      subject: `Comprobante de Jugada - ${fixture.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          ${matchesHtml}
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Comprobante enviado a: ${user.mail} a las ${timeArg}`);
    } catch (error) {
      console.error('Error enviando comprobante:', error);
    }
  }

  async sendPasswordResetEmail(user: any, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://10.3.213.6:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"PRODE Liga Argentina" <${process.env.MAIL_USER}>`,
      to: user.mail,
      subject: 'Recuperar Contraseña - PRODE Liga Argentina',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #74ACDF; text-align: center;">Recuperar Contraseña</h2>
          <p>Hola <strong>${user.nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>@${user.nickname}</strong>.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña. El link vence en <strong>30 minutos</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #74ACDF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
          </div>
          <p style="font-size: 0.85em; color: #555;">Si no solicitaste este cambio, podés ignorar este correo. Tu contraseña no cambiará.</p>
          <p style="font-size: 0.8em; color: #999;">Si el botón no funciona, copia y pega este link en tu navegador:</p>
          <p style="font-size: 0.8em; color: #74ACDF; word-break: break-all;">${resetLink}</p>
          <hr>
          <p style="font-size: 0.75em; color: #aaa; text-align: center;">Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Email de recuperación enviado a: ${user.mail}`);
  }
}
