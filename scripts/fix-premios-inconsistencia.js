const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function corrigirInconsistencia() {
  try {
    console.log("🔧 Corrigindo inconsistência nos tipos de cliente...\n")

    // Buscar todos os prêmios
    const todosPremios = await prisma.premio.findMany({
      select: {
        id: true,
        titulo: true,
        tipoCliente: true,
      },
    })

    console.log(`📊 Total de prêmios encontrados: ${todosPremios.length}`)

    // Agrupar por tipo atual
    const porTipo = {}
    todosPremios.forEach((premio) => {
      const tipo = premio.tipoCliente || "NULL"
      if (!porTipo[tipo]) porTipo[tipo] = []
      porTipo[tipo].push(premio)
    })

    console.log("\n📋 Tipos encontrados:")
    Object.keys(porTipo).forEach((tipo) => {
      console.log(`   ${tipo}: ${porTipo[tipo].length} prêmios`)
    })

    // Corrigir inconsistências
    let corrigidos = 0

    // Corrigir "nao-assinante" para "nao_assinante"
    if (porTipo["nao-assinante"]) {
      console.log(`\n🔄 Corrigindo ${porTipo["nao-assinante"].length} prêmios de "nao-assinante" para "nao_assinante"`)

      for (const premio of porTipo["nao-assinante"]) {
        await prisma.premio.update({
          where: { id: premio.id },
          data: { tipoCliente: "nao_assinante" },
        })
        console.log(`   ✅ ${premio.titulo}`)
        corrigidos++
      }
    }

    // Corrigir outros tipos inconsistentes
    const tiposValidos = ["assinante", "nao_assinante", "ambos"]

    for (const [tipo, premios] of Object.entries(porTipo)) {
      if (!tiposValidos.includes(tipo) && tipo !== "NULL") {
        console.log(`\n🔄 Corrigindo ${premios.length} prêmios do tipo "${tipo}"`)

        for (const premio of premios) {
          // Determinar o tipo correto baseado no título
          let novoTipo = "nao_assinante" // padrão

          const tituloLower = premio.titulo.toLowerCase()

          if (
            tituloLower.includes("30%") ||
            tituloLower.includes("40%") ||
            tituloLower.includes("50%") ||
            tituloLower.includes("grátis") ||
            tituloLower.includes("premium") ||
            tituloLower.includes("hidratação")
          ) {
            novoTipo = "assinante"
          }

          await prisma.premio.update({
            where: { id: premio.id },
            data: { tipoCliente: novoTipo },
          })

          console.log(`   ✅ "${premio.titulo}" -> ${novoTipo}`)
          corrigidos++
        }
      }
    }

    console.log(`\n🎉 Correção concluída! ${corrigidos} prêmios corrigidos.`)

    // Verificar resultado final
    console.log("\n📊 Verificando resultado final...")
    const premiosFinais = await prisma.premio.findMany({
      select: {
        tipoCliente: true,
      },
    })

    const contagemFinal = {}
    premiosFinais.forEach((premio) => {
      const tipo = premio.tipoCliente || "NULL"
      contagemFinal[tipo] = (contagemFinal[tipo] || 0) + 1
    })

    console.log("Resultado final:")
    Object.entries(contagemFinal).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} prêmios`)
    })
  } catch (error) {
    console.error("❌ Erro ao corrigir inconsistência:", error)
  } finally {
    await prisma.$disconnect()
  }
}

corrigirInconsistencia()
