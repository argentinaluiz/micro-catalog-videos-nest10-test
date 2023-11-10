import { Storage as GoogleCloudStorageSdk } from '@google-cloud/storage';
import { IStorage } from '../../application/storage.interface';

export class GoogleCloudStorage implements IStorage {
  constructor(
    private storageSdk: GoogleCloudStorageSdk,
    private bucketName: string,
  ) {}

  store(object: {
    data: Buffer;
    id: string;
    mime_type?: string;
  }): Promise<void> {
    const bucket = this.storageSdk.bucket(this.bucketName);
    const file = bucket.file(object.id);
    return file.save(object.data, {
      metadata: {
        contentType: object.mime_type,
      },
    });
  }

  async get(
    id: string,
  ): Promise<{ data: Buffer; mime_type: string; name: string }> {
    const file = this.storageSdk.bucket(this.bucketName).file(id);
    const [metadata, content] = await Promise.all([
      file.getMetadata(),
      file.download(),
    ]);
    return {
      data: content[0],
      mime_type: metadata[0].contentType,
      name: metadata[0].name,
    };
  }
}
