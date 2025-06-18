const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function debugPremios() {
  try {
    console.log("🔍 Verificando prêmios no banco de dados...\n")

    // Buscar todas as barbearias
    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
      },
    })

    for (const barbearia of barbearias) {
      console.log(`📍 Barbearia: ${barbearia.nome} (ID: ${barbearia.id})`)

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

      console.log(`   Total de prêmios: ${premios.length}`)

      // Agrupar por tipo
      const porTipo = {
        assinante: premios.filter((p) => p.tipoCliente === "assinante"),
        nao_assinante: premios.filter((p) => p.tipoCliente === "nao_assinante"),
        ambos: premios.filter((p) => p.tipoCliente === "ambos"),
        outros: premios.filter((p) => !["assinante", "nao_assinante", "ambos"].includes(p.tipoCliente)),
      }

      console.log(`   📊 Por tipo:`)
      console.log(`      Assinantes: ${porTipo.assinante.length}`)
      console.log(`      Não-assinantes: ${porTipo.nao_assinante.length}`)
      console.log(`      Ambos: ${porTipo.ambos.length}`)
      console.log(`      Outros/Null: ${porTipo.outros.length}`)

      // Mostrar detalhes dos prêmios
      premios.forEach((premio) => {
        console.log(
          `      - ${premio.titulo} | Tipo: ${premio.tipoCliente || "NULL"} | Ativo: ${premio.ativo} | Chance: ${premio.chance}%`,
        )
      })

      console.log("\n")
    }

    // Verificar se há prêmios com tipoCliente null
    const premiosComProblema = await prisma.premio.findMany({
      where: {
        OR: [{ tipoCliente: null }, { tipoCliente: { notIn: ["assinante", "nao_assinante", "ambos"] } }],
      },
    })

    if (premiosComProblema.length > 0) {
      console.log("⚠️  PRÊMIOS COM PROBLEMA ENCONTRADOS:")
      premiosComProblema.forEach((premio) => {
        console.log(`   - ID: ${premio.id} | Título: ${premio.titulo} | TipoCliente: ${premio.tipoCliente}`)
      })

      console.log("\n🔧 Para corrigir, execute o script de correção...")
    } else {
      console.log("✅ Todos os prêmios estão com tipoCliente correto!")
    }
  } catch (error) {
    console.error("❌ Erro ao verificar prêmios:", error)
  } finally {
    await prisma.$disconnect()
  }
}

debugPremios()
