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

  async sendPredictionConfirmation(user: any, fixtureName: string, matches: any[]) {
    // Implementaremos esto cuando lleguemos al punto 7
  }
}
