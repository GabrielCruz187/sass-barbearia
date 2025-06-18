"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { addDays } from "date-fns"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"

// Buscar prêmios disponíveis da barbearia baseado no tipo de cliente
export async function buscarPremiosBarbearia() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

    // Buscar informações do usuário para saber se é assinante
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { assinante: true },
    })

    if (!usuario) {
      return { error: "Usuário não encontrado" }
    }

    // Buscar prêmios baseado no tipo de cliente
    const tipoCliente = usuario.assinante ? "assinante" : "nao_assinante"

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
        OR: [{ tipoCliente: tipoCliente }, { tipoCliente: "ambos" }],
      },
      select: {
        id: true,
        titulo: true,
      },
    })

    // Adicionar emojis aos prêmios que não têm
    const premiosComEmoji = premios.map((premio) => {
      // Verificar se o título já começa com um emoji
      if (/^\p{Emoji}/u.test(premio.titulo)) {
        return premio
      }

      // Adicionar um emoji baseado no título
      let emoji = "🎁" // Emoji padrão

      const tituloLower = premio.titulo.toLowerCase()
      if (tituloLower.includes("corte")) emoji = "✂️"
      else if (tituloLower.includes("barba")) emoji = "💈"
      else if (tituloLower.includes("desconto")) emoji = "💰"
      else if (tituloLower.includes("grátis") || tituloLower.includes("gratis")) emoji = "🏆"
      else if (tituloLower.includes("produto") || tituloLower.includes("kit")) emoji = "🧴"

      return {
        ...premio,
        titulo: `${emoji} ${premio.titulo}`,
      }
    })

    return { success: true, premios: premiosComEmoji, tipoCliente }
  } catch (error) {
    console.error("Erro ao buscar prêmios:", error)
    return { error: "Erro ao buscar prêmios" }
  }
}

// Verificar se o usuário já tem um jogo ativo sem realizar um novo jogo
export async function verificarJogoAtivo() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { error: "Não autorizado" }
    }

    const usuarioId = session.user.id
    const barbeariaId = session.user.barbeariaId

    // Buscar informações do usuário para saber se é assinante
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { assinante: true },
    })

    if (!usuario) {
      return { error: "Usuário não encontrado" }
    }

    // Verificar se o usuário já jogou no mês atual
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)

    const jogoNoMesAtual = await prisma.jogo.findFirst({
      where: {
        usuarioId,
        barbeariaId,
        createdAt: {
          gte: primeiroDiaMes,
        },
      },
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
            logoUrl: true,
          },
        },
      },
    })

    if (jogoNoMesAtual) {
      console.log("Usuário já jogou neste mês:", jogoNoMesAtual.id)
      return {
        jogoExistente: {
          id: jogoNoMesAtual.id,
          dataExpiracao: jogoNoMesAtual.dataExpiracao,
          premio: {
            id: jogoNoMesAtual.premio.id,
            titulo: jogoNoMesAtual.premio.titulo,
            descricao: jogoNoMesAtual.premio.descricao,
            codigo: jogoNoMesAtual.premio.codigo,
          },
          barbearia: {
            nome: jogoNoMesAtual.barbearia.nome,
            whatsapp: jogoNoMesAtual.barbearia.whatsapp,
            mensagemMarketing: jogoNoMesAtual.barbearia.mensagemMarketing,
            logoUrl: jogoNoMesAtual.barbearia.logoUrl || null,
          },
        },
      }
    }

    // Verificar se há prêmios disponíveis para o tipo de cliente
    const tipoCliente = usuario.assinante ? "assinante" : "nao_assinante"

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
        OR: [{ tipoCliente: tipoCliente }, { tipoCliente: "ambos" }],
      },
    })

    if (premios.length === 0) {
      return { semPremios: true }
    }

    return { podeJogar: true, tipoCliente }
  } catch (error) {
    console.error("Erro ao verificar jogo ativo:", error)
    return { error: "Erro ao verificar jogo ativo" }
  }
}

// Enviar email com o prêmio
async function enviarEmailPremio(email: string, premio: any, barbearia: any, dataExpiracao: Date) {
  try {
    // Configurar o transporter do nodemailer (use suas próprias credenciais)
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // Se não tiver credenciais de email configuradas, retornar falso
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.log("Credenciais de email não configuradas")
      return false
    }

    // Formatar a data de expiração
    const dataFormatada = dataExpiracao.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    // Criar o conteúdo do email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background: linear-gradient(to right, ${barbearia.corPrimaria || "#333333"}, ${barbearia.corSecundaria || "#666666"}); padding: 20px; border-radius: 5px 5px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0;">🎉 Parabéns! Você ganhou um prêmio!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Olá!</p>
          <p>Você acaba de ganhar um prêmio especial na <strong>${barbearia.nome}</strong>:</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #4CAF50;">${premio.titulo}</h2>
            <p>${premio.descricao}</p>
            <p style="font-family: monospace; background-color: #e0e0e0; padding: 10px; display: inline-block;">Código: ${premio.codigo}</p>
          </div>
          
          <p><strong>Válido até:</strong> ${dataFormatada}</p>
          
          <p>${barbearia.mensagemMarketing || "Venha nos visitar e aproveite seu prêmio especial!"}</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://wa.me/${barbearia.whatsapp.replace(/\D/g, "")}" style="background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              💬 Falar pelo WhatsApp
            </a>
          </div>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    `

    // Enviar o email
    await transporter.sendMail({
      from: `"${barbearia.nome}" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: `🎁 Seu prêmio especial da ${barbearia.nome}!`,
      html: htmlContent,
    })

    return true
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return false
  }
}

