export const verifyTurnstile = async (token: string, ip: string | null) => {
  const formData = new FormData();
  formData.append("secret", import.meta.env.TURNSTILE_SECRET);
  formData.append("response", token);
  if (ip) {
    formData.append("remoteip", ip);
  }

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  try {
    const result = await fetch(url, {
      body: formData,
      method: "POST",
    });

    const outcome = (await result.json()) as { success: boolean };
    if (outcome.success) {
      return true;
    }
  } catch {}
  return false;
};
