"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Adicionar novo prêmio
export async function adicionarPremio(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const codigo = formData.get("codigo") as string
    const chanceStr = formData.get("chance") as string
    const chance = Number.parseFloat(chanceStr)
    const barbeariaId = session.user.barbeariaId

    console.log("Adicionando prêmio:", { titulo, descricao, codigo, chance, barbeariaId })

    if (isNaN(chance)) {
      return { error: "A chance deve ser um número válido" }
    }

    if (chance <= 0 || chance > 100) {
      return { error: "A chance deve ser um número entre 0 e 100" }
    }

    // Verificar se a soma das chances não ultrapassa 100%
    const premiosExistentes = await prisma.premio.findMany({
      where: {
        barbeariaId,
        ativo: true, // Considerar apenas prêmios ativos
      },
      select: {
        id: true,
        chance: true,
      },
    })

    console.log("Prêmios existentes:", premiosExistentes)

    const somaChancesExistentes = premiosExistentes.reduce((soma, premio) => soma + premio.chance, 0)
    console.log("Soma das chances existentes:", somaChancesExistentes)
    console.log("Nova chance:", chance)
    console.log("Soma total:", somaChancesExistentes + chance)

    if (somaChancesExistentes + chance > 100) {
      return {
        error: `A soma das chances não pode ultrapassar 100%. Soma atual: ${somaChancesExistentes.toFixed(2)}%, disponível: ${(100 - somaChancesExistentes).toFixed(2)}%`,
      }
    }

    // Criar novo prêmio
    const novoPremio = await prisma.premio.create({
      data: {
        titulo,
        descricao,
        codigo,
        chance,
        barbeariaId,
      },
    })

    console.log("Prêmio criado com sucesso:", novoPremio)

    revalidatePath("/admin/premios")
    return { success: true }
  } catch (error) {
    console.error("Erro ao adicionar prêmio:", error)
    return { error: "Erro ao adicionar prêmio" }
  }
}

// Atualizar prêmio existente
export async function atualizarPremio(premioId: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const titulo = formData.get("titulo") as string
    const descricao = formData.get("descricao") as string
    const codigo = formData.get("codigo") as string
    const chanceStr = formData.get("chance") as string
    const chance = Number.parseFloat(chanceStr)
    const ativo = formData.get("ativo") === "true"
    const barbeariaId = session.user.barbeariaId

    console.log("Atualizando prêmio:", { premioId, titulo, descricao, codigo, chance, ativo, barbeariaId })

    if (isNaN(chance)) {
      return { error: "A chance deve ser um número válido" }
    }

    if (chance <= 0 || chance > 100) {
      return { error: "A chance deve ser um número entre 0 e 100" }
    }

    // Verificar se o prêmio pertence à barbearia
    const premio = await prisma.premio.findFirst({
      where: {
        id: premioId,
        barbeariaId,
      },
    })

    if (!premio) {
      return { error: "Prêmio não encontrado" }
    }

    // Verificar se a soma das chances não ultrapassa 100%
    const premiosExistentes = await prisma.premio.findMany({
      where: {
        barbeariaId,
        id: {
          not: premioId,
        },
        ativo: true, // Considerar apenas prêmios ativos
      },
      select: {
        id: true,
        chance: true,
      },
    })

    console.log("Prêmios existentes (excluindo o atual):", premiosExistentes)

    const somaChancesExistentes = premiosExistentes.reduce((soma, p) => soma + p.chance, 0)
    console.log("Soma das chances existentes:", somaChancesExistentes)
    console.log("Nova chance:", chance)
    console.log("Soma total:", somaChancesExistentes + chance)

    if (somaChancesExistentes + chance > 100) {
      return {
        error: `A soma das chances não pode ultrapassar 100%. Soma atual: ${somaChancesExistentes.toFixed(2)}%, disponível: ${(100 - somaChancesExistentes).toFixed(2)}%`,
      }
    }

    // Atualizar prêmio
    const premioAtualizado = await prisma.premio.update({
      where: {
        id: premioId,
      },
      data: {
        titulo,
        descricao,
        codigo,
        chance,
        ativo,
      },
    })

    console.log("Prêmio atualizado com sucesso:", premioAtualizado)

    revalidatePath("/admin/premios")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar prêmio:", error)
    return { error: "Erro ao atualizar prêmio" }
  }
}

// Excluir prêmio
export async function excluirPremio(premioId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

    // Verificar se o prêmio pertence à barbearia
    const premio = await prisma.premio.findFirst({
      where: {
        id: premioId,
        barbeariaId,
      },
    })

    if (!premio) {
      return { error: "Prêmio não encontrado" }
    }

    // Excluir prêmio
    await prisma.premio.delete({
      where: {
        id: premioId,
      },
    })

    revalidatePath("/admin/premios")
    return { success: true }
  } catch (error) {
    console.error("Erro ao excluir prêmio:", error)
    return { error: "Erro ao excluir prêmio" }
  }
}

// Resetar prêmios existentes
export async function resetarPremios() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return { error: "Não autorizado" }
    }

    const barbeariaId = session.user.barbeariaId

    // Excluir todos os prêmios da barbearia
    await prisma.premio.deleteMany({
      where: {
        barbeariaId,
      },
    })

    revalidatePath("/admin/premios")
    return { success: true }
  } catch (error) {
    console.error("Erro ao resetar prêmios:", error)
    return { error: "Erro ao resetar prêmios" }
  }
}