// Realizar um jogo/sorteio
export async function realizarJogo() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { error: "Não autorizado" }
    }

    const usuarioId = session.user.id
    const barbeariaId = session.user.barbeariaId
    const userEmail = session.user.email

    // Buscar informações do usuário para saber se é assinante
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { assinante: true },
    })

    if (!usuario) {
      return { error: "Usuário não encontrado" }
    }

    // Verificar se o usuário já jogou no mês atual
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)

    const jogoNoMesAtual = await prisma.jogo.findFirst({
      where: {
        usuarioId,
        barbeariaId,
        createdAt: {
          gte: primeiroDiaMes,
        },
      },
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
            logoUrl: true,
            corPrimaria: true,
            corSecundaria: true,
          },
        },
      },
    })

    if (jogoNoMesAtual) {
      console.log("Usuário já jogou neste mês:", jogoNoMesAtual.id)
      return {
        error: "Você já jogou neste mês",
        jogoExistente: {
          id: jogoNoMesAtual.id,
          dataExpiracao: jogoNoMesAtual.dataExpiracao,
          premio: {
            id: jogoNoMesAtual.premio.id,
            titulo: jogoNoMesAtual.premio.titulo,
            descricao: jogoNoMesAtual.premio.descricao,
            codigo: jogoNoMesAtual.premio.codigo,
          },
          barbearia: {
            nome: jogoNoMesAtual.barbearia.nome,
            whatsapp: jogoNoMesAtual.barbearia.whatsapp,
            mensagemMarketing: jogoNoMesAtual.barbearia.mensagemMarketing,
            logoUrl: jogoNoMesAtual.barbearia.logoUrl,
          },
        },
      }
    }

    // Obter configurações da barbearia
    const configuracao = await prisma.configuracao.findUnique({
      where: {
        barbeariaId,
      },
    })

    const diasValidade = configuracao?.diasValidade || 30

    // Obter prêmios ativos da barbearia baseado no tipo de cliente
    const tipoCliente = usuario.assinante ? "assinante" : "nao_assinante"

    const premios = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true,
        OR: [{ tipoCliente: tipoCliente }, { tipoCliente: "ambos" }],
      },
    })

    if (premios.length === 0) {
      return { semPremios: true, error: "Não há prêmios disponíveis para esta barbearia" }
    }

    // Realizar sorteio baseado nas chances
    const random = Math.random() * 100
    let cumulativeChance = 0
    let premioSorteado = null

    for (const premio of premios) {
      cumulativeChance += premio.chance
      if (random <= cumulativeChance) {
        premioSorteado = premio
        break
      }
    }

    // Se por algum motivo não sorteou nenhum prêmio, pega o primeiro
    if (!premioSorteado) {
      premioSorteado = premios[0]
    }

    // Registrar o jogo
    const dataExpiracao = addDays(new Date(), diasValidade)

    const novoJogo = await prisma.jogo.create({
      data: {
        usuarioId,
        premioId: premioSorteado.id,
        barbeariaId,
        dataExpiracao,
      },
      include: {
        premio: true,
        barbearia: {
          select: {
            nome: true,
            whatsapp: true,
            mensagemMarketing: true,
            logoUrl: true,
            corPrimaria: true,
            corSecundaria: true,
          },
        },
      },
    })

    // Enviar email com o prêmio
    let emailEnviado = false
    if (userEmail) {
      emailEnviado = await enviarEmailPremio(userEmail, novoJogo.premio, novoJogo.barbearia, dataExpiracao)
    }

    revalidatePath("/cliente/jogo")

    return {
      success: true,
      emailEnviado,
      tipoCliente,
      jogo: {
        id: novoJogo.id,
        premio: {
          id: novoJogo.premio.id,
          titulo: novoJogo.premio.titulo,
          descricao: novoJogo.premio.descricao,
          codigo: novoJogo.premio.codigo,
        },
        barbearia: {
          nome: novoJogo.barbearia.nome,
          whatsapp: novoJogo.barbearia.whatsapp,
          mensagemMarketing: novoJogo.barbearia.mensagemMarketing,
          logoUrl: novoJogo.barbearia.logoUrl || null,
        },
        dataExpiracao: novoJogo.dataExpiracao,
      },
    }
  } catch (error) {
    console.error("Erro ao realizar jogo:", error)
    return { error: "Erro ao realizar jogo" }
  }
}

// Resgatar prêmio (para admin)
export async function resgatarPremio(jogoId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

    // Verificar se o jogo pertence à barbearia
    const jogo = await prisma.jogo.findFirst({
      where: {
        id: jogoId,
        barbeariaId,
      },
    })

    if (!jogo) {
      return { error: "Jogo não encontrado" }
    }

    // Verificar se o prêmio já foi resgatado
    if (jogo.resgatado) {
      return { error: "Este prêmio já foi resgatado" }
    }

    // Verificar se o prêmio está expirado
    if (new Date() > jogo.dataExpiracao) {
      return { error: "Este prêmio está expirado" }
    }

    // Marcar como resgatado
    await prisma.jogo.update({
      where: {
        id: jogoId,
      },
      data: {
        resgatado: true,
        dataResgate: new Date(),
      },
    })

    revalidatePath("/admin/clientes")
    return { success: true }
  } catch (error) {
    console.error("Erro ao resgatar prêmio:", error)
    return { error: "Erro ao resgatar prêmio" }
  }
}


