export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normPhone(raw: string): string {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+234')) d = d.slice(4);
  else if (/^234\d{10}$/.test(d)) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.replace(/\D/g, '');
}

export const phoneOk = (d: string): boolean => /^[789]\d{9}$/.test(d);

export const fmtPhone = (d: string): string => {
  const clean = normPhone(d);
  if (clean.length === 10) {
    return '+234 ' + clean.slice(0, 3) + ' ' + clean.slice(3, 6) + ' ' + clean.slice(6, 10);
  }
  return d;
};

const COMMON_PW = /^(password|passw0rd|12345678|123456789|1234567890|qwerty|qwertyui|11111111|iloveyou|admin123|letmein|welcome1|abc12345|endra123)/i;

export function pwScore(p: string): number {
  if (!p) return 0;
  const cls = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  if (p.length < 8 || COMMON_PW.test(p)) return 1;
  if ((p.length >= 12 && cls >= 3) || (p.length >= 10 && cls === 4)) return 4;
  if (p.length >= 10 && cls >= 3) return 3;
  return cls >= 2 ? 2 : 1;
}

export const PW_LBL = ['', 'Weak', 'Okay', 'Good', 'Strong'];

export const rid = (n = 12): string => {
  try {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let s = '';
    for (let i = 0; i < n * 2; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
};

export async function hashPw(pw: string, salt: string): Promise<string> {
  const s = salt + ':' + pw;
  try {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h1 = 0xdeadbeef ^ s.length;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'f' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
}
