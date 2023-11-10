import crypto from 'crypto';

export class MediaFileValidator {
  constructor(
    readonly max_size: number,
    readonly valid_mime_types: string[],
  ) {}

  validate({
    raw_name,
    mime_type,
    size,
  }: {
    raw_name: string;
    data: Buffer;
    mime_type: string;
    size: number;
  }) {
    const isSizeValid = this.validateSize(size);
    if (!isSizeValid) {
      throw new InvalidMediaFileSizeError(size, this.max_size);
    }
    const isMimeTypeValid = this.validateMimeType(mime_type);
    if (!isMimeTypeValid) {
      throw new InvalidMediaFileMimeTypeError(mime_type, this.valid_mime_types);
    }

    return {
      name: this.generateHasName(raw_name),
    };
  }

  protected validateSize(size: number): boolean {
    return size <= this.max_size;
  }

  protected validateMimeType(mime_type: string): boolean {
    return this.valid_mime_types.includes(mime_type);
  }

  protected generateHasName(rawName: string) {
    const extension = rawName.split('.').pop();
    return (
      crypto
        .createHash('sha256')
        .update(rawName + Date.now() + Math.random())
        .digest('hex') +
      '.' +
      extension
    );
  }
}

export class InvalidMediaFileSizeError extends Error {
  constructor(actual_size: number, max_size: number) {
    super(`Invalid media file size: ${actual_size} > ${max_size}`);
  }
}

export class InvalidMediaFileMimeTypeError extends Error {
  constructor(actual_mimeType: string, valid_mime_types: string[]) {
    super(
      `Invalid media file mime type: ${actual_mimeType} not in ${valid_mime_types.join(
        ', ',
      )}`,
    );
  }
}
