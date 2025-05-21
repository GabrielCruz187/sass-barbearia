import { z } from "zod"

// Função para verificar se um email existe usando uma combinação de técnicas
export async function isEmailValid(email: string): Promise<boolean> {
  try {
    // 1. Validação básica de formato com Zod
    const emailSchema = z.string().email()
    const formatValid = emailSchema.safeParse(email).success

    if (!formatValid) return false

    // 2. Verificar domínio MX (Mail Exchange) records
    // Esta é uma verificação mais robusta que confirma se o domínio do email
    // tem servidores de email configurados
    const domain = email.split("@")[1]

    try {
      // Usando um serviço de API para verificar registros MX
      // Você pode substituir por uma API real de verificação de email
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
      const data = await response.json()

      // Se não houver registros MX, o email provavelmente não existe
      if (!data.Answer || data.Answer.length === 0) {
        return false
      }
    } catch (error) {
      console.error("Erro ao verificar registros MX:", error)
      // Em caso de erro na verificação, vamos continuar com outras verificações
    }

    // 3. Verificar domínios descartáveis comuns
    const disposableDomains = [
      "tempmail.com",
      "throwawaymail.com",
      "mailinator.com",
      "guerrillamail.com",
      "yopmail.com",
      "10minutemail.com",
      "temp-mail.org",
      "fakeinbox.com",
      "sharklasers.com",
      "trashmail.com",
      "getairmail.com",
      "mailnesia.com",
    ]

    if (disposableDomains.some((d) => domain.includes(d))) {
      return false
    }

    // 4. Verificar sintaxe específica
    // Emails não devem ter caracteres repetidos excessivos
    if (/(.)\1{5,}/.test(email)) {
      return false
    }

    // Se passou por todas as verificações, consideramos o email válido
    return true
  } catch (error) {
    console.error("Erro ao validar email:", error)
    // Em caso de erro, retornamos false para ser conservador
    return false
  }
}
