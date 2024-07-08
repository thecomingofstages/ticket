export async function validateSignature(
  body: ArrayBuffer,
  channelSecret: string,
  base64Signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const signatureBuffer = encoder.encode(base64Signature);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const bodySignature = await crypto.subtle.sign("HMAC", key, body);
  return crypto.subtle.timingSafeEqual(bodySignature, signatureBuffer);
}
