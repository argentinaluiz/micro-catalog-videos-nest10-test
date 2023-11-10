import { Storage } from '@google-cloud/storage';
import { GoogleCloudStorage } from '../google-cloud.storage';
import { Config } from '../../config';

describe('GoogleCloudStorage Integration Tests', () => {
  let googleCloudStorage: GoogleCloudStorage;

  beforeEach(async () => {
    const storageSdk = new Storage({
      //retirar os 2 \\n e adicionar o locatime no docker-compose.yml
      credentials: Config.googleCredentials(),
    });
    googleCloudStorage = new GoogleCloudStorage(
      storageSdk,
      Config.bucketName(),
    );
  });

  it('should store a file', async () => {
    await googleCloudStorage.store({
      data: Buffer.from('data'),
      id: 'location/1.txt',
      mime_type: 'text/plain',
    });

    const file = await googleCloudStorage.get('location/1.txt');
    expect(file.data.toString()).toBe('data');
    expect(file.mime_type).toBe('text/plain');
    expect(file.name).toBe('location/1.txt');
  }, 10000);
});