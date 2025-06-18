const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function ajustarChancesPara100() {
  try {
    console.log("🎯 Ajustando chances para 100% em cada roleta...\n")

    // Buscar todas as barbearias
    const barbearias = await prisma.barbearia.findMany({
      select: {
        id: true,
        nome: true,
      },
    })

    for (const barbearia of barbearias) {
      console.log(`📍 Processando: ${barbearia.nome}`)

      // Buscar prêmios ativos da barbearia
      const premiosAssinantes = await prisma.premio.findMany({
        where: {
          barbeariaId: barbearia.id,
          tipoCliente: "assinante",
          ativo: true,
        },
        select: {
          id: true,
          titulo: true,
          chance: true,
        },
      })

      const premiosNaoAssinantes = await prisma.premio.findMany({
        where: {
          barbeariaId: barbearia.id,
          tipoCliente: "nao_assinante",
          ativo: true,
        },
        select: {
          id: true,
          titulo: true,
          chance: true,
        },
      })

      // Ajustar chances para assinantes
      if (premiosAssinantes.length > 0) {
        const somaAtualAssinantes = premiosAssinantes.reduce((sum, p) => sum + p.chance, 0)
        console.log(`   🔄 Assinantes: ${premiosAssinantes.length} prêmios, soma atual: ${somaAtualAssinantes}%`)

        if (somaAtualAssinantes !== 100) {
          const fatorAjuste = 100 / somaAtualAssinantes

          for (let i = 0; i < premiosAssinantes.length; i++) {
            const premio = premiosAssinantes[i]
            let novaChance = premio.chance * fatorAjuste

            // Se for o último prêmio, ajustar para garantir que a soma seja exatamente 100
            if (i === premiosAssinantes.length - 1) {
              const somaAteAgora = premiosAssinantes
                .slice(0, i)
                .reduce((sum, p, idx) => sum + p.chance * fatorAjuste, 0)
              novaChance = 100 - somaAteAgora
            }

            // Arredondar para 1 casa decimal
            novaChance = Math.round(novaChance * 10) / 10

            await prisma.premio.update({
              where: { id: premio.id },
              data: { chance: novaChance },
            })

            console.log(`      ✅ "${premio.titulo}": ${premio.chance}% → ${novaChance}%`)
          }
        }
      }

      // Ajustar chances para não-assinantes
      if (premiosNaoAssinantes.length > 0) {
        const somaAtualNaoAssinantes = premiosNaoAssinantes.reduce((sum, p) => sum + p.chance, 0)
        console.log(
          `   🔄 Não-assinantes: ${premiosNaoAssinantes.length} prêmios, soma atual: ${somaAtualNaoAssinantes}%`,
        )

        if (somaAtualNaoAssinantes !== 100) {
          const fatorAjuste = 100 / somaAtualNaoAssinantes

          for (let i = 0; i < premiosNaoAssinantes.length; i++) {
            const premio = premiosNaoAssinantes[i]
            let novaChance = premio.chance * fatorAjuste

            // Se for o último prêmio, ajustar para garantir que a soma seja exatamente 100
            if (i === premiosNaoAssinantes.length - 1) {
              const somaAteAgora = premiosNaoAssinantes
                .slice(0, i)
                .reduce((sum, p, idx) => sum + p.chance * fatorAjuste, 0)
              novaChance = 100 - somaAteAgora
            }

            // Arredondar para 1 casa decimal
            novaChance = Math.round(novaChance * 10) / 10

            await prisma.premio.update({
              where: { id: premio.id },
              data: { chance: novaChance },
            })

            console.log(`      ✅ "${premio.titulo}": ${premio.chance}% → ${novaChance}%`)
          }
        }
      }

      console.log("")
    }

    console.log("🎉 Ajuste concluído! Verificando resultado final...\n")

    // Verificar resultado final
    for (const barbearia of barbearias) {
      const premiosAssinantes = await prisma.premio.findMany({
        where: {
          barbeariaId: barbearia.id,
          tipoCliente: "assinante",
          ativo: true,
        },
        select: { chance: true },
      })

      const premiosNaoAssinantes = await prisma.premio.findMany({
        where: {
          barbeariaId: barbearia.id,
          tipoCliente: "nao_assinante",
          ativo: true,
        },
        select: { chance: true },
      })

      const somaAssinantes = premiosAssinantes.reduce((sum, p) => sum + p.chance, 0)
      const somaNaoAssinantes = premiosNaoAssinantes.reduce((sum, p) => sum + p.chance, 0)

      console.log(`📍 ${barbearia.nome}:`)
      console.log(`   🎯 Roleta Assinantes: ${Math.round(somaAssinantes * 10) / 10}%`)
      console.log(`   🎯 Roleta Não-assinantes: ${Math.round(somaNaoAssinantes * 10) / 10}%`)

      if (Math.abs(somaAssinantes - 100) < 0.1) {
        console.log(`   ✅ Roleta assinantes OK!`)
      } else {
        console.log(`   ❌ Roleta assinantes com problema: ${somaAssinantes}%`)
      }

      if (Math.abs(somaNaoAssinantes - 100) < 0.1) {
        console.log(`   ✅ Roleta não-assinantes OK!`)
      } else {
        console.log(`   ❌ Roleta não-assinantes com problema: ${somaNaoAssinantes}%`)
      }

      console.log("")
    }
  } catch (error) {
    console.error("❌ Erro ao ajustar chances:", error)
  } finally {
    await prisma.$disconnect()
  }
}

ajustarChancesPara100()
