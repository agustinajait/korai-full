import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verificación del "magic link" que OportunAI genera para derivar un
 * usuario a Korai (dirección OportunAI → Korai).
 *
 * El token es un JWT HS256 estándar (header.payload.signature en base64url)
 * firmado con el secreto compartido KORAI_JOIN_SECRET. No sumamos una
 * librería de JWT nueva porque HS256 es simplemente un HMAC-SHA256 sobre
 * "<header>.<payload>": lo verificamos a mano con el módulo `crypto` de Node.
 *
 * Payload esperado (a generar del lado de OportunAI con el mismo secreto):
 * {
 *   origen: "oportunai"
 *   oportunai_user_id: string
 *   nombre_completo: string
 *   email: string
 *   telefono?: string
 *   perfil_url?: string   // link al perfil/CV en OportunAI, opcional
 *   iat: number           // segundos desde epoch
 *   exp: number           // segundos desde epoch
 * }
 */

export interface JoinTokenPayload {
  origen: "oportunai";
  oportunai_user_id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  perfil_url?: string;
  iat: number;
  exp: number;
}

export type JoinTokenErrorCode =
  | "config"
  | "malformed"
  | "invalid_signature"
  | "expired"
  | "invalid_payload";

export class JoinTokenError extends Error {
  code: JoinTokenErrorCode;

  constructor(code: JoinTokenErrorCode) {
    super(`join token error: ${code}`);
    this.name = "JoinTokenError";
    this.code = code;
  }
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

/**
 * Verifica la firma y expiración de un magic link token de OportunAI.
 * Lanza JoinTokenError si el token es inválido, expiró, o falta configurar
 * KORAI_JOIN_SECRET en el entorno.
 */
export function verifyJoinToken(token: string): JoinTokenPayload {
  const secret = process.env.KORAI_JOIN_SECRET;
  if (!secret) {
    throw new JoinTokenError("config");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JoinTokenError("malformed");
  }
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string };
  let payload: Partial<JoinTokenPayload>;
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString("utf8"));
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    throw new JoinTokenError("malformed");
  }

  if (header.alg !== "HS256") {
    throw new JoinTokenError("malformed");
  }

  let actualSignature: Buffer;
  try {
    actualSignature = base64UrlDecode(signatureB64);
  } catch {
    throw new JoinTokenError("malformed");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new JoinTokenError("invalid_signature");
  }

  if (typeof payload.exp !== "number" || Date.now() >= payload.exp * 1000) {
    throw new JoinTokenError("expired");
  }

  if (
    payload.origen !== "oportunai" ||
    !payload.oportunai_user_id ||
    !payload.nombre_completo ||
    !payload.email
  ) {
    throw new JoinTokenError("invalid_payload");
  }

  return payload as JoinTokenPayload;
}
