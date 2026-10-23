// Test de tráfico de red: hace lo mismo que alguien mirando con Wireshark.
// Captura con tshark mientras se registra un usuario, hace login y pide sus
// estudios, y después revisa que ni la contraseña ni el token aparezcan en la
// captura. Necesita la app levantada con `docker compose up -d --build` y
// Wireshark instalado (tshark + Npcap con captura de loopback).
//
//   node --test tests/wireshark.test.mjs
import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'

const HOST = process.env.APP_HOST ?? 'localhost'
const TSHARK =
  process.env.TSHARK ??
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Wireshark\\tshark.exe'
    : 'tshark')
const INTERFAZ =
  process.env.TSHARK_IFACE ??
  (process.platform === 'win32' ? '\\Device\\NPF_Loopback' : 'lo')

// El certificado es autofirmado: solo en este test se acepta sin validarlo
const agente = new https.Agent({ rejectUnauthorized: false })

function pedir(modulo, opciones, cuerpo) {
  return new Promise((resolve, reject) => {
    const req = modulo.request({ host: HOST, ...opciones }, (res) => {
      let datos = ''
      res.on('data', (c) => (datos += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, datos }))
    })
    req.on('error', reject)
    if (cuerpo) req.write(cuerpo)
    req.end()
  })
}

function pedirHttps(metodo, path, { json, token } = {}) {
  const cuerpo = json && JSON.stringify(json)
  return pedir(
    https,
    {
      port: 443,
      method: metodo,
      path,
      agent: agente,
      headers: {
        ...(cuerpo && {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(cuerpo),
        }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
    cuerpo,
  )
}

// Arranca tshark y espera a que empiece a capturar. Devuelve { fin }, una
// promesa que se cumple cuando tshark termina (va dentro de un objeto porque
// si se resolviera con la promesa directo, el await esperaría a que termine).
function capturar(archivo, segundos) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(TSHARK, [
      '-i', INTERFAZ,
      '-f', 'tcp port 443',
      '-a', `duration:${segundos}`,
      '-w', archivo,
    ])
    const fin = new Promise((r) => proceso.on('exit', r))
    proceso.on('error', reject)
    proceso.stderr.on('data', (d) => {
      // Margen para que el filtro de captura quede activo
      if (d.toString().includes('Capturing on')) setTimeout(() => resolve({ fin }), 1500)
    })
  })
}

function contarPaquetes(archivo, filtro) {
  const r = spawnSync(TSHARK, ['-r', archivo, '-Y', filtro, '-T', 'fields', '-e', 'frame.number'])
  return r.stdout.toString().split('\n').filter(Boolean).length
}

function puertoAbierto(puerto) {
  return new Promise((resolve) => {
    const s = net.connect({ host: HOST, port: puerto })
    s.setTimeout(2000)
    s.on('connect', () => (s.destroy(), resolve(true)))
    s.on('error', () => resolve(false))
    s.on('timeout', () => (s.destroy(), resolve(false)))
  })
}

describe('tráfico de red (lo que ve Wireshark)', () => {
  before(async () => {
    if (!existsSync(TSHARK) && spawnSync(TSHARK, ['-v']).error) {
      throw new Error(`No encuentro tshark en ${TSHARK}. Instalá Wireshark o indicá la ruta con TSHARK.`)
    }
    try {
      await pedirHttps('GET', '/')
    } catch {
      throw new Error(`La app no responde en https://${HOST}. Levantala con: docker compose up -d --build`)
    }
  })

  test('la contraseña y el token viajan cifrados', async () => {
    const archivo = join(mkdtempSync(join(tmpdir(), 'appsalud-')), 'captura.pcapng')
    const email = `prueba-red-${randomUUID()}@appsalud.com`
    const password = `Clave-${randomUUID()}`

    const { fin } = await capturar(archivo, 8)

    const registro = await pedirHttps('POST', '/api/users/auth/register', {
      json: { nombre: 'Prueba de red', email, password },
    })
    assert.equal(registro.status, 201, registro.datos)

    const login = await pedirHttps('POST', '/api/users/auth/login', {
      json: { email, password },
    })
    assert.equal(login.status, 200, login.datos)
    const { access_token: token } = JSON.parse(login.datos)

    const estudios = await pedirHttps('GET', '/api/estudios/estudios', { token })
    assert.equal(estudios.status, 200, estudios.datos)

    await fin
    const captura = readFileSync(archivo)

    assert.ok(contarPaquetes(archivo, 'tls') > 0, 'la captura no tiene tráfico TLS: ¿se capturó la interfaz correcta?')
    assert.equal(contarPaquetes(archivo, 'http'), 0, 'hay tráfico HTTP sin cifrar en el puerto 443')
    assert.equal(captura.includes(password), false, 'la contraseña aparece en la captura')
    assert.equal(captura.includes(email), false, 'el email aparece en la captura')
    assert.equal(captura.includes(token), false, 'el token aparece en la captura')
    assert.equal(captura.includes('"password"'), false, 'el campo "password" aparece en la captura')
  })

  test('por HTTP solo hay una redirección a HTTPS', async () => {
    const res = await pedir(http, { port: 80, method: 'GET', path: '/login' })
    assert.equal(res.status, 301)
    assert.equal(res.headers.location, `https://${HOST}/login`)
  })

  test('los servicios no se pueden usar directo sin pasar por HTTPS', async () => {
    for (const puerto of [3001, 3002, 3003]) {
      assert.equal(await puertoAbierto(puerto), false, `el puerto ${puerto} está abierto`)
    }
  })
})
