import {
  MediaFileValidator,
  InvalidMediaFileSizeError,
  InvalidMediaFileMimeTypeError,
} from './media-file.validator';

describe('MediaFileValidator Unit Tests', () => {
  const validator = new MediaFileValidator(1024 * 1024, [
    'image/png',
    'image/jpeg',
  ]);

  it('should throw an error if the file size is too large', () => {
    const data = Buffer.alloc(1024 * 1024 + 1);
    expect(() =>
      validator.validate({
        raw_name: 'test.png',
        data,
        mime_type: 'image/png',
        size: data.length,
      }),
    ).toThrow(new InvalidMediaFileSizeError(data.length, validator.max_size));
  });

  it('should throw an error if the file mime type is not valid', () => {
    const data = Buffer.alloc(1024);
    expect(() =>
      validator.validate({
        raw_name: 'test.txt',
        data,
        mime_type: 'text/plain',
        size: data.length,
      }),
    ).toThrow(
      new InvalidMediaFileMimeTypeError(
        'text/plain',
        validator.valid_mime_types,
      ),
    );
  });
});
