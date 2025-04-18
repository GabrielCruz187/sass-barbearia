"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { verificarBancoDados, listarBarbearias, criarBarbeariaTeste } from "@/lib/actions/barbearia-actions"

export default function DiagnosticoPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [barbearias, setBarbearias] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState({
    db: false,
    list: false,
    create: false,
  })

  const handleCheckDb = async () => {
    setLoading((prev) => ({ ...prev, db: true }))
    try {
      const result = await verificarBancoDados()
      setDbStatus(result)
    } catch (error) {
      setDbStatus({ success: false, error: String(error) })
    } finally {
      setLoading((prev) => ({ ...prev, db: false }))
    }
  }

  const handleListBarbearias = async () => {
    setLoading((prev) => ({ ...prev, list: true }))
    try {
      const result = await listarBarbearias()
      setBarbearias(result)
    } catch (error) {
      setBarbearias({ success: false, error: String(error) })
    } finally {
      setLoading((prev) => ({ ...prev, list: false }))
    }
  }

  const handleCreateTest = async () => {
    setLoading((prev) => ({ ...prev, create: true }))
    try {
      const result = await criarBarbeariaTeste()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: String(error) })
    } finally {
      setLoading((prev) => ({ ...prev, create: false }))
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico do Sistema</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verificar Banco de Dados</CardTitle>
            <CardDescription>Testa a conexão com o banco de dados</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus && (
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-sm">{JSON.stringify(dbStatus, null, 2)}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckDb} disabled={loading.db}>
              {loading.db ? "Verificando..." : "Verificar Conexão"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listar Barbearias</CardTitle>
            <CardDescription>Lista todas as barbearias cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {barbearias && (
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-sm">{JSON.stringify(barbearias, null, 2)}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleListBarbearias} disabled={loading.list}>
              {loading.list ? "Listando..." : "Listar Barbearias"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criar Barbearia de Teste</CardTitle>
            <CardDescription>Cria uma barbearia de teste para depuração</CardDescription>
          </CardHeader>
          <CardContent>
            {testResult && (
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateTest} disabled={loading.create}>
              {loading.create ? "Criando..." : "Criar Barbearia de Teste"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
