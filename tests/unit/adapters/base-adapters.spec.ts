import { describe, expect, it } from 'vitest';
import NotasAdapter from '~/adapter/adapter';
import NotasImageAdapter from '~/adapter/adapter-image';
import LocalForageAdapter from '~/adapter/localforage';

describe('adapter contracts', () => {
  it('throws not implemented for every base sync operation', async () => {
    const adapter = new NotasAdapter();
    await expect(adapter.pullFolders(0)).rejects.toThrow('Not implemented');
    await expect(adapter.pullNotes(0)).rejects.toThrow('Not implemented');
    await expect(adapter.pushFolder({})).rejects.toThrow('Not implemented');
    await expect(adapter.pushNote({})).rejects.toThrow('Not implemented');
    await expect(adapter.pullTags(0)).rejects.toThrow('Not implemented');
    await expect(adapter.pushTag({})).rejects.toThrow('Not implemented');
    await expect(adapter.pullNoteTags(0)).rejects.toThrow('Not implemented');
    await expect(adapter.pushNoteTag({})).rejects.toThrow('Not implemented');
    await expect(adapter.pushSettings({})).rejects.toThrow('Not implemented');
    await expect(adapter.pullSettings(0)).rejects.toThrow('Not implemented');
  });

  it('throws not implemented for every base image operation', async () => {
    const adapter = new NotasImageAdapter();
    await expect(adapter.uploadImage({} as any)).rejects.toThrow('Not implemented');
    await expect(adapter.deleteImage('id')).rejects.toThrow('Not implemented');
    await expect(adapter.checkConnection()).rejects.toThrow('Not implemented');
  });

  it('provides a no-op local adapter', async () => {
    const adapter = new LocalForageAdapter({});
    await expect(adapter.pullFolders(0)).resolves.toEqual([]);
    await expect(adapter.pullNotes(0)).resolves.toEqual([]);
    await expect(adapter.pushFolder({})).resolves.toEqual({});
    await expect(adapter.pushNote({})).resolves.toEqual({});
    await expect(adapter.pullTags(0)).resolves.toEqual([]);
    await expect(adapter.pushTag({})).resolves.toEqual({});
    await expect(adapter.pullNoteTags(0)).resolves.toEqual([]);
    await expect(adapter.pushNoteTag({})).resolves.toEqual({});
    await expect(adapter.pushSettings({})).resolves.toEqual({});
    await expect(adapter.pullSettings(0)).resolves.toEqual({});
  });
});
