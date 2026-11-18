// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readWorkspaceBody } from '../hub-auth.server';
import { ENGINE_PREPARATION_MAX_BYTES } from '../engine-session-documents.contract';
function body(length: number) {
  return new Request('https://academy.test', {method:'POST',body:JSON.stringify({content:'a'.repeat(length)})});
}
describe('límites de preparación de documentos',()=>{
  it('conserva 32 KiB en aula y acepta documentos en el límite de entrega',async()=>{
    await expect(readWorkspaceBody(body(40000))).rejects.toThrow('límite');
    await expect(readWorkspaceBody(body(40000),ENGINE_PREPARATION_MAX_BYTES)).resolves.toMatchObject({content:expect.any(String)});
  });
  it('rechaza una entrega que supera el presupuesto de documentos',async()=>{
    await expect(readWorkspaceBody(body(ENGINE_PREPARATION_MAX_BYTES),ENGINE_PREPARATION_MAX_BYTES)).rejects.toThrow('límite');
  });
});
