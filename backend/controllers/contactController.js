const nodemailer = require('nodemailer');
const catchAsync = require('../utils/catchAsync');

exports.sendContact = catchAsync(async (req, res) => {
    const { nom, email, telephone, sujet, message } = req.body;
    if (!nom || !email || !message) {
        return res.status(400).json({ message: 'Nom, email et message sont requis.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"CB Immobilier" <${process.env.GMAIL_USER}>`,
        to: 'chouaibbimmobilier@gmail.com',
        replyTo: email,
        subject: `[CB Immobilier] ${sujet || 'Nouveau message de contact'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(90deg, #0F3C69, #088F6D); padding: 24px 32px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0; font-size: 20px;">Nouveau message de contact</h2>
                </div>
                <div style="background: #f7f7f7; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #6a6a6a; width: 130px; font-size: 14px;">Nom</td><td style="padding: 8px 0; font-weight: 600; color: #222;">${nom}</td></tr>
                        <tr><td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #222;"><a href="mailto:${email}" style="color: #0F3C69;">${email}</a></td></tr>
                        ${telephone ? `<tr><td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; color: #222;">${telephone}</td></tr>` : ''}
                        ${sujet ? `<tr><td style="padding: 8px 0; color: #6a6a6a; font-size: 14px;">Sujet</td><td style="padding: 8px 0; font-weight: 600; color: #222;">${sujet}</td></tr>` : ''}
                    </table>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                    <p style="color: #6a6a6a; font-size: 13px; margin: 0 0 8px;">Message :</p>
                    <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #ddd; color: #222; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                    <p style="color: #929292; font-size: 12px; margin: 20px 0 0;">Message reçu via le site web de CB Immobilier</p>
                </div>
            </div>
        `,
    });

    res.json({ message: 'Message envoyé avec succès.' });
});
