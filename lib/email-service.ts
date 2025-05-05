"use server"

import nodemailer from "nodemailer"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface EmailPremioProps {
  destinatario: string
  nomeCliente: string
  nomeBarbearia: string
  tituloPremio: string
  descricaoPremio: string
  codigoPremio: string
  dataExpiracao: Date
  whatsapp: string
  mensagemMarketing: string
  logoUrl: string | null
}

export async function enviarEmailPremio({
  destinatario,
  nomeCliente,
  nomeBarbearia,
  tituloPremio,
  descricaoPremio,
  codigoPremio,
  dataExpiracao,
  whatsapp,
  mensagemMarketing,
  logoUrl,
}: EmailPremioProps) {
  try {
    // Configurar o transporte de email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Formatar a data de expiração
    const dataFormatada = format(dataExpiracao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    // Formatar o número do WhatsApp para link
    const whatsappFormatado = whatsapp.replace(/\D/g, "")
    const whatsappLink = `https://wa.me/${whatsappFormatado}?text=Olá! Vim resgatar meu prêmio: ${tituloPremio} (código: ${codigoPremio})`

    // Criar o conteúdo do email em HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu Prêmio na ${nomeBarbearia}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(to right, #333333, #666666);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .logo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
          background-color: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }
        .content {
          padding: 20px;
        }
        .premio {
          background-color: #f9f9f9;
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .premio-titulo {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .premio-descricao {
          color: #666;
          margin-bottom: 10px;
        }
        .premio-codigo {
          font-family: monospace;
          background-color: #eee;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 16px;
          letter-spacing: 1px;
        }
        .validade {
          font-size: 14px;
          color: #777;
          margin-top: 10px;
        }
        .cta-button {
          display: block;
          background-color: #25D366;
          color: white;
          text-decoration: none;
          text-align: center;
          padding: 12px 20px;
          border-radius: 6px;
          font-weight: bold;
          margin: 25px 0;
        }
        .marketing {
          font-style: italic;
          color: #666;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          border-top: 1px solid #eee;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            ${logoUrl ? `<img src="${logoUrl}" alt="${nomeBarbearia}" class="logo">` : "✂️"}
          </div>
          <h1>Parabéns, ${nomeCliente}!</h1>
          <p>Você ganhou um prêmio especial na ${nomeBarbearia}</p>
        </div>
        
        <div class="content">
          <p>Olá ${nomeCliente},</p>
          
          <p>Estamos muito felizes em informar que você ganhou um prêmio especial em nossa roleta de prêmios!</p>
          
          <div class="premio">
            <div class="premio-titulo">🏆 ${tituloPremio}</div>
            <div class="premio-descricao">${descricaoPremio}</div>
            <div class="premio-codigo">${codigoPremio}</div>
            <div class="validade">Válido até: ${dataFormatada}</div>
          </div>
          
          <p>Para resgatar seu prêmio, basta apresentar este código na ${nomeBarbearia} ou entrar em contato pelo WhatsApp:</p>
          
          <a href="${whatsappLink}" class="cta-button">Resgatar pelo WhatsApp</a>
          
          <div class="marketing">
            "${mensagemMarketing}"
          </div>
        </div>
        
        <div class="footer">
          <p>Este email foi enviado automaticamente pelo sistema de prêmios da ${nomeBarbearia}.</p>
          <p>Por favor, não responda a este email.</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Enviar o email
    await transporter.sendMail({
      from: `"${nomeBarbearia}" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: destinatario,
      subject: `🎁 Parabéns! Você ganhou um prêmio na ${nomeBarbearia}`,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw error
  }
}
