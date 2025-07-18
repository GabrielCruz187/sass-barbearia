import prisma from "@/lib/prisma"

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
}

export async function generateUniqueSlug(nome: string, barbeariaId: string): Promise<string> {
  const baseSlug = createSlug(nome)
  let slug = baseSlug
  let counter = 1

  // Verifica se o slug já existe
  while (true) {
    const existingBarbearia = await prisma.barbearia.findFirst({
      where: {
        slug: slug,
        id: {
          not: barbeariaId, // Exclui a própria barbearia
        },
      },
    })

    if (!existingBarbearia) {
      break
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

