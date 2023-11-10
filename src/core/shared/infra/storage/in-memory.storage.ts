import { IStorage } from '../../application/storage.interface';

export class InMemoryStorage implements IStorage {
  private storage: Map<string, { data; mime_type }> = new Map();

  async store({
    data,
    id,
    mime_type,
  }: {
    data: Buffer;
    id: string;
    mime_type?: string;
  }) {
    this.storage.set(id, { data, mime_type });
  }

  async get(
    id: string,
  ): Promise<{ data: Buffer; mime_type: string; name: string }> {
    const { data, mime_type } = this.storage.get(id);
    return { data, mime_type, name: id };
  }
}
