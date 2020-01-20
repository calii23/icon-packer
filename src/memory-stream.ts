import {Writable} from 'stream';

export class MemoryWriteStream extends Writable {
    private buffer: Buffer = Buffer.alloc(1024);
    private offset: number = 0;

    _write(chunk: any, encoding: string, callback: (error?: (Error | null)) => void): void {
        if (this.buffer.length < chunk.length + this.offset) {
            let oldBuffer = this.buffer;
            this.buffer = Buffer.alloc(chunk.length + this.offset + 1024);
            oldBuffer.copy(this.buffer);
        }
        if (encoding === 'buffer' && Buffer.isBuffer(chunk)) {
            chunk.copy(this.buffer, this.offset);
            this.offset += chunk.length;
        } else {
            let value = chunk.toString();
            this.offset += this.buffer.write(value, this.offset, encoding);
        }
        callback();
    }

    public toBuffer(): Buffer {
        if (this.buffer.length === this.offset) return this.buffer;
        return this.buffer.slice(0, this.offset);
    }
}
