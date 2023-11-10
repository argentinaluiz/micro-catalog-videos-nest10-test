export interface IStorage {
  store(object: {
    data: Buffer;
    id: string;
    mime_type?: string;
  }): Promise<void>;

  get(id: string): Promise<{ data: Buffer; mime_type: string; name: string }>;
}
