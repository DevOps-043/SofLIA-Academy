import crypto from 'crypto'

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range'
const HIBP_USER_AGENT = 'SofLIA-Academy-Security-Audit'

export interface PasswordBreachCheckResult {
  breachCount?: number
  isBreached: boolean
  skipped: boolean
}

export async function checkPasswordAgainstHibp(
  password: string,
  fetcher: typeof fetch = fetch,
): Promise<PasswordBreachCheckResult> {
  const sha1 = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)

  try {
    const response = await fetcher(`${HIBP_RANGE_URL}/${prefix}`, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': HIBP_USER_AGENT,
      },
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) {
      return { isBreached: false, skipped: true }
    }

    const breachCount = findBreachCount(await response.text(), suffix)
    return {
      breachCount,
      isBreached: breachCount > 0,
      skipped: false,
    }
  } catch {
    return { isBreached: false, skipped: true }
  }
}

export async function validatePasswordIsNotBreached(
  password: string,
): Promise<string | null> {
  const breachCheck = await checkPasswordAgainstHibp(password)

  if (breachCheck.isBreached) {
    return 'Esta contrasena aparece en filtraciones conocidas. Elige una contrasena diferente.'
  }

  if (breachCheck.skipped && process.env.HIBP_PASSWORD_CHECK_MODE === 'strict') {
    return 'No se pudo validar la contrasena contra el servicio de filtraciones. Intenta nuevamente.'
  }

  return null
}

function findBreachCount(responseText: string, suffix: string): number {
  for (const line of responseText.split('\n')) {
    const [lineSuffix, countText] = line.trim().split(':')
    if (lineSuffix === suffix) {
      const count = Number(countText)
      return Number.isFinite(count) ? count : 0
    }
  }

  return 0
}
