import "server-only";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { crearClienteR2 } from "@/server/storage/r2";
import { env } from "@/server/config/env";
import { TAMANO_MAXIMO_COMPROBANTE_BYTES, type TipoComprobante } from "@/server/domain/comprobantes";

const CONTENT_TYPE_POR_TIPO: Record<TipoComprobante, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  pdf: "application/pdf",
};

const VIGENCIA_SUBIDA_SEGUNDOS = 5 * 60; // 5 minutos, arquitectura §7.1
const VIGENCIA_LECTURA_SEGUNDOS = 15 * 60; // 15 minutos, arquitectura §7.1

/**
 * URL firmada de subida directa navegador→R2 (arquitectura §7.1: la clave
 * la genera SIEMPRE el servidor, nunca el cliente; el archivo no pasa por
 * el servidor de Next.js — evita el límite de ~4.5 MB de las funciones
 * serverless con fotos de celular).
 */
export async function firmarSubidaPrivada(params: { key: string; tipo: TipoComprobante }) {
  const cliente = crearClienteR2();
  const comando = new PutObjectCommand({
    Bucket: env.R2_BUCKET_PRIVATE,
    Key: params.key,
    ContentType: CONTENT_TYPE_POR_TIPO[params.tipo],
    ContentLength: undefined, // el límite real se re-verifica con HEAD tras subir (§7.1 paso 5)
  });
  const url = await getSignedUrl(cliente, comando, { expiresIn: VIGENCIA_SUBIDA_SEGUNDOS });
  return { url, expiraEn: VIGENCIA_SUBIDA_SEGUNDOS, tamanoMaximoBytes: TAMANO_MAXIMO_COMPROBANTE_BYTES };
}

/** URL firmada de lectura de un archivo privado (comprobante). Nunca se
 * cachea (arquitectura §7.1: "Cache-Control: private, no-store" — la
 * responsabilidad de no cachear la tiene quien sirve la respuesta que
 * incluye esta URL). */
export async function firmarLecturaPrivada(key: string) {
  const cliente = crearClienteR2();
  const comando = new GetObjectCommand({ Bucket: env.R2_BUCKET_PRIVATE, Key: key });
  return getSignedUrl(cliente, comando, { expiresIn: VIGENCIA_LECTURA_SEGUNDOS });
}
