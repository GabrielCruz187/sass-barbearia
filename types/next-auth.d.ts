declare module "next-auth" {
    interface Session {
      user: {
        id: string
        name: string
        email: string
        role: string
        barbeariaId: string
      }
    }
  
    interface User {
      id: string
      name: string
      email: string
      role: string
      barbeariaId: string
    }
  }
  
  declare module "next-auth/jwt" {
    interface JWT {
      id: string
      role: string
      barbeariaId: string
    }
  }
  