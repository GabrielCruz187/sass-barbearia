const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function debugPremiosSimples() {
  try {
    console.log("🔍 Verificando prêmios após correção...\n")

    // Buscar todas as barbearias
    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
      },
    })

    for (const barbearia of barbearias) {
      console.log(`📍 Barbearia: ${barbearia.nome}`)

      // Buscar prêmios da barbearia
      const premios = await prisma.premio.findMany({
        where: {
          barbeariaId: barbearia.id,
        },
        select: {
          id: true,
          titulo: true,
          tipoCliente: true,
          ativo: true,
          chance: true,
        },
      })

      // Agrupar por tipo
      const assinantes = premios.filter((p) => p.tipoCliente === "assinante" && p.ativo)
      const naoAssinantes = premios.filter((p) => p.tipoCliente === "nao_assinante" && p.ativo)
      const ambos = premios.filter((p) => p.tipoCliente === "ambos" && p.ativo)

      console.log(`   📊 Prêmios ativos:`)
      console.log(`      Assinantes: ${assinantes.length}`)
      console.log(`      Não-assinantes: ${naoAssinantes.length}`)
      console.log(`      Ambos: ${ambos.length}`)

      // Calcular soma das chances
      const somaAssinantes = assinantes.reduce((sum, p) => sum + p.chance, 0)
      const somaNaoAssinantes = naoAssinantes.reduce((sum, p) => sum + p.chance, 0)

      console.log(`   🎯 Soma das chances:`)
      console.log(`      Assinantes: ${somaAssinantes}%`)
      console.log(`      Não-assinantes: ${somaNaoAssinantes}%`)

      if (somaNaoAssinantes > 100) {
        console.log(`   ⚠️  ATENÇÃO: Soma das chances para não-assinantes excede 100%!`)
      }

      if (somaAssinantes > 100) {
        console.log(`   ⚠️  ATENÇÃO: Soma das chances para assinantes excede 100%!`)
      }

      console.log("\n")
    }
  } catch (error) {
    console.error("❌ Erro ao verificar prêmios:", error)
  } finally {
    await prisma.$disconnect()
  }
}

debugPremiosSimples()
