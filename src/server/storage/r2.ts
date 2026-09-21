import "server-only";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/server/config/env";

/**
 * Cliente S3-compatible para Cloudflare R2 (`arquitectura.md` §7.1). R2 se
 * habla con el SDK de S3 apuntando a su endpoint de cuenta.
 */
export function crearClienteR2() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/** Confirma que el objeto existe tras la subida directa navegador→R2 y
 * regresa su tamaño y tipo declarado — paso 5 de §7.1 antes de dar el
 * archivo por bueno. */
export async function verificarObjetoSubido(bucket: string, key: string) {
  const cliente = crearClienteR2();
  const resultado = await cliente.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    existe: true,
    tamanoBytes: resultado.ContentLength ?? 0,
    tipoDeclarado: resultado.ContentType ?? "",
  };
}

/** Lee los primeros bytes del objeto para verificar el tipo REAL (magic
 * bytes), no solo la extensión ni el `Content-Type` declarado por el
 * navegador (criterio C2.2). */
export async function leerPrimerosBytes(bucket: string, key: string, bytes = 32): Promise<Buffer> {
  const cliente = crearClienteR2();
  const resultado = await cliente.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${bytes - 1}` }),
  );
  const cuerpo = await resultado.Body?.transformToByteArray();
  return Buffer.from(cuerpo ?? []);
}
