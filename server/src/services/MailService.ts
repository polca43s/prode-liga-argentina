import { google } from 'googleapis';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const FROM_NAME = 'PRODE Liga Argentina';

let oAuth2Client: any = null;
let gmail: any = null;

function getGmailClient() {
  if (!GMAIL_USER || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    console.warn('Faltan credenciales de Gmail API');
    return null;
  }

  if (!oAuth2Client) {
    oAuth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN
    });
  }

  if (!gmail) {
    gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  }

  return gmail;
}

function createMimeMessage(to: string, subject: string, html: string) {
  const encodedSubject = Buffer.from(subject, 'utf-8').toString('base64');
  const message = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    html
  ].join('\r\n');
  
  return Buffer.from(message, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmail = getGmailClient();
  if (!gmail) {
    console.warn('Gmail client no disponible, saltando envío de email');
    return;
  }

  try {
    const encodedMessage = createMimeMessage(to, subject, html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log(`Email enviado a: ${to} - Asunto: ${subject}`);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

export class MailService {
  async sendWelcomeEmail(user: any) {
    const html = `
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
    `;

    await sendEmail(user.mail, '¡Bienvenido al PRODE Liga Argentina!', html);
  }

  async sendPredictionConfirmation(user: any, fixture: any, detalles: any[]) {
    const dateArg = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "long" });
    const timeArg = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", timeStyle: "medium" });

    const greenBg = '#198725';
    const darkGreenBorder = '#115c19';
    
    let matchesHtml = `
      <table style="width: 100%; max-width: 650px; margin: auto; border-collapse: collapse; border: 2px solid ${darkGreenBorder}; font-family: Arial, sans-serif;">
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
      const localEscudo = d.match?.local?.escudo || '';
      const visitEscudo = d.match?.visitante?.escudo || '';
      
      const isL = d.seleccion.includes('L') ? 'X' : '';
      const isE = d.seleccion.includes('E') ? 'X' : '';
      const isV = d.seleccion.includes('V') ? 'X' : '';

      const escudoHtml = (escudo: string) => escudo ? `<img src="${escudo}" style="height: 25px; width: 25px; object-fit: contain; vertical-align: middle; margin-left: 8px;">` : '';

      matchesHtml += `
        <tr style="background-color: ${bgColor}; font-size: 15px; font-weight: 600; color: #333;">
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isL}
          </td>
          <td style="border: 1px solid ${darkGreenBorder}; text-align: right; padding: 10px;">
            ${localName}${escudoHtml(localEscudo)}
          </td>
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isE}
          </td>
          <td style="border: 1px solid ${darkGreenBorder}; text-align: left; padding: 10px;">
            ${escudoHtml(visitEscudo)} ${visitName}
          </td>
          <td style="background-color: ${greenBg}; border: 1px solid ${darkGreenBorder}; text-align: center; font-weight: 900; font-size: 18px; color: black;">
            ${isV}
          </td>
        </tr>
      `;
    });
    matchesHtml += `</table>`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        ${matchesHtml}
      </div>
    `;

    await sendEmail(user.mail, `Comprobante de Jugada - ${fixture.nombre}`, html);
  }

  async sendNewFixtureNotification(user: any, fixtureName: string, tournamentName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #74ACDF; text-align: center;">Nueva Jugada Disponible</h2>
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>Tienes una nueva jugada por llevar adelante: <strong>${fixtureName}</strong> de tu <strong>${tournamentName}</strong></p>
        <p style="margin-top: 30px;">
          <a href="https://www.prode-alberti.uk" target="_blank" style="background-color: #74ACDF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Ir a la app</a>
        </p>
        <hr>
        <p style="font-size: 0.75em; color: #aaa; text-align: center;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `;

    await sendEmail(user.mail, 'Nueva Jugada', html);
  }

  async sendPasswordResetEmail(user: any, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://polca43s.github.io/prode-liga-argentina';
    const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;

    const html = `
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
    `;

    await sendEmail(user.mail, 'Recuperar Contraseña - PRODE Liga Argentina', html);
  }
}