import enJSONData from '@/locales/en.json'

const enJSON: { [key: string]: string } = enJSONData as { [key: string]: string }

export const t = (key: string, vars?: Record<string, string | number>) => {
  let text = enJSON[key] || key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), String(v))
    })
  }
  return text
}
