import { IncomingHttpHeaders } from "http";
import Busboy from "busboy";
import { mkdirSync, createWriteStream, WriteStream } from "fs";

export class MultipartParser extends WriteStream {
  private allowedFields: Record<string, { filenames: string[] }>;
  private _path: { dir: string, prefix: string };
  private uploadCallback: (() => void) | null;
  private updateCallback: ((progress: number) => void) | null
  private errorCallback: ((error: string) => void) | null;
  private totalSize: number;
  private uploadSize: number;
  private busboy: Busboy.Busboy;
  private writeStream: WriteStream | null;
  writable: boolean;

  constructor(
    headers: IncomingHttpHeaders,
    path: { dir: string, prefix: string },
    allowedFields: Record<string, { filenames: string[] }>
  ) {
    super();

    this.writable = true;
    this.allowedFields = allowedFields;
    this._path = path;
    this.uploadCallback = null;
    this.updateCallback = null;
    this.errorCallback = null;
    this.totalSize = Number(headers["content-length"]);
    this.uploadSize = 0;
    this.writeStream = null;

    this.busboy = Busboy({ headers });

    this.busboy.on('file', (fieldname, stream, info) => {
      const field = this.allowedFields[fieldname];

      if (!field) {
        this.errorCallback?.(`Invalid field ${fieldname}`);
        this.writable = false;
        stream.destroy();
        return;
      }

      if (!field.filenames.includes(info.filename)) {
        this.errorCallback?.(`Invalid filename: ${info.filename}`);
        this.writable = false;
        stream.destroy();
        return;
      }

      mkdirSync(this._path.dir, { recursive: true });
      this.writeStream = createWriteStream(`${this._path.dir}/${this._path.prefix}${info.filename}`);

      stream.on('data', chunk => {
        this.uploadSize += chunk.length;
        this.writeStream?.write(chunk);
        const progress = 100 * this.uploadSize / this.totalSize;
        this.updateCallback?.(progress);
      });

      stream.on('end', () => {
        this.writeStream?.close();
      });
    });

    this.busboy.on('error', (err) => {
      this.writable = false;
      this.errorCallback?.(err as string);
    });

    this.busboy.on('finish', () => {
      this.writable = false;
      this.updateCallback?.(100);
      this.uploadCallback?.();
    });
  }

  onUpload(callback: () => void) {
    this.uploadCallback = callback;
  }

  onUpdate(callback: (number: number) => void) {
    this.updateCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.errorCallback = callback;
  }


  // write(data: Buffer) {
  //   return this.busboy.write(data);
  // }

  write(chunk: unknown): boolean {
    return this.busboy.write(chunk);
  }

  end() {
    this.busboy.end();
    return this;
  }
}
