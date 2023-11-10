import {
  AudioVideoMedia,
  AudioVideoMediaStatus,
} from '../audio-video-media.vo';

class StubAudioVideoMedia extends AudioVideoMedia {}

describe('AudioVideoMedia Unit Tests', () => {
  describe('constructor', () => {
    it('should create a valid AudioVideoMedia object', () => {
      // Arrange
      const name = 'name';
      const raw_location = 'raw_location';
      const encoded_location = 'encoded_location';
      const status = AudioVideoMediaStatus.PENDING;

      // Act
      const audioVideoMedia = new StubAudioVideoMedia({
        name,
        raw_location,
        encoded_location,
        status,
      });

      // Assert
      expect(audioVideoMedia).toBeDefined();
      expect(audioVideoMedia.name).toEqual(name);
      expect(audioVideoMedia.raw_location).toEqual(raw_location);
      expect(audioVideoMedia.encoded_location).toEqual(encoded_location);
      expect(audioVideoMedia.status).toEqual(status);
    });
  });

  describe('toJSON', () => {
    it('should return a JSON object with the AudioVideoMedia properties', () => {
      // Arrange
      const name = 'name';
      const raw_location = 'raw_location';
      const encoded_location = 'encoded_location';
      const status = AudioVideoMediaStatus.PENDING;
      const audioVideoMedia = new StubAudioVideoMedia({
        name,
        raw_location,
        encoded_location,
        status,
      });

      // Act
      const json = audioVideoMedia.toJSON();

      // Assert
      expect(json).toBeDefined();
      expect(json).toEqual({
        name,
        raw_location,
        encoded_location,
        status,
      });
    });
  });
});
