export const getJwk = async (kid: string) => {
  const certs = await fetch("https://api.line.me/oauth2/v2.1/certs");
  const { keys } = (await certs.json()) as { keys: JsonWebKeyWithKid[] };
  const jwk = keys.find((jwk) => jwk.kid === kid);
  if (!jwk) throw new Error("JWK not found");
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
};
