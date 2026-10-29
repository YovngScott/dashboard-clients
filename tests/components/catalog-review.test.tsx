import { act, fireEvent, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { webcrypto } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import { CatalogReview } from '../../src/features/knowledge/CatalogReview';
import { normalizeCatalog, type Catalog } from '../../src/features/knowledge/catalog-text';
const scope={userId:'synthetic-a',organizationId:'synthetic-org-a',agentId:'synthetic-agent-a'};
const valid='Taza | 12,50 | USD | blanca | disponible';
beforeEach(()=>{
 vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Network forbidden in local catalog tests');}));
});
function source(text:string) {fireEvent.change(screen.getByLabelText('Texto fuente'),{target:{value:text}});}
async function parsed(text=valid) {source(text);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));await screen.findByRole('heading',{name:'Revisión editable'});}
function deferred<T>() {let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return{promise,resolve};}
it('requires explicit review, separates raw evidence from edited approved facts and never persists',async()=>{
 const storage=vi.spyOn(Storage.prototype,'setItem');
 render(<CatalogReview scope={scope}/>);
 fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Pega texto');
 await parsed();
 const approve=screen.getByRole('button',{name:'Aprobar línea 1'}) as HTMLButtonElement;
 expect(approve.disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox',{name:/He revisado/}));
 fireEvent.click(approve);
 expect(screen.getByRole('status').textContent).toContain('1 aprobados');
 fireEvent.change(screen.getByLabelText('Precio (línea 1)'),{target:{value:'25,75'}});
 expect(screen.getByRole('status').textContent).toContain('0 aprobados');
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe(valid);
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
 expect(fetch).not.toHaveBeenCalled();expect(storage).not.toHaveBeenCalled();
});
it('ambiguous records remain pending until corrected or explicitly unknown',async()=>{
 render(<CatalogReview scope={scope}/>);await parsed('Café | $10 | | | ');
 fireEvent.click(screen.getByRole('checkbox'));
 expect((screen.getByRole('button',{name:'Aprobar línea 1'}) as HTMLButtonElement).disabled).toBe(true);
 for(const [name,value] of [['Precio','10'],['Moneda','USD'],['Variante','no especificada'],['Disponibilidad','no especificada']])fireEvent.change(screen.getByLabelText(name+' (línea 1)'),{target:{value}});
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Aprobar línea 1'}));
 expect(screen.getByRole('status').textContent).toContain('1 aprobados');
 expect(screen.getByText(/"availability": "unknown"/)).toBeTruthy();
});
it('malicious source is rendered as text, remains blocked after edits and can only be excluded',async()=>{
 render(<CatalogReview scope={scope}/>);
 await parsed('<script>alert(1)</script> | 10 | USD | única | disponible');
 expect(document.querySelector('script')).toBeNull();
 fireEvent.change(screen.getByLabelText('Nombre (línea 1)'),{target:{value:'Taza limpia'}});
 fireEvent.click(screen.getByRole('checkbox'));
 expect((screen.getByRole('button',{name:'Aprobar línea 1'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Excluir línea 1'}));
 expect(screen.getByText('Excluido')).toBeTruthy();
 expect(screen.getByRole('status').textContent).toContain('0 aprobados');
});
it('discards obsolete normalization after the source changes',async()=>{
 const result=await normalizeCatalog(valid,scope);const pending=deferred<Catalog>();
 const normalize=vi.fn().mockReturnValue(pending.promise);
 render(<CatalogReview scope={scope} normalize={normalize}/>);
 source(valid);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));
 source('Otra fuente todavía sin normalizar');
 await act(async()=>pending.resolve(result));
 expect(screen.queryByRole('heading',{name:'Revisión editable'})).toBeNull();
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe('Otra fuente todavía sin normalizar');
});
for(const field of ['userId','organizationId','agentId'] as const)it('clears source/approval before paint on scope change: '+field,async()=>{
 const commits:string[][]=[]; const observe=()=>commits.push(Array.from(document.querySelectorAll('input,textarea')).map(e=>(e as HTMLInputElement).value));
 const view=render(<Profiler id="scope" onRender={observe}><CatalogReview scope={scope}/></Profiler>);
 await parsed();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Aprobar línea 1'}));
 commits.length=0;
 view.rerender(<Profiler id="scope" onRender={observe}><CatalogReview scope={{...scope,[field]:'other'}}/></Profiler>);
 expect(commits.flat()).not.toContain(valid);expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe('');
 expect(screen.getByRole('status').textContent).toContain('Aún no');
});
it('ignores pending normalization after unmount and after scope change',async()=>{
 const pending=deferred<Catalog>();const result=await normalizeCatalog(valid,scope);
 const view=render(<CatalogReview scope={scope} normalize={()=>pending.promise}/>);
 source(valid);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));
 view.rerender(<CatalogReview scope={{...scope,organizationId:'other'}} normalize={()=>pending.promise}/>);
 await act(async()=>pending.resolve(result));
 expect(screen.queryByRole('heading',{name:'Revisión editable'})).toBeNull();
 view.unmount();
 render(<CatalogReview scope={scope}/>);
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe('');
});
it('rejects oversized paste without silently truncating or preserving old approvals',async()=>{
 render(<CatalogReview scope={scope}/>);await parsed();
 source('a'.repeat(100001));
 expect((await screen.findByRole('alert')).textContent).toContain('No se incorporó');
 expect(screen.queryByRole('heading',{name:'Revisión editable'})).toBeNull();
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe(valid);
});
it('paginates bounded batches without autoapproval',async()=>{
 render(<CatalogReview scope={scope}/>);
 await parsed(Array.from({length:6},(_,i)=>'Producto '+i+' | 10 | USD | única | disponible').join('\n'));
 expect(screen.getAllByRole('article')).toHaveLength(5);
 fireEvent.click(screen.getByRole('button',{name:'Siguiente'}));
 expect(screen.getAllByRole('article')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'Aprobar línea 6'})).toBeTruthy();
 expect(screen.getByRole('status').textContent).toContain('0 aprobados');
});
it('excluding and restoring duplicates invalidates approvals without changing raw evidence',async()=>{
 const conflict='Taza | 10 | USD | no especificada | disponible\nTaza | 99 | USD | not specified | disponible';
 render(<CatalogReview scope={scope}/>);await parsed(conflict);
 expect(screen.getAllByText('Nombre y variante repetidos. Revisa conflictos o excluye el duplicado.')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Excluir línea 2'}));
 fireEvent.click(screen.getByRole('checkbox',{name:/línea 1/}));
 fireEvent.click(screen.getByRole('button',{name:'Aprobar línea 1'}));
 expect(screen.getByRole('status').textContent).toContain('1 aprobados');
 fireEvent.click(screen.getByRole('button',{name:'Restaurar línea 2'}));
 expect(screen.getByRole('status').textContent).toContain('0 aprobados');
 expect((screen.getByRole('button',{name:'Aprobar línea 1'}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getAllByText('Nombre y variante repetidos. Revisa conflictos o excluye el duplicado.')).toHaveLength(2);
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe(conflict);
});
it('rejects normalizer results from a different source or scope and hides unexpected error details',async()=>{
 for(const invalid of [await normalizeCatalog(valid,{...scope,userId:'other'}),await normalizeCatalog('Otra | 10 | USD | única | disponible',scope)]){
  const view=render(<CatalogReview scope={scope} normalize={async()=>invalid}/>);
  source(valid);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));
  expect((await screen.findByRole('alert')).textContent).toContain('ámbito cambió');
  expect(screen.queryByRole('heading',{name:'Revisión editable'})).toBeNull();view.unmount();
 }
 render(<CatalogReview scope={scope} normalize={async()=>{throw new Error('sensitive remote error');}}/>);
 source(valid);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));
 expect((await screen.findByRole('alert')).textContent).toContain('No se guardó nada');
 expect(document.body.textContent).not.toContain('sensitive remote error');
});
it('ignores a still-pending normalization after unmount',async()=>{
 const pending=deferred<Catalog>();const result=await normalizeCatalog(valid,scope);
 const view=render(<CatalogReview scope={scope} normalize={()=>pending.promise}/>);
 source(valid);fireEvent.click(screen.getByRole('button',{name:'Normalizar texto'}));view.unmount();
 await act(async()=>pending.resolve(result));
 render(<CatalogReview scope={scope}/>);
 expect(screen.queryByRole('heading',{name:'Revisión editable'})).toBeNull();
 expect((screen.getByLabelText('Texto fuente') as HTMLTextAreaElement).value).toBe('');
});
it('names fields independently from help and preserves focus on routine edits',async()=>{
 render(<CatalogReview scope={scope}/>);await parsed();
 const input=screen.getByRole('textbox',{name:'Precio (línea 1)'});input.focus();
 const hint=document.getElementById(input.getAttribute('aria-describedby')!);
 expect(hint?.textContent).toContain('1234,56');
 fireEvent.change(input,{target:{value:'20'}});expect(document.activeElement).toBe(input);
});
