const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function corrigirPremios() {
  try {
    console.log("🔧 Corrigindo prêmios com tipoCliente inválido...\n")

    // Buscar prêmios com problema
    const premiosComProblema = await prisma.premio.findMany({
      where: {
        OR: [{ tipoCliente: null }, { tipoCliente: { notIn: ["assinante", "nao_assinante", "ambos"] } }],
      },
    })

    console.log(`📊 Encontrados ${premiosComProblema.length} prêmios para corrigir`)

    for (const premio of premiosComProblema) {
      // Definir tipo baseado no título ou definir como 'ambos' por padrão
      let novoTipo = "ambos" // padrão

      const tituloLower = premio.titulo.toLowerCase()

      // Se contém palavras que indicam prêmios básicos, definir como não-assinante
      if (tituloLower.includes("10%") || tituloLower.includes("15%") || tituloLower.includes("brinde")) {
        novoTipo = "nao_assinante"
      }
      // Se contém palavras que indicam prêmios premium, definir como assinante
      else if (
        tituloLower.includes("30%") ||
        tituloLower.includes("50%") ||
        tituloLower.includes("grátis") ||
        tituloLower.includes("premium") ||
        tituloLower.includes("kit")
      ) {
        novoTipo = "assinante"
      }

      await prisma.premio.update({
        where: { id: premio.id },
        data: { tipoCliente: novoTipo },
      })

      console.log(`✅ Corrigido: "${premio.titulo}" -> ${novoTipo}`)
    }

    console.log("\n🎉 Correção concluída!")
  } catch (error) {
    console.error("❌ Erro ao corrigir prêmios:", error)
  } finally {
    await prisma.$disconnect()
  }
}

corrigirPremios()
