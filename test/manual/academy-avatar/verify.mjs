/* global document, getComputedStyle, innerWidth */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const reports = new URL('../../../docs/reports/academy-avatar/', import.meta.url);
await fs.mkdir(reports, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const result = { checks: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  page.on('pageerror', error => result.errors.push(error.message));
  await page.route('https://**/*', route => route.abort());
  await page.route('**/api/qa-local/business-user/notebook/notes/nota-local/assistant', async route => {
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ json: { reply: 'Preparé una propuesta que puedes revisar antes de aplicarla.', proposedContent: '<p>Una idea más clara para tu apunte.</p>' } });
  });
  await page.goto('http://127.0.0.1:4332/', { waitUntil: 'networkidle' });
  await page.locator('.soflia-avatar__layer').first().waitFor();
  await page.locator('.soflia-avatar__layer').evaluateAll(async images => Promise.all(images.map(image => image.decode())));
  const general = page.locator('[data-qa-surface="general"]'); const course = page.locator('[data-qa-surface="course"]'); const notebook = page.locator('[data-qa-surface="notebook"]');
  assert.equal(await page.locator('img[src*="/lia-avatar."]').count(), 0);
  const verifySingleProfile = async () => {
    for (const surface of [general, course, notebook]) {
      assert.equal(await surface.locator('.soflia-avatar').count(), 1);
      assert.equal(await surface.locator('header .soflia-avatar').count(), 1);
    }
  };
  for (const surface of [general, course, notebook]) {
    assert.equal(await surface.locator('[data-soflia-welcome]').count(), 1);
    assert.equal(await surface.locator('header .soflia-avatar').count(), 1);
  }
  await page.locator('.qa-grid').screenshot({ path: fileURLToPath(new URL('welcome.png', reports)) });
  await page.locator('.qa-expressions').evaluate(element => { element.hidden = true; });
  await page.getByLabel('Mostrar acceso flotante').check();
  const launcher = page.getByRole('button', {name:'Abrir asistente SofLIA'});
  await launcher.waitFor({state:'visible'});
  const look = await launcher.evaluate(element => ({bg:getComputedStyle(element).backgroundColor, shadow:getComputedStyle(element).boxShadow, width:element.getBoundingClientRect().width}));
  assert.equal(look.bg, 'rgba(0, 0, 0, 0)'); assert.equal(look.shadow, 'none');
  await page.waitForTimeout(350);
  assert.equal(await launcher.evaluate(element => getComputedStyle(element).width), '96px');
  await launcher.screenshot({ path: fileURLToPath(new URL('launcher.png', reports)) });
  await launcher.click();
  await page.locator('.qa-expressions').evaluate(element => { element.hidden = false; });
  await notebook.locator('textarea').fill('Hola'); await notebook.locator('textarea').fill('');
  result.checks.push('Bienvenida central de 260 px y acceso flotante de 96 px transparente, sin burbuja');
  await general.locator('textarea').fill('No entiendo??');
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="general"] .soflia-avatar').dataset.expression === 'confused');
  await course.locator('textarea').fill('wow!!');
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="course"] .soflia-avatar').dataset.expression === 'surprised');
  await verifySingleProfile();
  await general.locator('textarea').fill('');
  assert.equal(await general.locator('[data-soflia-welcome]').count(), 0);
  await general.locator('textarea').fill('No entiendo??');
  result.checks.push('Primer borrador oculta la bienvenida sin reaparecer al borrarlo; sólo queda el perfil superior');
  await page.locator('.qa-grid').screenshot({ path: fileURLToPath(new URL('dark.png', reports)) });
  await page.getByLabel('Con conversación').check();
  await verifySingleProfile();
  await general.locator('textarea').fill(''); await course.locator('textarea').fill('');
  await page.getByRole('button', { name: 'Audio local de prueba' }).click();
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-qa-surface="general"] .soflia-avatar');
    return element.dataset.expression === 'speaking' && parseFloat(element.style.getPropertyValue('--avatar-energy')) > .1;
  });
  const mouth = general.locator('.avatar-face__mouth'); const contour = await mouth.getAttribute('d');
  await page.waitForTimeout(250); assert.notEqual(await mouth.getAttribute('d'), contour);
  result.checks.push('Audio WAV local del reproductor compartido medido sin otra captura ni cambios al reproductor');
  await notebook.locator('textarea').fill('Sugiere una mejora para este apunte');
  await notebook.getByRole('button', { name: 'Enviar' }).click();
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="notebook"] .soflia-avatar').dataset.expression === 'thinking');
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="notebook"] .soflia-avatar').dataset.expression === 'warning');
  await notebook.getByRole('button', { name: 'Aplicar' }).click();
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="notebook"] .soflia-avatar').dataset.expression === 'success');
  result.checks.push('Cuaderno: espera real, propuesta pendiente, aplicación explícita y éxito');
  await page.getByLabel('Tema oscuro').uncheck();
  await page.waitForFunction(() => document.querySelector('[data-qa-surface="general"] .soflia-avatar').dataset.expression !== 'speaking');
  await page.locator('.qa-grid').screenshot({ path: fileURLToPath(new URL('light.png', reports)) });
  await page.getByRole('button', { name: 'Cambiar idioma' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('[role="img"]')].some(element => element.getAttribute('aria-label')?.startsWith('SofLIA:')));
  await page.getByRole('button', { name: 'Cambiar idioma' }).click();
  result.checks.push('Tema claro y traducciones EN/PT cargadas sin cambiar la identidad');
  await page.setViewportSize({ width: 390, height: 844 });
  await verifySingleProfile();
  assert.equal(await general.locator('header .soflia-avatar').evaluate(element => getComputedStyle(element.parentElement).width), '72px');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('.qa-grid').screenshot({ path: fileURLToPath(new URL('mobile.png', reports)) });
  await page.setViewportSize({ width: 320, height: 700 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await verifySingleProfile();
  result.checks.push('Paneles y compositor a 390 px sin desbordamiento horizontal');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => [...document.querySelectorAll('.soflia-avatar')].every(element => element.dataset.running === 'false'));
  result.checks.push('Movimiento reducido detiene los motores y conserva el estado legible');
  assert.deepEqual(result.errors, []);
  await fs.writeFile(new URL('browser-qa.json', reports), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
