import { ImageMedia } from '../image-media.vo';

class StubImageMedia extends ImageMedia {}

describe('ImageMedia Unit Tests', () => {
  describe('constructor', () => {
    it('should create a valid ImageMedia object', () => {
      // Arrange
      const name = 'name';
      const location = 'location';

      // Act
      const imageMedia = new StubImageMedia({ name, location });

      // Assert
      expect(imageMedia).toBeDefined();
      expect(imageMedia.name).toEqual(name);
      expect(imageMedia.location).toEqual(location);
    });
  });

  describe('toJSON', () => {
    it('should return a JSON object with the ImageMedia properties', () => {
      // Arrange
      const name = 'name';
      const location = 'location';
      const imageMedia = new StubImageMedia({ name, location });

      // Act
      const json = imageMedia.toJSON();

      // Assert
      expect(json).toBeDefined();
      expect(json).toEqual({ name, location });
    });
  });
});
