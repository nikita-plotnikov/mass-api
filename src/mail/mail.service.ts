import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(email: string, token: string) {
    try {
      const url = `http://localhost:3000/users/confirm/${token}`;
      console.log('url', url);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Добро пожаловать в MASS',
        template: './confirmation',
        context: {
          email: email,
          url,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }

  async sendForgotPasswordMail(email: string, token: string) {
    try {
      const url = `http://localhost:3000/reset-password/${token}`;
      console.log('url', url);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Сброс пароля в MASS',
        template: './forgotPassword',
        context: {
          email: email,
          url,
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
}
